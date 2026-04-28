import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { nanoid } from "nanoid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle,
  Download,
  Palette,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  DocumentType,
  EstimatorInputs,
  getInvoice,
  getProfile,
  Invoice,
  LineItem,
  nextEstimateNumber,
  nextInvoiceNumber,
  saveInvoice,
  TradeType,
} from "@/lib/storage";
import {
  calculateLaborCost,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  formatCurrency,
} from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { StatusPill } from "@/components/StatusPill";
import { InvoicePreview } from "@/components/InvoicePreview";

const TRADE_OPTIONS: TradeType[] = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "HVAC",
  "Flooring",
  "Solar",
  "General",
];

const GENERATED_LINE_ITEM_IDS = ["labor", "materials", "overhead", "profit"];

function buildEstimatorLineItems(estimator: EstimatorInputs): LineItem[] {
  const laborCost = estimator.laborHours * estimator.hourlyRate;
  const baseCost = laborCost + estimator.materialCost + estimator.overhead;
  const profitAmount = baseCost * (estimator.profitMargin / 100);

  return [
    {
      id: "labor",
      description: `Labor (${estimator.laborHours} hrs @ ${estimator.hourlyRate}/hr)`,
      quantity: estimator.laborHours,
      rate: estimator.hourlyRate,
    },
    {
      id: "materials",
      description: "Materials",
      quantity: 1,
      rate: estimator.materialCost,
    },
    {
      id: "overhead",
      description: "Overhead",
      quantity: 1,
      rate: estimator.overhead,
    },
    {
      id: "profit",
      description: `Profit Margin (${estimator.profitMargin}%)`,
      quantity: 1,
      rate: profitAmount,
    },
  ];
}

function syncEstimatorDocument(invoice: Invoice): Invoice {
  const manualLineItems = invoice.lineItems.filter(
    (item) => !GENERATED_LINE_ITEM_IDS.includes(item.id),
  );

  return {
    ...invoice,
    lineItems: [...buildEstimatorLineItems(invoice.estimator), ...manualLineItems],
  };
}

function createDocumentDraft(documentType: DocumentType): Invoice {
  const profile = getProfile();
  const now = new Date();

  const invoice: Invoice = {
    id: nanoid(),
    documentType,
    invoiceNumber:
      documentType === "estimate" ? nextEstimateNumber() : nextInvoiceNumber(),
    status: "draft",
    issueDate: format(now, "yyyy-MM-dd"),
    dueDate: format(addDays(now, profile.defaultPaymentTermsDays), "yyyy-MM-dd"),
    currency: profile.defaultCurrency,
    trade: "General",
    business: {
      name: profile.name,
      logoDataUrl: profile.logoDataUrl,
      address: profile.address,
      email: profile.email,
      phone: profile.phone,
      brandColor: profile.brandColor,
    },
    client: {
      name: "",
      address: "",
      email: "",
    },
    estimator: {
      laborHours: 1,
      hourlyRate: profile.defaultHourlyRate,
      materialCost: 0,
      overhead: 0,
      profitMargin: 20,
    },
    lineItems: [],
    taxRate: profile.defaultTaxRate,
    discountRate: 0,
    notes:
      documentType === "estimate"
        ? "This estimate is based on the current scope and can be converted to an invoice in one click."
        : profile.defaultNotes,
    terms:
      documentType === "estimate"
        ? "Estimate valid for 14 days unless otherwise noted."
        : profile.defaultTerms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return syncEstimatorDocument(invoice);
}

export default function InvoiceEditor() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const isNew = !id || id === "new";
  const newDocumentType: DocumentType = location.startsWith("/estimate")
    ? "estimate"
    : "invoice";

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (isNew) {
      setInvoice(createDocumentDraft(newDocumentType));
      return;
    }

    if (!id) return;
    const existing = getInvoice(id);
    if (existing) {
      setInvoice(syncEstimatorDocument(existing));
    } else {
      toast.error("Document not found");
      setLocation("/");
    }
  }, [id, isNew, newDocumentType, setLocation]);

  if (!invoice) return null;

  const quoteSubtotal = calculateSubtotal(invoice);
  const quoteTax = calculateTax(invoice);
  const quoteTotal = calculateTotal(invoice);
  const laborCost = calculateLaborCost(invoice);

  const handleSave = (status?: Invoice["status"]) => {
    const updated = syncEstimatorDocument({
      ...invoice,
      status: status || invoice.status,
      updatedAt: new Date().toISOString(),
    });

    saveInvoice(updated);
    setInvoice(updated);

    if (isNew) {
      setLocation(`/document/${updated.id}`);
    }

    toast.success(
      updated.documentType === "estimate"
        ? status
          ? `Estimate marked as ${status}`
          : "Estimate saved"
        : status
          ? `Invoice marked as ${status}`
          : "Invoice saved",
    );
  };

  const handleConvertToInvoice = () => {
    if (invoice.documentType === "invoice") return;
    const profile = getProfile();
    const now = new Date();
    const updated = syncEstimatorDocument({
      ...invoice,
      documentType: "invoice",
      invoiceNumber: nextInvoiceNumber(),
      status: "draft",
      issueDate: format(now, "yyyy-MM-dd"),
      dueDate: format(addDays(now, profile.defaultPaymentTermsDays), "yyyy-MM-dd"),
      notes: profile.defaultNotes || invoice.notes,
      terms: profile.defaultTerms || invoice.terms,
      updatedAt: new Date().toISOString(),
    });

    saveInvoice(updated);
    setInvoice(updated);
    setLocation(`/document/${updated.id}`);
    toast.success("Estimate converted to invoice");
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-preview-container");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${invoice.invoiceNumber}-${invoice.client.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "client"}.pdf`,
      );
      toast.success("Branded PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  const updateField = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setInvoice((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateNestedField = (
    parent: "business" | "client",
    field: string,
    value: string,
  ) => {
    setInvoice((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value,
        },
      };
    });
  };

  const updateEstimatorField = (
    field: keyof EstimatorInputs,
    value: number,
  ) => {
    setInvoice((prev) => {
      if (!prev) return prev;
      return syncEstimatorDocument({
        ...prev,
        estimator: {
          ...prev.estimator,
          [field]: Number.isFinite(value) ? value : 0,
        },
      });
    });
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoice((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      };
    });
  };

  const addManualLineItem = () => {
    setInvoice((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: [
          ...prev.lineItems,
          { id: nanoid(), description: "Additional charge", quantity: 1, rate: 0 },
        ],
      };
    });
  };

  const removeLineItem = (id: string) => {
    setInvoice((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.filter((item) => item.id !== id),
      };
    });
  };

  const documentLabel =
    invoice.documentType === "estimate" ? "Estimate" : "Invoice";
  const isEstimate = invoice.documentType === "estimate";

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)] bg-stone-100/70">
      <div className="w-full lg:w-[44%] border-r border-stone-200 overflow-y-auto bg-background p-6 print:hidden">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Job Estimator
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {isNew ? `Create ${documentLabel}` : `Edit ${documentLabel}`}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Build a branded quote, then convert it to an invoice in one click.
              </p>
            </div>
          </div>
          <StatusPill status={invoice.status} />
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Job Setup</h2>
                <p className="text-sm text-muted-foreground">
                  Pick the trade, set dates, and lock in your document type.
                </p>
              </div>
              <BriefcaseBusiness className="h-5 w-5 text-teal-700" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{documentLabel} Number</Label>
                <Input
                  value={invoice.invoiceNumber}
                  onChange={(e) => updateField("invoiceNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Trade</Label>
                <select
                  value={invoice.trade}
                  onChange={(e) => updateField("trade", e.target.value as TradeType)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TRADE_OPTIONS.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => updateField("issueDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{isEstimate ? "Valid Until" : "Due Date"}</Label>
                <Input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => updateField("dueDate", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-background p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Estimator Inputs</h2>
                <p className="text-sm text-muted-foreground">
                  Labor, materials, overhead, margin, and tax roll into the final quote automatically.
                </p>
              </div>
              <div className="rounded-xl bg-teal-600 px-4 py-3 text-right text-white">
                <div className="text-xs uppercase tracking-[0.24em] text-teal-100">
                  Final Quote
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(quoteTotal, invoice.currency)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Labor Hours</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={invoice.estimator.laborHours}
                  onChange={(e) => updateEstimatorField("laborHours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={invoice.estimator.hourlyRate}
                  onChange={(e) => updateEstimatorField("hourlyRate", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Material Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.estimator.materialCost}
                  onChange={(e) => updateEstimatorField("materialCost", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Overhead</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.estimator.overhead}
                  onChange={(e) => updateEstimatorField("overhead", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Profit Margin (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={invoice.estimator.profitMargin}
                  onChange={(e) => updateEstimatorField("profitMargin", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={invoice.taxRate}
                  onChange={(e) => updateField("taxRate", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Labor</p>
                <p className="mt-1 font-semibold">{formatCurrency(laborCost, invoice.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pre-Tax</p>
                <p className="mt-1 font-semibold">{formatCurrency(quoteSubtotal, invoice.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax</p>
                <p className="mt-1 font-semibold">{formatCurrency(quoteTax, invoice.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Final Quote</p>
                <p className="mt-1 font-semibold">{formatCurrency(quoteTotal, invoice.currency)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-semibold">Client Details</h3>
                <p className="text-sm text-muted-foreground">
                  These appear on the branded PDF and the converted invoice.
                </p>
              </div>
              <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:underline">
                <Palette className="h-4 w-4" />
                Branding Settings
              </Link>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Name / Company</Label>
                <Input
                  value={invoice.client.name}
                  onChange={(e) => updateNestedField("client", "name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={invoice.client.email}
                  onChange={(e) => updateNestedField("client", "email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={invoice.client.address}
                  onChange={(e) => updateNestedField("client", "address", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-semibold">Quote Breakdown</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-generated from your estimator. You can add extra custom charges if needed.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {invoice.lineItems.map((item, index) => {
                  const isGenerated = GENERATED_LINE_ITEM_IDS.includes(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="flex-1 space-y-2">
                        {index === 0 && <Label>Description</Label>}
                        <Input
                          value={item.description}
                          disabled={isGenerated}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        {index === 0 && <Label>Qty</Label>}
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          disabled={isGenerated}
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))}
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        {index === 0 && <Label>Rate</Label>}
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={isGenerated}
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, "rate", Number(e.target.value))}
                        />
                      </div>
                      <div className="pt-2">
                        {index === 0 && <div className="h-4" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeLineItem(item.id)}
                          disabled={isGenerated}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <Button variant="outline" size="sm" onClick={addManualLineItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Line Item
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold">Notes & Terms</h3>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={invoice.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea
                value={invoice.terms}
                onChange={(e) => updateField("terms", e.target.value)}
                rows={3}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.8),_rgba(245,245,244,0.9))] p-4 lg:p-8 flex flex-col items-center print:block print:p-0 print:bg-white print:m-0">
        <div className="w-full max-w-[860px] mb-4 flex flex-wrap justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => handleSave()}>
            <Save className="mr-2 h-4 w-4" />
            Save {documentLabel}
          </Button>

          {isEstimate && (
            <Button variant="outline" onClick={handleConvertToInvoice}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Convert to Invoice
            </Button>
          )}

          {invoice.status !== "paid" && invoice.status !== "accepted" && (
            <Button
              variant="outline"
              className={invoice.status === "sent" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" : ""}
              onClick={() =>
                handleSave(
                  invoice.status === "sent"
                    ? isEstimate
                      ? "accepted"
                      : "paid"
                    : "sent",
                )
              }
            >
              {invoice.status === "sent" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isEstimate ? "Mark Accepted" : "Mark Paid"}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isEstimate ? "Send Estimate" : "Mark Sent"}
                </>
              )}
            </Button>
          )}

          <Button variant="default" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="w-full max-w-[860px] bg-white shadow-xl shadow-stone-300/30 border border-stone-200 rounded-[28px] overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

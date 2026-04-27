import { FormEvent, useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { nanoid } from "nanoid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { 
  getInvoice, 
  saveInvoice, 
  getProfile, 
  nextInvoiceNumber, 
  Invoice, 
  LineItem 
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Send, 
  CheckCircle,
  Plus,
  Trash2
} from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

// Components
import { InvoicePreview } from "@/components/InvoicePreview";

export default function InvoiceEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = !id || id === "new";

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (isNew) {
      const profile = getProfile();
      const now = new Date();
      setInvoice({
        id: nanoid(),
        invoiceNumber: nextInvoiceNumber(),
        status: "draft",
        issueDate: format(now, "yyyy-MM-dd"),
        dueDate: format(addDays(now, profile.defaultPaymentTermsDays), "yyyy-MM-dd"),
        currency: profile.defaultCurrency,
        business: {
          name: profile.name,
          logoDataUrl: profile.logoDataUrl,
          address: profile.address,
          email: profile.email,
          phone: profile.phone,
        },
        client: {
          name: "",
          address: "",
          email: "",
        },
        lineItems: [
          { id: nanoid(), description: "Consulting Services", quantity: 1, rate: 0 }
        ],
        taxRate: profile.defaultTaxRate,
        discountRate: 0,
        notes: profile.defaultNotes,
        terms: profile.defaultTerms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (id) {
      const existing = getInvoice(id);
      if (existing) {
        setInvoice(existing);
      } else {
        toast.error("Invoice not found");
        setLocation("/");
      }
    }
  }, [id, isNew, setLocation]);

  if (!invoice) return null;

  const handleSave = (status?: Invoice["status"]) => {
    const updated = {
      ...invoice,
      updatedAt: new Date().toISOString(),
    };
    if (status) updated.status = status;
    
    saveInvoice(updated);
    setInvoice(updated);
    
    if (isNew) {
      setLocation(`/invoice/${updated.id}`);
    }
    
    toast.success(status ? `Invoice marked as ${status}` : "Invoice saved");
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
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}-${invoice.client.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'client'}.pdf`);
      toast.success("PDF Downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  const updateField = (field: keyof Invoice, value: any) => {
    setInvoice(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateNestedField = (parent: "business" | "client", field: string, value: string) => {
    setInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      };
    });
  };

  const addLineItem = () => {
    setInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: [...prev.lineItems, { id: nanoid(), description: "", quantity: 1, rate: 0 }]
      };
    });
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map(item => item.id === id ? { ...item, [field]: value } : item)
      };
    });
  };

  const removeLineItem = (id: string) => {
    setInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.filter(item => item.id !== id)
      };
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] bg-muted/30">
      {/* Editor Pane */}
      <div className="w-full lg:w-1/2 xl:w-2/5 border-r overflow-y-auto bg-background p-6 print:hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Invoice" : "Edit Invoice"}
            </h1>
          </div>
          <StatusPill status={invoice.status} />
        </div>

        <div className="space-y-8">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input 
                value={invoice.invoiceNumber} 
                onChange={(e) => updateField("invoiceNumber", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input 
                value={invoice.currency} 
                onChange={(e) => updateField("currency", e.target.value)} 
              />
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
              <Label>Due Date</Label>
              <Input 
                type="date"
                value={invoice.dueDate} 
                onChange={(e) => updateField("dueDate", e.target.value)} 
              />
            </div>
          </div>

          {/* Client */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">Client Details</h3>
            <div className="space-y-4">
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
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold">Line Items</h3>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {invoice.lineItems.map((item, index) => (
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
                        placeholder="Description"
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      {index === 0 && <Label>Qty</Label>}
                      <Input 
                        type="number" 
                        min="0"
                        step="1"
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
                        disabled={invoice.lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <Button variant="outline" size="sm" onClick={addLineItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input 
                type="number"
                min="0"
                step="0.1"
                value={invoice.taxRate} 
                onChange={(e) => updateField("taxRate", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input 
                type="number"
                min="0"
                step="0.1"
                value={invoice.discountRate} 
                onChange={(e) => updateField("discountRate", Number(e.target.value))} 
              />
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">Notes & Terms</h3>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={invoice.notes} 
                onChange={(e) => updateField("notes", e.target.value)} 
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea 
                value={invoice.terms} 
                onChange={(e) => updateField("terms", e.target.value)} 
                rows={2}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Preview Pane */}
      <div className="flex-1 overflow-y-auto bg-muted/20 p-4 lg:p-8 flex flex-col items-center print:block print:p-0 print:bg-white print:m-0">
        <div className="w-full max-w-[800px] mb-4 flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => handleSave()}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          
          {invoice.status !== "paid" && (
            <Button 
              variant="outline" 
              className={invoice.status === "sent" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" : ""}
              onClick={() => handleSave(invoice.status === "sent" ? "paid" : "sent")}
            >
              {invoice.status === "sent" ? (
                <><CheckCircle className="mr-2 h-4 w-4" /> Mark Paid</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Mark Sent</>
              )}
            </Button>
          )}

          <Button variant="default" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* The Invoice Document */}
        <div className="w-full max-w-[800px] bg-white shadow-sm border rounded-xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  CheckCircle2,
  Copy,
  Eye,
  FilePlus2,
  MoreHorizontal,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { nanoid } from "nanoid";

import {
  deleteInvoice,
  Invoice,
  listInvoices,
  nextInvoiceNumber,
  saveInvoice,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { SummaryStats } from "@/components/SummaryStats";
import { calculateTotal, formatCurrency } from "@/lib/calculations";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setInvoices(listInvoices());
  }, []);

  const refresh = () => setInvoices(listInvoices());

  const handleDelete = () => {
    if (!deleteId) return;
    deleteInvoice(deleteId);
    refresh();
    setDeleteId(null);
    toast.success("Document deleted");
  };

  const handleDuplicate = (invoice: Invoice) => {
    const prefix = invoice.documentType === "estimate" ? "EST" : "INV";
    const newInvoice: Invoice = {
      ...invoice,
      id: nanoid(),
      invoiceNumber: `${prefix}-COPY-${invoice.invoiceNumber}`,
      status: "draft",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveInvoice(newInvoice);
    refresh();
    toast.success(`${invoice.documentType === "estimate" ? "Estimate" : "Invoice"} duplicated`);
  };

  const handleConvertToInvoice = (invoice: Invoice) => {
    const updated: Invoice = {
      ...invoice,
      documentType: "invoice",
      invoiceNumber: nextInvoiceNumber(),
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    saveInvoice(updated);
    refresh();
    toast.success("Estimate converted to invoice");
  };

  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col gap-5 rounded-[28px] border border-stone-200 bg-[linear-gradient(135deg,_rgba(15,118,110,0.08),_rgba(255,255,255,0.95)_40%)] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Smart Job Estimator
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Estimate first. Invoice in one click.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Build branded quotes for plumbing, electrical, cleaning, HVAC, flooring, solar, and general trades.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/estimate/new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create Estimate
          </Link>
        </Button>
      </div>

      <SummaryStats invoices={invoices} />

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Recent Estimates & Invoices</h2>
            <p className="text-sm text-muted-foreground">
              Manage quotes, conversion, and branded PDF exports in one place.a
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="text-right">Final Quote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium capitalize">{invoice.documentType}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/document/${invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.trade}</TableCell>
                    <TableCell>{invoice.client.name || "-"}</TableCell>
                    <TableCell>{format(new Date(invoice.issueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateTotal(invoice), invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/document/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View & Edit
                            </Link>
                          </DropdownMenuItem>
                          {invoice.documentType === "estimate" && (
                            <DropdownMenuItem onClick={() => handleConvertToInvoice(invoice)}>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Convert to Invoice
                            </DropdownMenuItem>
                          )}
                          {invoice.status === "sent" && invoice.documentType === "estimate" && (
                            <DropdownMenuItem
                              onClick={() => {
                                saveInvoice({
                                  ...invoice,
                                  status: "accepted",
                                  updatedAt: new Date().toISOString(),
                                });
                                refresh();
                                toast.success("Estimate marked as accepted");
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Accepted
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(invoice)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={() => setDeleteId(invoice.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the estimate or invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

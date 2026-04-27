import { useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Copy, Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

import { listInvoices, deleteInvoice, saveInvoice, Invoice } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function calculateTotal(invoice: Invoice) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const discount = subtotal * (invoice.discountRate / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (invoice.taxRate / 100);
  return taxable + tax;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setInvoices(listInvoices());
  }, []);

  const handleDelete = () => {
    if (deleteId) {
      deleteInvoice(deleteId);
      setInvoices(listInvoices());
      setDeleteId(null);
      toast.success("Invoice deleted");
    }
  };

  const handleDuplicate = (invoice: Invoice) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: nanoid(),
      invoiceNumber: invoice.invoiceNumber + "-COPY", // simple suffix, can be changed later
      status: "draft",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveInvoice(newInvoice);
    setInvoices(listInvoices());
    toast.success("Invoice duplicated");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your invoices and track payments.</p>
        </div>
        <Button asChild>
          <Link href="/invoice/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <SummaryStats invoices={invoices} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
        {invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoice/${invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.client.name || "—"}</TableCell>
                    <TableCell>{format(new Date(invoice.issueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
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
                            <Link href={`/invoice/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View & Edit
                            </Link>
                          </DropdownMenuItem>
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
              This action cannot be undone. This will permanently delete the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/lib/storage";
import { calculateTotal, formatCurrency } from "@/lib/calculations";

export function SummaryStats({ invoices }: { invoices: Invoice[] }) {
  const totalOutstanding = invoices
    .filter((i) => i.documentType === "invoice" && i.status === "sent")
    .reduce((sum, i) => sum + calculateTotal(i), 0);

  const totalPaid = invoices
    .filter((i) => i.documentType === "invoice" && i.status === "paid")
    .reduce((sum, i) => sum + calculateTotal(i), 0);

  const acceptedEstimates = invoices
    .filter((i) => i.documentType === "estimate" && i.status === "accepted")
    .length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const countThisMonth = invoices.filter((i) => {
    const d = new Date(i.issueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalOutstanding, "USD")}</div>
          <p className="text-xs text-muted-foreground mt-1">Sent, awaiting payment</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPaid, "USD")}</div>
          <p className="text-xs text-muted-foreground mt-1">Received all time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accepted Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{acceptedEstimates}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {countThisMonth} total documents created this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

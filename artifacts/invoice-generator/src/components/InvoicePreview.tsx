import { Invoice } from "@/lib/storage";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const discount = subtotal * (invoice.discountRate / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (invoice.taxRate / 100);
  const total = taxable + tax;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <div id="invoice-preview-container" className="p-8 sm:p-12 md:p-16 text-slate-900 bg-white min-h-[1056px]">
      <div className="flex flex-col md:flex-row justify-between gap-8 mb-16">
        <div>
          {invoice.business.logoDataUrl ? (
            <img src={invoice.business.logoDataUrl} alt="Logo" className="h-16 w-auto object-contain mb-6" />
          ) : (
            <div className="h-16 text-2xl font-bold text-slate-900 flex items-center mb-6">
              {invoice.business.name || "Your Company"}
            </div>
          )}
          <div className="text-sm text-slate-500 space-y-1">
            <p className="font-medium text-slate-900">{invoice.business.name}</p>
            {invoice.business.address.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <p>{invoice.business.email}</p>
            <p>{invoice.business.phone}</p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-2 tracking-tight">INVOICE</h1>
          <p className="text-lg text-slate-500 font-medium tracking-wide mb-6">{invoice.invoiceNumber}</p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 text-sm">
            <div className="flex justify-start md:justify-end gap-4">
              <span className="text-slate-500 w-24 text-left md:text-right">Issue Date</span>
              <span className="font-medium text-slate-900 w-24 text-left md:text-right">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex justify-start md:justify-end gap-4">
              <span className="text-slate-500 w-24 text-left md:text-right">Due Date</span>
              <span className="font-medium text-slate-900 w-24 text-left md:text-right">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
        <div className="text-sm space-y-1 text-slate-800">
          <p className="font-medium text-base text-slate-900">{invoice.client.name || "Client Name"}</p>
          {invoice.client.address ? invoice.client.address.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          )) : <p className="text-slate-400 italic">Client Address</p>}
          <p>{invoice.client.email}</p>
        </div>
      </div>

      <div className="mb-16">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-slate-900">
              <th className="py-3 text-left font-semibold">Description</th>
              <th className="py-3 text-right font-semibold">Rate</th>
              <th className="py-3 text-right font-semibold">Qty</th>
              <th className="py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lineItems.map((item, index) => (
              <tr key={item.id || index}>
                <td className="py-4 text-slate-800">{item.description || "Item Description"}</td>
                <td className="py-4 text-right text-slate-600">{formatCurrency(item.rate, invoice.currency)}</td>
                <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                <td className="py-4 text-right font-medium text-slate-900">{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-16">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <div className="space-y-3 text-sm border-b border-slate-200 pb-4 mb-4">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, invoice.currency)}</span>
            </div>
            {invoice.discountRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount ({invoice.discountRate}%)</span>
                <span>-{formatCurrency(discount, invoice.currency)}</span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>{formatCurrency(tax, invoice.currency)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-500 space-y-6 pt-8 border-t border-slate-200">
        {invoice.notes && (
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Notes</h4>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Terms & Conditions</h4>
            <p className="whitespace-pre-wrap">{invoice.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Invoice } from "@/lib/storage";
import {
  calculateTax,
  calculateTotal,
  calculateSubtotal,
  formatCurrency,
} from "@/lib/calculations";

function formatDate(dateString: string) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  } catch {
    return dateString;
  }
}

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const subtotal = calculateSubtotal(invoice);
  const tax = calculateTax(invoice);
  const total = calculateTotal(invoice);
  const accent = invoice.business.brandColor || "#0f766e";
  const title = invoice.documentType === "estimate" ? "Estimate" : "Invoice";
  const dateLabel = invoice.documentType === "estimate" ? "Valid Until" : "Due Date";

  return (
    <div
      id="invoice-preview-container"
      className="min-h-[1056px] bg-white text-slate-900"
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent}10 0%, transparent 28%)`,
      }}
    >
      <div
        className="h-3 w-full"
        style={{ backgroundColor: accent }}
      />
      <div className="p-8 sm:p-12 md:p-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="mb-8">
              {invoice.business.logoDataUrl ? (
                <img
                  src={invoice.business.logoDataUrl}
                  alt="Logo"
                  className="mb-5 h-16 w-auto object-contain"
                />
              ) : (
                <div
                  className="mb-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em]"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {invoice.trade}
                </div>
              )}
              <p className="text-2xl font-semibold tracking-tight text-slate-950">
                {invoice.business.name || "Your Business"}
              </p>
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              {invoice.business.address.split("\n").filter(Boolean).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {invoice.business.email && <p>{invoice.business.email}</p>}
              {invoice.business.phone && <p>{invoice.business.phone}</p>}
            </div>
          </div>

          <div className="md:text-right">
            <div
              className="inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              {invoice.trade} {title}
            </div>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="mt-2 text-lg font-medium text-slate-500">
              {invoice.invoiceNumber}
            </p>

            <div className="mt-8 grid gap-3 text-sm">
              <div className="flex justify-between gap-8 md:justify-end">
                <span className="text-slate-500">Issue Date</span>
                <span className="font-medium text-slate-900">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between gap-8 md:justify-end">
                <span className="text-slate-500">{dateLabel}</span>
                <span className="font-medium text-slate-900">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between gap-8 md:justify-end">
                <span className="text-slate-500">Quote Total</span>
                <span className="font-semibold text-slate-950">{formatCurrency(total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-[1.2fr,0.8fr]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
              {invoice.documentType === "estimate" ? "Prepared For" : "Bill To"}
            </h3>
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              <p className="text-lg font-semibold text-slate-950">
                {invoice.client.name || "Client Name"}
              </p>
              {invoice.client.address ? (
                invoice.client.address.split("\n").map((line, i) => <p key={i}>{line}</p>)
              ) : (
                <p className="italic text-slate-400">Client address</p>
              )}
              {invoice.client.email && <p>{invoice.client.email}</p>}
            </div>
          </div>

          <div
            className="rounded-3xl border border-slate-200 p-6"
            style={{ boxShadow: `inset 0 1px 0 ${accent}14` }}
          >
            <h3 className="text-sm font-semibold text-slate-950">Estimator Snapshot</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Labor Hours</span>
                <span className="font-medium text-slate-900">{invoice.estimator.laborHours}</span>
              </div>
              <div className="flex justify-between">
                <span>Hourly Rate</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(invoice.estimator.hourlyRate, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Materials</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(invoice.estimator.materialCost, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overhead</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(invoice.estimator.overhead, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profit Margin</span>
                <span className="font-medium text-slate-900">{invoice.estimator.profitMargin}%</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium text-slate-900">{invoice.taxRate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 text-left font-semibold uppercase tracking-[0.2em]">Description</th>
                <th className="py-3 text-right font-semibold uppercase tracking-[0.2em]">Rate</th>
                <th className="py-3 text-right font-semibold uppercase tracking-[0.2em]">Qty</th>
                <th className="py-3 text-right font-semibold uppercase tracking-[0.2em]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lineItems.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="py-4 text-slate-800">{item.description || "Item Description"}</td>
                  <td className="py-4 text-right text-slate-600">
                    {formatCurrency(item.rate, invoice.currency)}
                  </td>
                  <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-4 text-right font-medium text-slate-950">
                    {formatCurrency(item.quantity * item.rate, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-14 flex justify-end">
          <div className="w-full max-w-sm rounded-3xl bg-slate-50 p-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>{formatCurrency(tax, invoice.currency)}</span>
              </div>
              <div
                className="flex justify-between border-t pt-4 text-lg font-semibold text-slate-950"
                style={{ borderColor: `${accent}28` }}
              >
                <span>Final Quote</span>
                <span>{formatCurrency(total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-slate-200 pt-8 text-sm text-slate-600">
          {invoice.notes && (
            <div className="mb-6">
              <h4 className="mb-2 font-semibold text-slate-950">Notes</h4>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="mb-2 font-semibold text-slate-950">
                {invoice.documentType === "estimate" ? "Estimate Terms" : "Terms & Conditions"}
              </h4>
              <p className="whitespace-pre-wrap">{invoice.terms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

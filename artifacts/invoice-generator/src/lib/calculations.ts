import { Invoice } from "@/lib/storage";

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

export function calculateLaborCost(invoice: Invoice) {
  return invoice.estimator.laborHours * invoice.estimator.hourlyRate;
}

export function calculateSubtotal(invoice: Invoice) {
  return invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function calculateDiscount(invoice: Invoice) {
  return calculateSubtotal(invoice) * (invoice.discountRate / 100);
}

export function calculateTaxableTotal(invoice: Invoice) {
  return calculateSubtotal(invoice) - calculateDiscount(invoice);
}

export function calculateTax(invoice: Invoice) {
  return calculateTaxableTotal(invoice) * (invoice.taxRate / 100);
}

export function calculateTotal(invoice: Invoice) {
  return calculateTaxableTotal(invoice) + calculateTax(invoice);
}

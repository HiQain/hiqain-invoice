import { nanoid } from "nanoid";

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceStatus = "draft" | "sent" | "paid";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string; // ISO
  dueDate: string; // ISO
  currency: string; // ISO 4217
  business: {
    name: string;
    logoDataUrl?: string;
    address: string;
    email: string;
    phone: string;
  };
  client: {
    name: string;
    address: string;
    email: string;
  };
  lineItems: LineItem[];
  taxRate: number;
  discountRate: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessProfile = {
  name: string;
  logoDataUrl?: string;
  address: string;
  email: string;
  phone: string;
  defaultTaxRate: number;
  defaultCurrency: string;
  defaultPaymentTermsDays: number;
  defaultNotes: string;
  defaultTerms: string;
};

const INVOICES_KEY = "invoice-generator:invoices";
const PROFILE_KEY = "invoice-generator:profile";

export function listInvoices(): Invoice[] {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to list invoices", e);
    return [];
  }
}

export function getInvoice(id: string): Invoice | null {
  const invoices = listInvoices();
  return invoices.find((i) => i.id === id) || null;
}

export function saveInvoice(invoice: Invoice): void {
  try {
    const invoices = listInvoices();
    const existingIndex = invoices.findIndex((i) => i.id === invoice.id);
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error("Failed to save invoice", e);
  }
}

export function deleteInvoice(id: string): void {
  try {
    const invoices = listInvoices();
    const filtered = invoices.filter((i) => i.id !== id);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete invoice", e);
  }
}

export function getProfile(): BusinessProfile {
  const defaultProfile: BusinessProfile = {
    name: "",
    address: "",
    email: "",
    phone: "",
    defaultTaxRate: 0,
    defaultCurrency: "USD",
    defaultPaymentTermsDays: 14,
    defaultNotes: "Thank you for your business.",
    defaultTerms: "Please pay within the agreed terms.",
  };

  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile;
  } catch (e) {
    console.error("Failed to get profile", e);
    return defaultProfile;
  }
}

export function saveProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile", e);
  }
}

export function nextInvoiceNumber(): string {
  const invoices = listInvoices();
  const maxNumber = invoices.reduce((max, inv) => {
    const match = inv.invoiceNumber.match(/^INV-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);
  return `INV-${String(maxNumber + 1).padStart(4, "0")}`;
}

import { nanoid } from "nanoid";

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type DocumentType = "estimate" | "invoice";
export type InvoiceStatus = "draft" | "sent" | "accepted" | "paid";
export type TradeType =
  | "Plumbing"
  | "Electrical"
  | "Cleaning"
  | "HVAC"
  | "Flooring"
  | "Solar"
  | "General";

export type EstimatorInputs = {
  laborType: "hourly" | "project";
  laborHours: number;
  hourlyRate: number;
  projectRate?: number;
  materialCost: number;
  materials: { name: string; cost: number }[];
  overhead: number;
  profitMargin: number;
};

export type Invoice = {
  id: string;
  documentType: DocumentType;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string; // ISO
  dueDate: string; // ISO
  currency: string; // ISO 4217
  trade: TradeType;
  business: {
    name: string;
    logoDataUrl?: string;
    address: string;
    email: string;
    phone: string;
    brandColor?: string;
  };
  client: {
    name: string;
    address: string;
    email: string;
  };
  estimator: EstimatorInputs;
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
  defaultHourlyRate: number;
  defaultNotes: string;
  defaultTerms: string;
  brandColor: string;
};

const INVOICES_KEY = "invoice-generator:invoices";
const PROFILE_KEY = "invoice-generator:profile";

function defaultEstimatorInputs(hourlyRate = 85): EstimatorInputs {
  return {
    laborType: "hourly",
    laborHours: 1,
    hourlyRate,
    materialCost: 0,
    materials: [],
    overhead: 0,
    profitMargin: 20,
  };
}

function migrateInvoice(invoice: Partial<Invoice>): Invoice {
  const brandColor = invoice.business?.brandColor || "#0f766e";
  const estimator = {
    ...defaultEstimatorInputs(),
    ...(invoice.estimator || {}),
  };

  return {
    id: invoice.id || nanoid(),
    documentType: invoice.documentType || "invoice",
    invoiceNumber: invoice.invoiceNumber || nextDocumentNumber("invoice", []),
    status: invoice.status || "draft",
    issueDate: invoice.issueDate || new Date().toISOString(),
    dueDate: invoice.dueDate || invoice.issueDate || new Date().toISOString(),
    currency: invoice.currency || "USD",
    trade: invoice.trade || "General",
    business: {
      name: invoice.business?.name || "",
      logoDataUrl: invoice.business?.logoDataUrl,
      address: invoice.business?.address || "",
      email: invoice.business?.email || "",
      phone: invoice.business?.phone || "",
      brandColor,
    },
    client: {
      name: invoice.client?.name || "",
      address: invoice.client?.address || "",
      email: invoice.client?.email || "",
    },
    estimator,
    lineItems: (invoice.lineItems || []).map((item) => ({
      id: item.id || nanoid(),
      description: item.description || "",
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
    })),
    taxRate: Number(invoice.taxRate) || 0,
    discountRate: Number(invoice.discountRate) || 0,
    notes: invoice.notes || "",
    terms: invoice.terms || "",
    createdAt: invoice.createdAt || new Date().toISOString(),
    updatedAt: invoice.updatedAt || new Date().toISOString(),
  };
}

function nextDocumentNumber(documentType: DocumentType, invoices: Invoice[]): string {
  const prefix = documentType === "estimate" ? "EST" : "INV";
  const maxNumber = invoices.reduce((max, inv) => {
    if (inv.documentType !== documentType) return max;
    const match = inv.invoiceNumber.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, 0);

  return `${prefix}-${String(maxNumber + 1).padStart(4, "0")}`;
}

export function listInvoices(): Invoice[] {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed.map(migrateInvoice) : [];
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
    const normalized = migrateInvoice(invoice);
    const existingIndex = invoices.findIndex((i) => i.id === invoice.id);
    if (existingIndex >= 0) {
      invoices[existingIndex] = normalized;
    } else {
      invoices.push(normalized);
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
    defaultHourlyRate: 85,
    defaultNotes: "Thank you for your business.",
    defaultTerms: "Please pay within the agreed terms.",
    brandColor: "#0f766e",
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
  return nextDocumentNumber("invoice", listInvoices());
}

export function nextEstimateNumber(): string {
  return nextDocumentNumber("estimate", listInvoices());
}

export type VatRate = 'Standard (20%)' | 'Reduced (5%)' | 'Zero-rated (0%)' | 'Exempt' | 'Outside Scope' | 'Reverse Charge';

export const VAT_PERCENTAGES: Record<VatRate, number> = {
  'Standard (20%)': 20,
  'Reduced (5%)': 5,
  'Zero-rated (0%)': 0,
  'Exempt': 0,
  'Outside Scope': 0,
  'Reverse Charge': 0,
};

export interface CompanyDetails {
  name: string;
  address: string;
  contact: string;
  regNumber: string;
  vatNumber: string;
  logoUrl: string;
}

export interface CustomerDetails {
  name: string;
  address: string;
  contact: string;
  vatNumber?: string;
  regNumber?: string;
}

export interface Client extends CustomerDetails {
  id: string;
}

export type RecurringFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface RecurringInvoice {
  id: string;
  profileName: string;
  frequency: RecurringFrequency;
  nextIssueDate: string;
  template: InvoiceData;
  isActive: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: VatRate;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  paymentMethods: string;
  notes: string;
  seller: CompanyDetails;
  customer: CustomerDetails;
  items: InvoiceItem[];
  isVatRegistered: boolean;
  hasDeposit?: boolean;
  depositAmount?: number;
  depositVatRate?: VatRate;
  depositDueDate?: string;
  eventDate?: string;
  balanceDueDate?: string;
}

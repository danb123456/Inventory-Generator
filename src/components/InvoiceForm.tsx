import React, { useState } from 'react';
import { InvoiceData, InvoiceItem, VatRate, Client, VAT_PERCENTAGES } from '../types';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  data: InvoiceData;
  clients: Client[];
  onChange: (data: InvoiceData) => void;
  onSaveClient: (client: Client) => void;
}

export default function InvoiceForm({ data, clients, onChange, onSaveClient }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const handleClientSelect = (clientId: string) => {
    if (!clientId) {
      onChange({
        ...data,
        customer: { name: '', address: '', contact: '', vatNumber: '', regNumber: '' }
      });
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (client) {
      onChange({
        ...data,
        customer: {
          name: client.name,
          address: client.address,
          contact: client.contact,
          vatNumber: client.vatNumber || '',
          regNumber: client.regNumber || ''
        }
      });
    }
  };

  const updateField = (section: keyof InvoiceData, field: string, value: any) => {
    if (section === 'seller' || section === 'customer') {
      onChange({
        ...data,
        [section]: {
          ...(data[section] as any),
          [field]: value,
        },
      });
    } else {
      onChange({
        ...data,
        [section]: value,
      });
    }
    validateField(section, field, value);
  };

  const updateRootField = (field: keyof InvoiceData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
    validateField('root', field as string, value);
  };

  const validateField = (section: string, field: string, value: any) => {
    const newErrors = { ...errors };
    
    if (field === 'vatNumber' && value) {
      const vatRegex = /^([A-Z]{2})?[0-9]{9}$/;
      if (!vatRegex.test(value.replace(/\s/g, ''))) {
        newErrors['vatNumber'] = 'Invalid UK VAT Number format (e.g. GB123456789 or 123456789)';
      } else {
        delete newErrors['vatNumber'];
      }
    }

    if (field === 'invoiceNumber' && value) {
      const invRegex = /^[a-zA-Z0-9-]+$/;
      if (!invRegex.test(value)) {
        newErrors['invoiceNumber'] = 'Alphanumeric and hyphens only';
      } else {
        delete newErrors['invoiceNumber'];
      }
    }

    if (field === 'dueDate' || field === 'issueDate') {
      const issue = field === 'issueDate' ? value : data.issueDate;
      const due = field === 'dueDate' ? value : data.dueDate;
      if (issue && due && new Date(due) < new Date(issue)) {
        newErrors['dueDate'] = 'Due date cannot be before issue date';
      } else {
        delete newErrors['dueDate'];
      }
    }

    setErrors(newErrors);
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [
        ...data.items,
        {
          id: Math.random().toString(36).substring(2, 9),
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          vatRate: 'Standard (20%)',
        },
      ],
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    onChange({
      ...data,
      items: data.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    });
  };

  const removeItem = (id: string) => {
    onChange({
      ...data,
      items: data.items.filter((item) => item.id !== id),
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Seller Details */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Your Company Details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              value={data.seller.name}
              onChange={(e) => updateField('seller', 'name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="Acme Ltd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={data.seller.address}
              onChange={(e) => updateField('seller', 'address', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
              placeholder="123 Business Road&#10;London&#10;SW1A 1AA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Info (Email/Phone)</label>
            <input
              type="text"
              value={data.seller.contact}
              onChange={(e) => updateField('seller', 'contact', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="hello@acme.com | 020 7946 0000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Reg No.</label>
              <input
                type="text"
                value={data.seller.regNumber}
                onChange={(e) => updateField('seller', 'regNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL (Optional)</label>
              <input
                type="text"
                value={data.seller.logoUrl}
                onChange={(e) => updateField('seller', 'logoUrl', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="https://..."
              />
            </div>
          </div>
          
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="isVatRegistered"
              checked={data.isVatRegistered}
              onChange={(e) => updateRootField('isVatRegistered', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isVatRegistered" className="ml-2 block text-sm text-gray-900">
              VAT Registered
            </label>
          </div>

          {data.isVatRegistered && (
            <div>
              <label className="block text-sm font-medium text-gray-700">VAT Registration Number</label>
              <input
                type="text"
                value={data.seller.vatNumber}
                onChange={(e) => updateField('seller', 'vatNumber', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.vatNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
                placeholder="GB123456789"
              />
              {errors.vatNumber && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.vatNumber}</p>}
            </div>
          )}
        </div>
      </section>

      {/* Customer Details */}
      <section>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Customer Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!data.customer.name) return;
                onSaveClient({
                  id: Math.random().toString(36).substring(2, 9),
                  name: data.customer.name,
                  address: data.customer.address,
                  contact: data.customer.contact,
                  vatNumber: data.customer.vatNumber,
                  regNumber: data.customer.regNumber
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition-colors"
            >
              {saved ? 'Saved!' : 'Save as new Client'}
            </button>
            {clients.length > 0 && (
              <select
                onChange={(e) => handleClientSelect(e.target.value)}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1 border bg-white"
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <input
              type="text"
              value={data.customer.name}
              onChange={(e) => updateField('customer', 'name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={data.customer.address}
              onChange={(e) => updateField('customer', 'address', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Info</label>
            <input
              type="text"
              value={data.customer.contact}
              onChange={(e) => updateField('customer', 'contact', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">VAT Number (Optional)</label>
              <input
                type="text"
                value={data.customer.vatNumber || ''}
                onChange={(e) => updateField('customer', 'vatNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Reg No (Optional)</label>
              <input
                type="text"
                value={data.customer.regNumber || ''}
                onChange={(e) => updateField('customer', 'regNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Details */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Invoice Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              value={data.invoiceNumber}
              onChange={(e) => updateRootField('invoiceNumber', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.invoiceNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
            />
            {errors.invoiceNumber && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.invoiceNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={data.currency}
              onChange={(e) => updateRootField('currency', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
            >
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Date</label>
            <input
              type="date"
              value={data.issueDate}
              onChange={(e) => updateRootField('issueDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={data.dueDate}
              onChange={(e) => updateRootField('dueDate', e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.dueDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
            />
            {errors.dueDate && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.dueDate}</p>}
          </div>
        </div>
      </section>

      {/* Items */}
      <section>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Items</h2>
          <button
            onClick={addItem}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <Plus size={16} className="mr-1" /> Add Item
          </button>
        </div>
        <div className="space-y-4">
          {data.items.map((item, index) => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 relative">
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                title="Remove item"
              >
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-12">
                  <label className="block text-xs font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="Web design services"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Discount</label>
                  <select
                    value={item.discount}
                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  >
                    {Array.from({ length: 21 }, (_, i) => i * 5).map(percent => (
                      <option key={percent} value={percent}>{percent}%</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">VAT Rate</label>
                  <select
                    value={item.vatRate}
                    onChange={(e) => updateItem(item.id, 'vatRate', e.target.value as VatRate)}
                    disabled={!data.isVatRegistered}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="Standard (20%)">Standard (20%)</option>
                    <option value="Reduced (5%)">Reduced (5%)</option>
                    <option value="Zero-rated (0%)">Zero-rated (0%)</option>
                    <option value="Exempt">Exempt</option>
                    <option value="Outside Scope">Outside Scope</option>
                    <option value="Reverse Charge">Reverse Charge</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {data.items.length === 0 && (
            <p className="text-sm text-gray-500 italic">No items added. Click "Add Item" to start.</p>
          )}
        </div>
      </section>

      {/* Deposit & Split Payment */}
      <section>
        <div className="flex items-center mb-4 border-b pb-2">
          <input
            type="checkbox"
            id="hasDeposit"
            checked={data.hasDeposit}
            onChange={(e) => updateRootField('hasDeposit', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="hasDeposit" className="ml-2 block text-lg font-semibold text-gray-800">
            Deposit & Split Payment
          </label>
        </div>
        
        {data.hasDeposit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-md border border-indigo-100">
            <div>
              <label className="block text-sm font-medium text-gray-700">Deposit Amount ({data.currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={data.depositAmount}
                onChange={(e) => updateRootField('depositAmount', parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deposit VAT Rate</label>
              <select
                value={data.depositVatRate}
                onChange={(e) => updateRootField('depositVatRate', e.target.value as VatRate)}
                disabled={!data.isVatRegistered}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="Standard (20%)">Standard (20%)</option>
                <option value="Reduced (5%)">Reduced (5%)</option>
                <option value="Zero-rated (0%)">Zero-rated (0%)</option>
                <option value="Exempt">Exempt</option>
                <option value="Outside Scope">Outside Scope</option>
                <option value="Reverse Charge">Reverse Charge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deposit Due Date</label>
              <input
                type="date"
                value={data.depositDueDate}
                onChange={(e) => updateRootField('depositDueDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Date (Optional)</label>
              <input
                type="date"
                value={data.eventDate}
                onChange={(e) => {
                  const date = e.target.value;
                  updateRootField('eventDate', date);
                  if (date) {
                    // Default balance due date to 14 days before event
                    const event = new Date(date);
                    const balanceDue = new Date(event.getTime() - 14 * 24 * 60 * 60 * 1000);
                    updateRootField('balanceDueDate', balanceDue.toISOString().split('T')[0]);
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Balance Due Date</label>
              <input
                type="date"
                value={data.balanceDueDate}
                onChange={(e) => updateRootField('balanceDueDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div className="md:col-span-2 pt-2 border-t border-indigo-200 mt-2">
              <div className="flex justify-between text-sm font-semibold text-indigo-700">
                <span>Remaining Balance:</span>
                <span>{data.currency} {(data.items.reduce((acc, item) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  const discountAmount = lineTotal * (item.discount / 100);
                  const net = lineTotal - discountAmount;
                  const vat = data.isVatRegistered ? net * (VAT_PERCENTAGES[item.vatRate] / 100) : 0;
                  return acc + net + vat;
                }, 0) - (
                  (data.depositAmount || 0) + 
                  (data.isVatRegistered && data.depositVatRate ? (data.depositAmount || 0) * (VAT_PERCENTAGES[data.depositVatRate] / 100) : 0)
                )).toFixed(2)}</span>
              </div>
              {data.isVatRegistered && data.depositVatRate && data.depositAmount > 0 && (
                <div className="flex justify-between text-[10px] text-indigo-500 mt-1 italic">
                  <span>VAT to be added to deposit ({data.depositVatRate}):</span>
                  <span>{data.currency} {((data.depositAmount || 0) * (VAT_PERCENTAGES[data.depositVatRate] / 100)).toFixed(2)}</span>
                </div>
              )}
              {data.isVatRegistered && data.depositVatRate && data.depositAmount > 0 && (
                <div className="flex justify-between text-[10px] text-indigo-700 font-bold mt-1">
                  <span>Total Deposit Due:</span>
                  <span>{data.currency} {((data.depositAmount || 0) * (1 + (VAT_PERCENTAGES[data.depositVatRate] / 100))).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Payment & Notes */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Payment & Notes</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
            <input
              type="text"
              value={data.paymentTerms}
              onChange={(e) => updateRootField('paymentTerms', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="e.g. Payment due within 30 days"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Methods / Bank Details</label>
            <textarea
              value={data.paymentMethods}
              onChange={(e) => updateRootField('paymentMethods', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={2}
              placeholder="Bank Transfer: Sort Code 00-00-00, Account 12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes / Special Terms</label>
            <textarea
              value={data.notes}
              onChange={(e) => updateRootField('notes', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={2}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

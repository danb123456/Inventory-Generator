import React from 'react';
import { InvoiceData, VAT_PERCENTAGES } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Props {
  data: InvoiceData;
}

export default function InvoicePreview({ data }: Props) {
  // Calculations
  let totalNet = 0;
  let totalVat = 0;
  let hasReverseCharge = false;
  let hasZeroRated = false;
  let hasExempt = false;

  const itemsWithTotals = data.items.map(item => {
    const lineTotal = item.quantity * item.unitPrice;
    const discountAmount = lineTotal * (item.discount / 100);
    const netAmount = lineTotal - discountAmount;
    let vatAmount = 0;
    
    if (data.isVatRegistered) {
      vatAmount = netAmount * (VAT_PERCENTAGES[item.vatRate] / 100);
      if (item.vatRate === 'Reverse Charge') hasReverseCharge = true;
      if (item.vatRate === 'Zero-rated (0%)') hasZeroRated = true;
      if (item.vatRate === 'Exempt') hasExempt = true;
    }

    totalNet += netAmount;
    totalVat += vatAmount;

    return {
      ...item,
      netAmount,
      vatAmount,
      grossAmount: netAmount + vatAmount,
      discountAmount
    };
  });

  const totalPayable = totalNet + totalVat;
  
  let depositTotalDue = 0;
  let depositVatAmount = 0;
  
  if (data.hasDeposit) {
    const baseDeposit = data.depositAmount || 0;
    if (data.isVatRegistered && data.depositVatRate) {
      depositVatAmount = baseDeposit * (VAT_PERCENTAGES[data.depositVatRate] / 100);
    }
    depositTotalDue = baseDeposit + depositVatAmount;
  }

  const balanceRemaining = totalPayable - depositTotalDue;

  return (
    <div className="bg-white p-8 md:p-12 text-gray-800 font-sans min-h-[297mm] w-full box-border text-sm flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="w-1/2">
          {data.seller.logoUrl ? (
            <img src={data.seller.logoUrl} alt="Company Logo" className="max-h-20 mb-4 object-contain" referrerPolicy="no-referrer" />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.seller.name || 'Your Company Name'}</h1>
          )}
          <div className="text-gray-600 whitespace-pre-line leading-relaxed">
            {data.seller.address}
          </div>
          <div className="text-gray-600 mt-2">
            {data.seller.contact}
          </div>
        </div>
        <div className="w-1/2 text-right">
          <h2 className="text-4xl font-light text-gray-400 tracking-widest uppercase mb-4">Invoice</h2>
          <div className="grid grid-cols-2 gap-2 text-right justify-end ml-auto w-64">
            <div className="font-semibold text-gray-600">Invoice No:</div>
            <div>{data.invoiceNumber || '-'}</div>
            
            <div className="font-semibold text-gray-600">Issue Date:</div>
            <div>{formatDate(data.issueDate)}</div>
            
            <div className="font-semibold text-gray-600">Due Date:</div>
            <div>{formatDate(data.dueDate)}</div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-10">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">Billed To</h3>
        <div className="font-semibold text-lg text-gray-800">{data.customer.name || 'Customer Name'}</div>
        <div className="text-gray-600 whitespace-pre-line mt-1">
          {data.customer.address}
        </div>
        <div className="text-gray-600 mt-1">
          {data.customer.contact}
        </div>
        {(data.customer.vatNumber || data.customer.regNumber) && (
          <div className="text-gray-500 text-xs mt-2 space-y-0.5">
            {data.customer.vatNumber && <div>VAT No: {data.customer.vatNumber}</div>}
            {data.customer.regNumber && <div>Company Reg No: {data.customer.regNumber}</div>}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-xs uppercase tracking-wider text-gray-600">
              <th className="py-3 px-2 w-2/5">Description</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Unit Price</th>
              <th className="py-3 px-2 text-right">Discount</th>
              {data.isVatRegistered && <th className="py-3 px-2 text-right">VAT Rate</th>}
              <th className="py-3 px-2 text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithTotals.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                <td className="py-3 px-2 text-gray-800">{item.description || '-'}</td>
                <td className="py-3 px-2 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(item.unitPrice, data.currency)}</td>
                <td className="py-3 px-2 text-right text-gray-600">{item.discount > 0 ? `${item.discount}% (-${formatCurrency(item.discountAmount, data.currency)})` : '-'}</td>
                {data.isVatRegistered && (
                  <td className="py-3 px-2 text-right text-gray-600 text-xs">
                    {item.vatRate.replace(' (', '\n(')}
                  </td>
                )}
                <td className="py-3 px-2 text-right text-gray-800 font-medium">
                  {formatCurrency(item.netAmount, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2 max-w-sm">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Subtotal (Net)</span>
            <span className="text-gray-800 font-medium">{formatCurrency(totalNet, data.currency)}</span>
          </div>
          {data.isVatRegistered && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Total VAT</span>
              <span className="text-gray-800 font-medium">{formatCurrency(totalVat, data.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-b-2 border-gray-800 text-lg font-bold">
            <span className="text-gray-800">Total Payable</span>
            <span className="text-gray-900">{formatCurrency(totalPayable, data.currency)}</span>
          </div>

          {data.hasDeposit && (
            <div className="mt-4 space-y-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div className="flex justify-between text-sm font-bold text-indigo-900">
                <span>Deposit Due ({formatDate(data.depositDueDate)})</span>
                <span>{formatCurrency(depositTotalDue, data.currency)}</span>
              </div>
              {data.isVatRegistered && data.depositVatRate && data.depositVatRate !== 'Zero-rated (0%)' && data.depositVatRate !== 'Exempt' && (
                <div className="text-[10px] text-indigo-700/70 flex justify-between px-1 italic">
                  <span>({formatCurrency(data.depositAmount || 0, data.currency)} Net + {data.depositVatRate} VAT)</span>
                  <span>VAT: {formatCurrency(depositVatAmount, data.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Balance Due ({formatDate(data.balanceDueDate)})</span>
                <span>{formatCurrency(balanceRemaining, data.currency)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VAT Notes */}
      {data.isVatRegistered && (hasReverseCharge || hasZeroRated || hasExempt) && (
        <div className="mb-8 p-4 bg-gray-50 rounded text-xs text-gray-600">
          <h4 className="font-bold text-gray-800 mb-1">VAT Notes:</h4>
          <ul className="list-disc pl-4 space-y-1">
            {hasReverseCharge && <li>VAT to be accounted for by the customer under the reverse charge mechanism.</li>}
            {hasZeroRated && <li>Includes zero-rated goods/services.</li>}
            {hasExempt && <li>Includes VAT-exempt goods/services.</li>}
          </ul>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-auto pt-8 border-t border-gray-200 text-xs text-gray-500 grid grid-cols-2 gap-8">
        <div>
          {data.paymentTerms && (
            <div className="mb-2">
              <span className="font-bold text-gray-700">Payment Terms:</span> {data.paymentTerms}
            </div>
          )}
          {data.paymentMethods && (
            <div className="mb-2 whitespace-pre-line">
              <span className="font-bold text-gray-700">Payment Methods:</span><br/>
              {data.paymentMethods}
            </div>
          )}
          {data.notes && (
            <div className="whitespace-pre-line mt-4 italic">
              {data.notes}
            </div>
          )}
        </div>
        <div className="text-right">
          {data.seller.regNumber && (
            <div>Company Registration No: {data.seller.regNumber}</div>
          )}
          {data.isVatRegistered && data.seller.vatNumber && (
            <div>VAT Registration No: {data.seller.vatNumber}</div>
          )}
        </div>
      </div>
    </div>
  );
}

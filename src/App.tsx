/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { InvoiceData, Client, RecurringInvoice, RecurringFrequency } from './types';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import ClientManager from './components/ClientManager';
import RecurringManager from './components/RecurringManager';
import { Printer, Users, RefreshCw, FileText, Save } from 'lucide-react';
import { supabase } from './utils/supabase';

const initialData: InvoiceData = {
  invoiceNumber: 'INV-0001',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currency: 'GBP',
  paymentTerms: '30 days',
  paymentMethods: 'Bank Transfer\nName: Bbq Festivals Ltd\nSort Code: 23-14-70\nAccount No: 52394045',
  notes: 'Thank you for your business.',
  seller: {
    name: 'BBQ Festivals Ltd',
    address: '110 Wigmore Street\nLondon\nEngland\nW1U 3RW',
    contact: '',
    regNumber: '15566650',
    vatNumber: '488658516',
    logoUrl: '',
  },
  customer: {
    name: '',
    address: '',
    contact: '',
    vatNumber: '',
    regNumber: '',
  },
  items: [
    {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      vatRate: 'Standard (20%)',
    }
  ],
  isVatRegistered: true,
  hasDeposit: false,
  depositAmount: 0,
  depositVatRate: 'Standard (20%)',
  depositDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  eventDate: '',
  balanceDueDate: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'invoice' | 'clients' | 'recurring'>('invoice');
  const [data, setData] = useState<InvoiceData>(initialData);
  const [clients, setClients] = useState<Client[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringProfileName, setRecurringProfileName] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('Monthly');

  // Load from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Clients
        const { data: clientsData, error: clientsError } = await supabase.from('clients').select('data');
        if (clientsError) throw clientsError;
        setClients(clientsData.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data));

        // Fetch Recurring Invoices
        const { data: recurringData, error: recurringError } = await supabase.from('recurring_invoices').select('data');
        if (recurringError) throw recurringError;
        setRecurringInvoices(recurringData.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data));

        // Fetch Invoice Number
        const { data: settingsData, error: settingsError } = await supabase.from('settings').select('value').eq('key', 'last_invoice_number').single();
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
        
        const lastNum = parseInt(settingsData?.value || '0');
        const nextNum = lastNum + 1;
        setData(prev => ({
          ...prev,
          invoiceNumber: `INV-${nextNum.toString().padStart(4, '0')}`
        }));
      } catch (e) {
        console.error('Error loading data from Supabase:', e);
      }
    };

    loadData();
  }, []);

  const handleAddClient = async (client: Client) => {
    const { error } = await supabase.from('clients').upsert({ id: client.id, data: client });
    if (error) console.error('Error adding client:', error);
    else setClients([...clients, client]);
  };

  const handleUpdateClient = async (client: Client) => {
    const { error } = await supabase.from('clients').upsert({ id: client.id, data: client });
    if (error) console.error('Error updating client:', error);
    else setClients(clients.map(c => c.id === client.id ? client : c));
  };

  const handleDeleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) console.error('Error deleting client:', error);
    else setClients(clients.filter(c => c.id !== id));
  };

  const handleAddRecurring = async (profile: RecurringInvoice) => {
    const { error } = await supabase.from('recurring_invoices').upsert({ id: profile.id, data: profile });
    if (error) console.error('Error adding recurring profile:', error);
    else setRecurringInvoices([...recurringInvoices, profile]);
  };

  const handleUpdateRecurring = async (profile: RecurringInvoice) => {
    const { error } = await supabase.from('recurring_invoices').upsert({ id: profile.id, data: profile });
    if (error) console.error('Error updating recurring profile:', error);
    else setRecurringInvoices(recurringInvoices.map(r => r.id === profile.id ? profile : r));
  };

  const handleDeleteRecurring = async (id: string) => {
    const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
    if (error) console.error('Error deleting recurring profile:', error);
    else setRecurringInvoices(recurringInvoices.filter(r => r.id !== id));
  };

  const handlePrint = async () => {
    const originalTitle = document.title;
    const customerName = data.customer.name || 'Unknown Customer';
    document.title = `${data.invoiceNumber} - ${customerName} - BBq Festals Ltd`;
    
    // Extract number from INV-XXXX
    const currentNumStr = data.invoiceNumber.replace('INV-', '');
    const currentNum = parseInt(currentNumStr);

    window.print();
    document.title = originalTitle;

    // Increment and save
    if (!isNaN(currentNum)) {
      const nextNum = currentNum + 1;
      const { error } = await supabase.from('settings').upsert({ key: 'last_invoice_number', value: currentNum.toString() });
      if (error) console.error('Error saving invoice number:', error);
      
      setData(prev => ({
        ...prev,
        invoiceNumber: `INV-${nextNum.toString().padStart(4, '0')}`
      }));
    }
  };

  const saveAsRecurring = () => {
    if (!recurringProfileName) return;
    
    const newProfile: RecurringInvoice = {
      id: Math.random().toString(36).substring(2, 9),
      profileName: recurringProfileName,
      frequency: recurringFrequency,
      nextIssueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      template: data,
      isActive: true,
    };

    handleAddRecurring(newProfile);
    setShowRecurringModal(false);
    setRecurringProfileName('');
  };

  const handleGenerateFromRecurring = (template: InvoiceData) => {
    setData({
      ...template,
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setActiveTab('invoice');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col print:bg-white print:block">
      {/* Navigation */}
      <nav className="bg-white shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 mr-8">UK Invoice Generator</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('invoice')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'invoice' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} className="mr-2" />
                  New Invoice
                </button>
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'clients' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users size={18} className="mr-2" />
                  Clients
                </button>
                <button
                  onClick={() => setActiveTab('recurring')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'recurring' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <RefreshCw size={18} className="mr-2" />
                  Recurring
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden print:overflow-visible">
        {activeTab === 'invoice' && (
          <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] print:h-auto">
            {/* Form Section */}
            <div className="w-full md:w-1/2 lg:w-5/12 p-6 overflow-y-auto h-full print:hidden bg-white border-r border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Invoice Editor</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRecurringModal(true)}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Save size={16} />
                    Save Template
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Printer size={16} />
                    Print / PDF
                  </button>
                </div>
              </div>
              <InvoiceForm data={data} clients={clients} onChange={setData} onSaveClient={handleAddClient} />
            </div>

            {/* Preview Section */}
            <div className="w-full md:w-1/2 lg:w-7/12 p-6 overflow-y-auto h-full print:w-full print:h-auto print:p-0 print:overflow-visible bg-gray-100 flex justify-center items-start">
              <div className="w-full max-w-[210mm] bg-white shadow-lg print:shadow-none print:max-w-none">
                <InvoicePreview data={data} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-y-auto">
            <ClientManager 
              clients={clients} 
              onAdd={handleAddClient}
              onUpdate={handleUpdateClient}
              onDelete={handleDeleteClient}
            />
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-y-auto">
            <RecurringManager 
              recurringInvoices={recurringInvoices} 
              onUpdate={handleUpdateRecurring}
              onDelete={handleDeleteRecurring}
              onGenerate={handleGenerateFromRecurring}
            />
          </div>
        )}
      </main>

      {/* Save Recurring Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Save as Recurring Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Name</label>
                <input
                  type="text"
                  value={recurringProfileName}
                  onChange={(e) => setRecurringProfileName(e.target.value)}
                  placeholder="e.g. Monthly Retainer - Acme Corp"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRecurringModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAsRecurring}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

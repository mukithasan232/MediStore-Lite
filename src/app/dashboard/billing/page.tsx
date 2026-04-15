'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Filter,
  ExternalLink,
  FileText,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Shield,
  Smartphone,
  RefreshCw,
  Hash,
  User,
  Package,
  Mail,
  X,
  Phone,
  AtSign
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { generateInvoice, getSubscriptionStatus } from '@/actions/subscription';

interface Subscription {
  id: string;
  status: string;
  plan: string;
  trialStartDate: string;
  trialEndDate: string;
  nextBillingDate: string | null;
  currentPeriodEnd: string | null;
  billingEmail: string;
  autoRenew: boolean;
  isTrialActive?: boolean;
  daysRemainingInTrial?: number;
  hasUnpaidInvoice?: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: any;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  description: string;
  payments: any[];
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showBKashModal, setShowBKashModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [bkashForm, setBkashForm] = useState({
    transactionId: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Fetch subscription status
      const subResult = await getSubscriptionStatus(user.id);
      if (subResult.success) {
        setSubscription(subResult.subscription);
      }

      // Fetch invoices
      const response = await fetch('/api/subscription/invoices');
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!subscription) return;

    setPaymentLoading(true);
    try {
      const result = await generateInvoice(subscription.id);
      if (result.success) {
        toast.success(result.isNew ? 'Invoice generated' : 'Invoice already exists');
        fetchSubscriptionData();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error('Failed to generate invoice');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = async (invoiceId: string) => {
    if (!subscription) return;

    setPaymentLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/payment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          subscriptionId: subscription.id,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      toast.error('Payment initialization failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBKashPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription || !selectedInvoiceId) return;

    if (!bkashForm.transactionId.trim() || !bkashForm.phoneNumber.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await fetch('/api/payment/bkash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          subscriptionId: subscription.id,
          bkashTransactionId: bkashForm.transactionId.trim(),
          bkashPhoneNumber: bkashForm.phoneNumber.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'bKash payment submitted! Awaiting verification.');
        setBkashForm({ transactionId: '', phoneNumber: '' });
        setShowBKashModal(false);
        setSelectedInvoiceId(null);
        fetchSubscriptionData();
      } else {
        toast.error(data.error || 'Failed to submit bKash payment');
      }
    } catch (error: any) {
      toast.error('bKash payment submission failed');
    } finally {
      setPaymentLoading(false);
    }
  };
    invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    invoice.description.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'TRIAL':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'ACTIVE':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'EXPIRED':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'UNPAID':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'OVERDUE':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Billing & Subscription</h1>
          <p className="text-gray-500 font-black text-[10px] tracking-[0.3em] uppercase mt-2">Manage your MediStore Lite subscription and payment history</p>
        </div>
      </div>

      {/* Subscription Status Card */}
      {subscription && !loading ? (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">MediStore Lite</h2>
                <p className="text-gray-500 font-bold text-[11px] uppercase tracking-widest mt-2">STARTER PLAN - ৳1,000/MONTH</p>
              </div>
              <div className={`px-6 py-3 rounded-2xl border font-black text-sm tracking-[0.1em] uppercase ${getStatusColor(subscription.status)}`}>
                {subscription.status === 'TRIAL' ? '🎁 Free Trial' : subscription.status === 'ACTIVE' ? '✓ Active' : subscription.status}
              </div>
            </div>

            {/* Subscription Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trial Status */}
              {subscription.status === 'TRIAL' && subscription.isTrialActive && (
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Trial Remaining</h4>
                      <p className="text-3xl font-black text-blue-600 mt-2">{subscription.daysRemainingInTrial}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">DAYS LEFT</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold mt-4 italic">Ends {format(new Date(subscription.trialEndDate), 'MMM dd, yyyy')}</p>
                </div>
              )}

              {/* Next Billing */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-[2rem] border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Next Billing</h4>
                    <p className="text-lg font-black text-gray-900 mt-2">
                      {subscription.nextBillingDate ? format(new Date(subscription.nextBillingDate), 'MMM dd') : 'TBD'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">BILLING DATE</p>
                  </div>
                </div>
              </div>

              {/* Monthly Cost */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-[2rem] border border-green-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Monthly Cost</h4>
                    <p className="text-3xl font-black text-green-600 mt-2">৳1,000</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">ONE TIME PAYMENT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Settings */}
            <div className="pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auto-Renewal */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <RefreshCw size={20} className="text-gray-400" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Auto-Renewal</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                      {subscription.autoRenew ? '✓ Enabled' : '✗ Disabled'}
                    </p>
                  </div>
                </div>

                {/* Billing Email */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Mail size={20} className="text-gray-400" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Email</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                      {subscription.billingEmail || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100 flex gap-4 flex-col md:flex-row">
              {subscription.status === 'TRIAL' && subscription.isTrialActive && (
                <button
                  onClick={handleGenerateInvoice}
                  disabled={paymentLoading}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                >
                  {paymentLoading ? 'Processing...' : 'Upgrade to Paid (৳1,000)'}
                </button>
              )}

              {subscription.hasUnpaidInvoice && (
                <button
                  onClick={() => {
                    const unpaidInvoice = invoices.find(inv => inv.status === 'UNPAID');
                    if (unpaidInvoice) handlePayment(unpaidInvoice.id);
                  }}
                  disabled={paymentLoading}
                  className="flex-1 px-6 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50 shadow-lg shadow-orange-100"
                >
                  {paymentLoading ? 'Processing...' : 'Pay Outstanding Invoice'}
                </button>
              )}

              <button
                onClick={() => toast.info('Contact support: support@medistore.com')}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200"
              >
                Manage Billing
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Invoices Section */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white sticky top-0 z-10">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none p-4 bg-gray-50 rounded-2xl text-gray-500 hover:text-blue-600 transition-colors">
              <Filter size={20} />
            </button>
            <button className="flex-1 md:flex-none px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
              Export CSV
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] uppercase tracking-widest font-black">
            <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-50">
              <tr>
                <th className="px-10 py-6">Invoice ID</th>
                <th className="px-6 py-6">Billing Period</th>
                <th className="px-6 py-6">Amount</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-gray-400 italic">Loading invoices...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic">No invoices found</td></tr>
              ) : filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-blue-50/30 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900 font-black text-sm tracking-tight flex items-center gap-2">
                        <Hash size={14} className="text-blue-600" /> {invoice.invoiceNumber}
                      </span>
                      <span className="text-[9px] text-gray-400">{invoice.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900 font-black text-sm">{format(new Date(invoice.billingPeriodStart), 'MMM dd, yyyy')}</span>
                      <span className="text-[9px] text-gray-400">to {format(new Date(invoice.billingPeriodEnd), 'MMM dd, yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <span className="text-gray-900 font-black text-lg">৳{invoice.amount}</span>
                  </td>
                  <td className="px-6 py-8 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-black tracking-[0.1em] text-xs ${getInvoiceStatusColor(invoice.status)}`}>
                      <CheckCircle2 size={12} />
                      {invoice.status}
                    </div>
                  </td>
                  <td className="px-6 py-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {invoice.status === 'UNPAID' && (
                        <>
                          <button 
                            onClick={() => handlePayment(invoice.id)}
                            disabled={paymentLoading}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 px-4"
                            title="Pay with SSLCommerz Card/Bkash"
                          >
                            <CreditCard size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedInvoiceId(invoice.id);
                              setShowBKashModal(true);
                            }}
                            disabled={paymentLoading}
                            className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 px-4"
                            title="Pay with bKash"
                          >
                            <Phone size={18} />
                          </button>
                        </>
                      )}
                      <button className="p-3 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                        <Download size={18} />
                      </button>
                      <button className="p-3 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-[3rem] shadow-2xl border border-blue-400 overflow-hidden text-white p-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tighter mb-4">STARTER PLAN</h2>
          <p className="text-blue-100 font-bold text-sm mb-8">Includes all essential features for pharmacy management:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              '✓ Multi-branch management',
              '✓ Inventory tracking',
              '✓ Real-time analytics',
              '✓ User role management',
              '✓ Sales reporting',
              '✓ 24/7 customer support',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-bold">
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="py-6 border-t border-blue-400">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Need a custom plan?</p>
            <p className="text-white font-black text-lg mt-2">Contact our sales team</p>
            <p className="text-blue-100 text-sm mt-2">sales@medistore.com • +880 1234 567890</p>
          </div>
        </div>
      </div>

      {/* bKash Payment Modal */}
      {showBKashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between border-b border-green-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">bKash Payment</h3>
                  <p className="text-green-100 text-xs font-bold uppercase mt-1">Manual Transfer</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBKashModal(false);
                  setSelectedInvoiceId(null);
                  setBkashForm({ transactionId: '', phoneNumber: '' });
                }}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Instructions */}
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-black text-sm text-green-900 uppercase tracking-tight mb-3">How to Send Money via bKash</h4>
                <ol className="text-sm text-green-800 space-y-2 font-bold">
                  <li>1. Open bKash app or dial <span className="font-black text-green-900">*247#</span></li>
                  <li>2. Select <span className="font-black text-green-900">Send Money</span></li>
                  <li>3. Enter receiver number: <span className="font-black text-green-900 block mt-1">01720XXXXXX</span></li>
                  <li>4. Amount: <span className="font-black text-green-900">৳1,000</span></li>
                  <li>5. Complete the transaction</li>
                  <li>6. Copy your <span className="font-black text-green-900">Transaction ID</span></li>
                  <li>7. Paste below and click Submit</li>
                </ol>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Amount to Send</p>
                <p className="text-3xl font-black text-green-600">৳1,000.00</p>
                <p className="text-xs font-bold text-gray-400 mt-2 uppercase">+ Any bKash charge applies</p>
              </div>

              {/* Form */}
              <form onSubmit={handleBKashPayment} className="space-y-4">
                {/* Transaction ID */}
                <div>
                  <label className="block text-sm font-black text-gray-900 uppercase tracking-tight mb-2">
                    bKash Transaction ID <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={bkashForm.transactionId}
                      onChange={(e) => setBkashForm({ ...bkashForm, transactionId: e.target.value })}
                      placeholder="e.g., 1234567890"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-bold transition-all"
                      required
                      disabled={paymentLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Found in your bKash confirmation message</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-black text-gray-900 uppercase tracking-tight mb-2">
                    bKash Phone Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={bkashForm.phoneNumber}
                      onChange={(e) => setBkashForm({ ...bkashForm, phoneNumber: e.target.value })}
                      placeholder="e.g., 01720000000 or +8801720000000"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-bold transition-all"
                      required
                      disabled={paymentLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your bKash registered phone number</p>
                </div>

                {/* Confirmation */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-xs text-yellow-800 font-bold">
                    ⚠️ Please verify that you have successfully sent ৳1,000 via bKash before submitting. Your account will be verified within 1-2 hours.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? 'Submitting...' : 'Submit bKash Payment'}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center font-bold">
                  By submitting, you confirm that you have sent money via bKash.<br />
                  Payment will be verified within 1-2 hours of submission.
                </p>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-600 font-bold">
                Need help? Contact <span className="text-green-600 font-black">support@medistore.com</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

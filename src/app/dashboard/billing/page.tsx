'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Download, 
  Search, 
  CheckCircle2, 
  User, 
  Filter, 
  ExternalLink, 
  CreditCard,
  Hash,
  Calendar,
  Package,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('sales')
      .select('*, medicines(name)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setSales(data);
    setLoading(false);
  };

  const filteredSales = sales.filter(sale => 
    sale.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    sale.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Settlement Ledger</h1>
          <p className="text-gray-500 font-black text-[10px] tracking-[0.3em] uppercase mt-2">Centralized billing and transaction history</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all">
              Billed Receipts
           </button>
           <button className="px-6 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all">
              Refund Logs
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white sticky top-0 z-10">
           <div className="relative w-full max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by Invoice ID or Customer Name..."
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
                 Batch Export
              </button>
           </div>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto">
           <table className="w-full text-left text-[11px] uppercase tracking-widest font-black">
              <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-50">
                 <tr>
                    <th className="px-10 py-6">Transaction Node</th>
                    <th className="px-6 py-6 font-black">Customer Profile</th>
                    <th className="px-6 py-6 text-center">Settlement Status</th>
                    <th className="px-6 py-6 text-center">Net Amount</th>
                    <th className="px-6 py-6 text-right">Details</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center animate-pulse text-gray-400 italic">Accessing Ledger Cloud...</td></tr>
                 ) : filteredSales.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic">No transaction records found matching your query.</td></tr>
                 ) : filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-blue-50/30 transition-all group">
                       <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                             <span className="text-gray-900 font-black text-sm tracking-tight flex items-center gap-2">
                                <Hash size={14} className="text-blue-600" /> INV-{sale.id.slice(0, 8)}
                             </span>
                             <span className="text-[9px] text-gray-400 flex items-center gap-1">
                                <Calendar size={12} /> {format(new Date(sale.created_at), 'dd-MM-yyyy • HH:mm')}
                             </span>
                          </div>
                       </td>
                       <td className="px-6 py-8">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                <User size={18} />
                             </div>
                             <div>
                                <h4 className="text-gray-900 font-black text-sm tracking-tight">{sale.customer_name || 'Walk-in Subscriber'}</h4>
                                <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold italic">Standard Account</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-8 text-center text-sm">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100 font-black tracking-[0.1em]">
                             <CheckCircle2 size={12} /> Settled
                          </div>
                       </td>
                       <td className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center">
                             <span className="text-gray-900 font-black text-lg tracking-tight">৳{sale.total_price}</span>
                             <span className="text-[9px] text-gray-400 mt-1 font-bold italic line-through opacity-30">৳{(sale.total_price * 1.1).toFixed(0)}</span>
                          </div>
                       </td>
                       <td className="px-6 py-8 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-3 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                <Download size={18} />
                             </button>
                             <button className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md">
                                <ExternalLink size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing {filteredSales.length} records of total system ledger</p>
           <div className="flex gap-2">
              <button disabled className="p-3 bg-white rounded-xl text-gray-300 border border-gray-100 cursor-not-allowed">Previous</button>
              <button className="px-6 py-3 bg-white rounded-xl text-blue-600 border border-blue-100 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all">Next Wave <ArrowRight size={12} className="inline ml-1" /></button>
           </div>
        </div>
      </div>
    </div>
  );
}

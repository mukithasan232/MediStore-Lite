'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AlertCircle, 
  Calendar, 
  TrendingDown, 
  Package, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Clock
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

export default function ExpiryAlerts() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringMedicines();
  }, []);

  const fetchExpiringMedicines = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Track 90 days window
    const ninetyDaysFromNow = addDays(new Date(), 90).toISOString();

    const { data } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', user?.id)
      .lte('expiry_date', ninetyDaysFromNow)
      .order('expiry_date', { ascending: true });

    if (data) setMedicines(data);
    setLoading(false);
  };

  const getRiskStatus = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-red-600', text: 'text-red-600', bg: 'bg-red-50' };
    if (days < 30) return { label: 'High Risk', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Warning', color: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const totalLoss = medicines
    .filter(m => differenceInDays(new Date(m.expiry_date), new Date()) < 0)
    .reduce((acc, m) => acc + (m.purchase_price * m.stock_quantity), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Risk Counter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Quality Surveillance</h1>
          <p className="text-gray-500 font-bold text-[10px] tracking-[0.3em] uppercase mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Active Expiry Monitoring Node
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-red-50 flex items-center gap-8 group hover:border-red-200 transition-all">
           <div className="bg-red-600 p-4 rounded-2xl text-white shadow-lg shadow-red-100 group-hover:rotate-12 transition-transform">
              <TrendingDown size={32} />
           </div>
           <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Financial Risk Exposure</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">৳{totalLoss.toLocaleString()}</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Based on purchase value of expired stock</p>
           </div>
        </div>
      </div>

      {/* Expiry Matrix */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
        <div className="p-8 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
           <ShieldAlert className="text-red-600" size={24} />
           <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">Inventory Lifecycle Matrix (90 Days Threshold)</h2>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left text-[11px] uppercase tracking-widest font-black">
              <thead className="bg-gray-50/20 text-gray-400 border-b border-gray-50">
                 <tr>
                    <th className="px-10 py-6">Product Information</th>
                    <th className="px-10 py-6 text-center">Expiry Timeline</th>
                    <th className="px-10 py-6 text-center">Remaining Velocity</th>
                    <th className="px-10 py-6 text-center">Asset Value</th>
                    <th className="px-10 py-6 text-right">Operational Logic</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center animate-pulse text-gray-400 italic font-bold">Accessing Batch Repositories...</td></tr>
                 ) : medicines.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-black uppercase tracking-widest opacity-30 italic">No lifecycle risks identified within current window.</td></tr>
                 ) : medicines.map((med) => {
                    const status = getRiskStatus(med.expiry_date);
                    const days = differenceInDays(new Date(med.expiry_date), new Date());
                    
                    return (
                      <tr key={med.id} className="hover:bg-red-50/20 transition-all group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                               <div className={`w-12 h-12 ${status.bg} rounded-[1.2rem] flex items-center justify-center ${status.text} font-black text-lg border border-neutral-100`}>
                                  {med.name.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="text-gray-900 font-black text-sm tracking-tighter uppercase">{med.name}</h4>
                                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest flex items-center gap-1">
                                     <span className="w-1 h-1 rounded-full bg-gray-300" /> {med.category}
                                  </p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <div className="inline-flex flex-col items-center">
                               <span className="text-gray-900 font-black text-sm tracking-tight">{format(new Date(med.expiry_date), 'dd MMM yyyy')}</span>
                               <span className="text-[9px] text-gray-300 font-bold mt-1 tracking-widest">TIMESTAMPED</span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border ${status.bg} ${status.text}`}>
                               {days < 0 ? 'LIFECYCLE EXPIRED' : `${days.toString().padStart(2, '0')} DAYS REMAINING`}
                            </div>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <div className="flex flex-col items-center">
                               <span className="text-gray-900 font-black text-lg tracking-tighter">৳{(med.purchase_price * med.stock_quantity).toFixed(0)}</span>
                               <span className="text-[9px] text-gray-300 font-bold mt-1">CAPITAL AT RISK</span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <button className={`px-6 py-3 ${status.color} text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 hover:scale-105 transition-all flex items-center gap-2 float-right`}>
                               Action Plan <ArrowRight size={14} />
                            </button>
                         </td>
                      </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
        
        {/* Quality Audit Footer */}
        <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
           <span className="flex items-center gap-2" suppressHydrationWarning><Clock size={12} /> Last Audit: {format(new Date(), 'HH:mm:ss')}</span>
           <span>System Mode: COMPLIANCE ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

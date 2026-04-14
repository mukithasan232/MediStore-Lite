'use client';

import { TrendingUp, Award, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Printer, Star, Target, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function ReportsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Enterprise Intelligence</h1>
          <p className="text-gray-500 font-black text-[10px] tracking-[0.3em] uppercase mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Live Analytics Hub • {user?.branchName || "Global"}
          </p>
        </div>
        <div className="flex gap-3">
           <button className="bg-white border border-gray-200 px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
             <Printer size={16} className="text-blue-600" /> Export PDF
           </button>
           <button className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
             <Zap size={16} /> Force Sync
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Revenue Chart Area */}
         <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <BarChart3 size={200} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-blue-600 p-2 rounded-xl">
                    <TrendingUp size={20} className="text-white" />
                 </div>
                 <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Revenue Trajectory</span>
              </div>
              
              <div className="flex items-baseline gap-4">
                 <h3 className="text-5xl font-black text-gray-900 tracking-tighter">৳1,42,500</h3>
                 <span className="text-green-500 font-black text-sm flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <ArrowUpRight size={14} /> +12.5%
                 </span>
              </div>
              <p className="text-gray-400 font-bold text-xs mt-3 uppercase tracking-wider">Gross revenue generated this fiscal month</p>
            </div>
            
            {/* Visual Chart Placeholder */}
            <div className="mt-16 h-56 flex items-end gap-3 px-2">
               {[40, 70, 45, 90, 65, 80, 50, 95, 100, 85, 60, 110].map((h, i) => (
                 <div key={i} className="flex-1 bg-blue-600/10 rounded-2xl group/bar relative cursor-pointer hover:bg-blue-600 transition-all" style={{ height: `${h}%` }}>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all shadow-xl scale-50 group-hover/bar:scale-100">
                       ৳{h}k
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="mt-8 flex justify-between border-t border-gray-50 pt-8">
               {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map(m => (
                 <span key={m} className="text-[9px] font-black text-gray-300 tracking-widest">{m}</span>
               ))}
            </div>
         </div>

         {/* Sidebar Insights */}
         <div className="space-y-8">
            {/* Top Seller Card */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
               <Award className="absolute -right-6 -bottom-6 text-white/10 group-hover:rotate-12 transition-transform" size={180} />
               <div className="relative z-10">
                  <div className="bg-white/20 backdrop-blur-md w-fit p-3 rounded-2xl mb-6">
                     <Star size={24} className="text-yellow-400 fill-yellow-400" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Primary Catalyst</h4>
                  <h3 className="text-2xl font-black mb-6 tracking-tight">Napa Extra 500mg</h3>
                  
                  <div className="space-y-4">
                     <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                        <span className="opacity-70">Market Share:</span>
                        <span>85%</span>
                     </div>
                     <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full w-[85%] shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                     </div>
                     <p className="text-[10px] font-bold opacity-50 italic uppercase mt-2">* Data aggregated across all nodes</p>
                  </div>
               </div>
            </div>

            {/* Target Card */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col items-center text-center gap-6 group hover:border-blue-500 transition-all">
               <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Target size={32} />
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Inventory Target</h4>
                  <p className="text-sm font-bold text-gray-900 px-4">Maintain 98% stock availability across critical SKU's.</p>
               </div>
               <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="w-2 h-2 rounded-full bg-gray-200" />
               </div>
            </div>
         </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Avg Basket Value', val: '৳850.00', icon: Zap, color: 'blue' },
           { label: 'Customer Retention', val: '92.4%', icon: TrendingUp, color: 'green' },
           { label: 'Stock Turnover', val: '14.2x', icon: PieChart, color: 'purple' },
           { label: 'System Uptime', val: '99.9%', icon: Activity, color: 'orange' }
         ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-xl transition-all">
               <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon size={20} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-xl font-black text-gray-900">{stat.val}</h4>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}

function Activity({ size }: { size: number }) {
   return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
   );
}

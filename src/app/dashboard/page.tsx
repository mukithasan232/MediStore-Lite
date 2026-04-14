'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  ArrowRight,
  ChevronRight,
  Activity,
  Archive,
  Star
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStock: 0,
    todayRevenue: 0,
    totalSales: 0,
    recentSales: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Total Medicines
      const { count: medCount } = await supabase
        .from('medicines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 2. Low Stock Alerts
      const { count: lowStockCount } = await supabase
        .from('medicines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('stock_quantity', 10);

      // 3. Today's Sales & Revenue
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const { data: todaySales } = await supabase
        .from('sales')
        .select('total_price, created_at, quantity, medicines(name)')
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      const todayRevenue = todaySales?.reduce((acc, sale) => acc + Number(sale.total_price), 0) || 0;
      const todaySalesCount = todaySales?.length || 0;

      // 4. Recent Sales (Last 5)
      const { data: recentSales } = await supabase
        .from('sales')
        .select('*, medicines(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalMedicines: medCount || 0,
        lowStock: lowStockCount || 0,
        todayRevenue,
        totalSales: todaySalesCount,
        recentSales: recentSales || [],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    { title: "Node Inventory", value: stats.totalMedicines, sub: "Total SKUs Indexed", icon: Package, color: "blue" },
    { title: "Revenue Flow", value: "৳" + stats.todayRevenue.toLocaleString(), sub: "Today's Settlement", icon: DollarSign, color: "green" },
    { title: "Risk Alerts", value: stats.lowStock, sub: "Items below safe level", icon: AlertCircle, color: "red" },
    { title: "Daily Throughput", value: stats.totalSales, sub: "Orders Processed Today", icon: Activity, color: "purple" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             Welcome, Agent <span className="text-blue-600">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">
             System Node: <span className="text-gray-900">{user?.branchName || "Main Frame"}</span> | Role: <span className="text-blue-600">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
           <Calendar className="text-blue-600" size={20} />
           <p className="text-sm font-black text-gray-800 uppercase tracking-widest" suppressHydrationWarning>{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {dashboardCards.map((card, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden">
             <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.color}-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform`} />
             <div className={`w-14 h-14 bg-${card.color}-100 rounded-2xl flex items-center justify-center mb-6 text-${card.color}-600 relative z-10`}>
                <card.icon size={28} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">{card.title}</p>
             <h3 className="text-3xl font-black text-gray-900 relative z-10">{loading ? "..." : card.value}</h3>
             <p className="text-xs text-gray-400 mt-2 font-bold italic relative z-10">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Operations */}
        <div className="xl:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                 <ShoppingCart size={20} className="text-blue-600" /> Recent Terminal Sales
              </h2>
              <Link href="/dashboard/sales" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                 Launch terminal <ChevronRight size={14} />
              </Link>
           </div>
           
           <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden">
              <table className="w-full text-left text-xs uppercase tracking-wider font-bold">
                 <thead className="bg-gray-50 border-b border-gray-100 text-gray-400">
                    <tr>
                       <th className="px-8 py-5">Challan Ref</th>
                       <th className="px-8 py-5">Customer</th>
                       <th className="px-8 py-5">Product (Qty)</th>
                       <th className="px-8 py-5 text-right">Price</th>
                       <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {loading ? (
                       <tr><td colSpan={5} className="p-10 text-center animate-pulse">Syncing Sales Stream...</td></tr>
                    ) : stats.recentSales.length === 0 ? (
                       <tr><td colSpan={5} className="p-10 text-center text-gray-400">Zero transactions recorded today.</td></tr>
                    ) : stats.recentSales.map((sale, idx) => (
                       <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-5 text-gray-400">#SAL-{sale.id.slice(0,5)}</td>
                          <td className="px-8 py-5 text-gray-900">{sale.customer_name}</td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2">
                                <span className="text-gray-900">{sale.medicines?.name}</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[9px] text-gray-500">x{sale.quantity}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right text-blue-600 font-black">৳{sale.total_price}</td>
                          <td className="px-8 py-5 text-right text-green-600">Settled</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-6">
           <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" /> AI Insights
           </h2>
           
           <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 underline decoration-yellow-400 underline-offset-4">Strategic Alert</p>
                    <h4 className="text-2xl font-black leading-tight mb-4 tracking-tighter">Your risk score is 88/100</h4>
                    <p className="text-xs text-blue-100 leading-relaxed font-bold opacity-80">
                       We've identified 12 SKU's that are expiring in within 30 days. Recommend liquidation discount of 15% to recover asset value.
                    </p>
                    <button className="mt-6 w-full py-3 bg-white text-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2">
                       Apply Discount Plan <Star size={12} />
                    </button>
                 </div>
                 <Archive className="absolute bottom-0 right-0 -mr-6 -mb-6 text-white/10" size={140} />
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:border-blue-500 transition-all cursor-pointer">
                 <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                       <Package size={20} />
                    </div>
                    <div>
                       <h5 className="font-black text-gray-900 uppercase text-xs">Low Stock Alert</h5>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{stats.lowStock} items need restock</p>
                    </div>
                 </div>
                 <ChevronRight className="text-gray-300 group-hover:text-blue-600" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

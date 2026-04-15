'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  FileText, 
  Truck, 
  Clock, 
  ArrowUpRight, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Upload,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<'stock' | 'purchase'>('stock');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', user?.id)
      .order('name', { ascending: true });
    if (data) setMedicines(data);
    setLoading(false);
  };

  // Proper CSV parser that handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          throw new Error("CSV file is empty or contains only header");
        }

        const newItems = [];
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        // Skip header and process lines
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          // Validate minimum required fields
          if (values.length < 5) {
            console.warn(`Row ${i + 1}: Skipping - insufficient columns`);
            continue;
          }

          const [name, category, buy, sell, stock, expiry] = values;

          // Validate required fields
          if (!name || !category) {
            console.warn(`Row ${i + 1}: Skipping - missing name or category`);
            continue;
          }

          // Validate numeric fields
          const buyPrice = parseFloat(buy) || 0;
          const sellPrice = parseFloat(sell) || 0;
          const stockQty = parseInt(stock) || 0;

          if (buyPrice < 0 || sellPrice < 0 || stockQty < 0) {
            console.warn(`Row ${i + 1}: Skipping - negative values not allowed`);
            continue;
          }

          newItems.push({
            user_id: user.id,
            name: name.trim(),
            category: category.trim(),
            purchase_price: buyPrice,
            selling_price: sellPrice,
            stock_quantity: stockQty,
            expiry_date: expiry && expiry !== 'null' ? expiry.trim() : null
          });
        }

        if (newItems.length === 0) {
          throw new Error("No valid data found in CSV. Expected format: Name, Category, Buy, Sell, Stock, Expiry");
        }

        const toastId = toast.loading(`Synchronizing ${newItems.length} items to cloud...`);
        const { error, data } = await supabase.from('medicines').insert(newItems);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        toast.success(`Enterprise Node Updated! ${newItems.length} items added.`, { id: toastId });
        fetchInventory();
        setActiveTab('stock');
      } catch (err: any) {
        console.error('CSV Upload Error:', err);
        toast.error(err.message || 'Failed to upload CSV file');
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const { data: { user } } = await supabase.auth.getUser();

    const newMed = {
      user_id: user?.id,
      name: formData.get('name'),
      category: formData.get('category'),
      purchase_price: Number(formData.get('buy_price')),
      selling_price: Number(formData.get('sell_price')),
      stock_quantity: Number(formData.get('stock')),
      expiry_date: formData.get('expiry')
    };

    const toastId = toast.loading("Adding to Stock...");
    const { error } = await supabase.from('medicines').insert([newMed]);

    if (!error) {
      toast.success("Medicine added successfully!", { id: toastId });
      form.reset();
      fetchInventory();
    } else {
      toast.error(error.message, { id: toastId });
    }
  };

  const deleteMedicine = async (id: string) => {
    if (!confirm("Are you sure? This action is irreversible.")) return;
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (!error) {
       toast.success("Medicine Removed");
       fetchInventory();
    }
  };

  const filteredStock = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5">
            <Package size={80} className="md:block hidden" />
            <Package size={60} className="md:hidden block" />
         </div>
         <div className="relative z-10">
            <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase">Inventory Node</h1>
            <p className="text-gray-500 font-bold text-[9px] md:text-[10px] tracking-[0.3em] uppercase mt-1 md:mt-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
               Global Stock & Procurement
            </p>
         </div>
         <div className="flex gap-2 relative z-10 flex-wrap">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`px-4 md:px-8 py-3 md:py-4 rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
               Stock Matrix
            </button>
            <button 
              onClick={() => setActiveTab('purchase')}
              className={`px-4 md:px-8 py-3 md:py-4 rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all ${activeTab === 'purchase' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
               Bulk Inward
            </button>
         </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
           {/* Left Part: Stock List */}
           <div className="lg:col-span-3 space-y-4 md:space-y-6">
              <div className="bg-white p-3 md:p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-2 md:gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                       type="text" 
                       placeholder="Filter by name, brand, or category..."
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 bg-gray-50/50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-bold tracking-tight"
                    />
                 </div>
                 <button className="p-3 md:p-4 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all border border-gray-100 shrink-0">
                    <Filter size={18} />
                 </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-x-auto">
                 <table className="w-full text-left text-[10px] md:text-[11px] uppercase tracking-[0.1em] font-black">
                    <thead className="bg-gray-50 text-gray-400 border-b border-gray-100 sticky top-0 z-10">
                       <tr>
                          <th className="px-3 md:px-6 lg:px-10 py-4 md:py-6">Product</th>
                          <th className="px-3 md:px-6 lg:px-10 py-4 md:py-6 text-center hidden sm:table-cell">Expiry</th>
                          <th className="px-3 md:px-6 lg:px-10 py-4 md:py-6 text-center">Stock</th>
                          <th className="px-3 md:px-6 lg:px-10 py-4 md:py-6 text-center hidden md:table-cell">Profit</th>
                          <th className="px-3 md:px-6 lg:px-10 py-4 md:py-6 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {loading ? (
                          <tr><td colSpan={5} className="p-12 md:p-20 text-center animate-pulse text-gray-400 font-bold italic text-xs md:text-sm">Sychronizing with Central Warehouse...</td></tr>
                       ) : filteredStock.length === 0 ? (
                          <tr><td colSpan={5} className="p-12 md:p-20 text-center text-gray-400 font-black italic uppercase tracking-widest opacity-40 text-[9px] md:text-xs">Zero items in local node.</td></tr>
                       ) : filteredStock.map(med => (
                          <tr key={med.id} className="hover:bg-blue-50/50 transition-all group">
                             <td className="px-3 md:px-6 lg:px-10 py-4 md:py-8">
                                <div className="flex items-center gap-2 md:gap-5">
                                   <div className="w-8 md:w-12 h-8 md:h-12 bg-blue-50 rounded-[1.2rem] flex items-center justify-center text-blue-600 font-black text-xs md:text-lg border border-blue-100 shrink-0">
                                      {med.name.charAt(0)}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-gray-900 font-black text-xs md:text-sm tracking-tighter truncate">{med.name}</p>
                                      <p className="text-[8px] md:text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest flex items-center gap-1 truncate">
                                         <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" /> <span className="truncate">{med.category}</span>
                                      </p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-3 md:px-6 lg:px-10 py-4 md:py-8 text-center hidden sm:table-cell">
                                <div className="inline-flex flex-col items-center">
                                   <span className="text-gray-700 bg-gray-50 px-2 md:px-3 py-1 rounded-lg border border-gray-100 text-[8px] md:text-[10px]">{med.expiry_date ? format(new Date(med.expiry_date), 'MMM yyyy') : 'NO EXP'}</span>
                                   <span className="text-[7px] md:text-[9px] text-gray-300 mt-1 font-black flex items-center gap-1">
                                      <Clock size={8} /> TRACKED
                                   </span>
                                </div>
                             </td>
                             <td className="px-3 md:px-6 lg:px-10 py-4 md:py-8 text-center">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] border ${med.stock_quantity < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                   {med.stock_quantity < 10 && <AlertTriangle size={14} className="animate-bounce" />}
                                   {med.stock_quantity.toString().padStart(2, '0')} UNITS
                                </div>
                             </td>
                             <td className="px-3 md:px-6 lg:px-10 py-4 md:py-8 text-center hidden md:table-cell">
                                <div className="flex flex-col items-center">
                                   <p className="text-blue-600 text-xs md:text-sm font-black tracking-tight">৳{(med.selling_price - med.purchase_price).toFixed(2)}</p>
                                   <span className="text-[7px] md:text-[9px] text-gray-300 mt-1 font-black">PROFIT/UNIT</span>
                                </div>
                             </td>
                             <td className="px-3 md:px-6 lg:px-10 py-4 md:py-8 text-right">
                                <button onClick={() => deleteMedicine(med.id)} className="p-2 md:p-4 text-gray-300 hover:text-white hover:bg-red-600 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-xl shadow-red-100">
                                   <Trash2 size={16} className="md:block hidden" />
                                   <Trash2 size={14} className="md:hidden block" />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Right Part: Quick Add Form */}
           <div className="space-y-4 md:space-y-6">
              <form onSubmit={handleQuickAdd} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-blue-50 space-y-6 md:space-y-8 md:sticky md:top-8">
                 <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-blue-600 p-2 md:p-3 rounded-2xl text-white shadow-lg shadow-blue-100 shrink-0">
                       <Plus size={20} className="md:block hidden" />
                       <Plus size={18} className="md:hidden block" />
                    </div>
                    <h3 className="font-black text-lg md:text-xl uppercase tracking-tighter text-gray-800">Unit Registry</h3>
                 </div>
                 
                 <div className="space-y-4 md:space-y-5">
                    <div className="space-y-1">
                       <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Product Descriptor</label>
                       <input name="name" required placeholder="NAPA EXTRA 500MG" className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-black tracking-tight uppercase" />
                    </div>
                    
                    <div className="space-y-1">
                       <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Form/type</label>
                       <select name="category" required className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-black tracking-tight uppercase appearance-none">
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Ointment">Ointment</option>
                       </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">BUY/UNIT</label>
                          <input name="buy_price" type="number" required placeholder="0.00" className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-black" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">SELL/UNIT</label>
                          <input name="sell_price" type="number" required placeholder="0.00" className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-black" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">RE-STOCK QTY</label>
                          <input name="stock" type="number" required placeholder="QTY" className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-black" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">EXPIRY</label>
                          <input name="expiry" type="date" required className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-black text-gray-400" />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 transition-all shadow-2xl shadow-blue-100 scale-100 hover:scale-[1.02] text-xs md:text-sm">
                    <Plus size={18} className="md:block hidden" />
                    <Plus size={16} className="md:hidden block" /> Sync to Stock
                 </button>
              </form>
           </div>
        </div>
      ) : (
        /* Bulk Inward (Challan) Section */
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 px-4 md:px-0">
           <div className="bg-white p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] shadow-2xl border border-blue-50 text-center space-y-6 md:space-y-8 relative overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 blur-3xl group-hover:scale-150 transition-transform" />
              
              <div className="w-20 md:w-24 h-20 md:h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-blue-200">
                 <Truck size={40} className="md:block hidden" />
                 <Truck size={36} className="md:hidden block" />
              </div>

              <div className="space-y-2 md:space-y-3">
                 <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase">Enterprise Bulk Inward</h2>
                 <p className="text-gray-500 font-bold max-w-sm mx-auto uppercase text-[9px] md:text-[10px] tracking-[0.2em] leading-relaxed">Sync global supplier manifests directly to your local node with zero latency.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-12">
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleCSVUpload} 
                    accept=".csv" 
                    className="hidden" 
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex flex-col items-center gap-4 md:gap-6 p-6 md:p-10 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-2xl hover:shadow-blue-200 rounded-[2rem] md:rounded-[3rem] transition-all group/btn border-2 border-dashed border-blue-200 scale-100 hover:scale-[1.05]"
                 >
                    <Upload size={32} className="md:block hidden group-hover/btn:-translate-y-2 transition-transform" />
                    <Upload size={28} className="md:hidden block group-hover/btn:-translate-y-2 transition-transform" />
                    <div>
                       <h4 className="font-black uppercase tracking-widest text-sm md:text-lg">Import CSV Ledger</h4>
                       <p className="text-[8px] md:text-[10px] opacity-60 mt-1 font-black uppercase tracking-widest">Select .csv system file</p>
                    </div>
                 </button>
                 
                 <button 
                   onClick={() => toast.success("Opening Manual Form...")}
                   className="flex flex-col items-center gap-4 md:gap-6 p-6 md:p-10 bg-gray-50 text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-2xl rounded-[2rem] md:rounded-[3rem] transition-all group/btn border border-gray-100 scale-100 hover:scale-[1.05]"
                 >
                    <FileText size={32} className="md:block hidden group-hover/btn:-translate-y-2 transition-transform" />
                    <FileText size={28} className="md:hidden block group-hover/btn:-translate-y-2 transition-transform" />
                    <div>
                       <h4 className="font-black uppercase tracking-widest text-sm md:text-lg">Manual Invoice</h4>
                       <p className="text-[8px] md:text-[10px] opacity-60 mt-1 font-black uppercase tracking-widest">Step-by-step entry</p>
                    </div>
                 </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex items-start gap-3 md:gap-5 text-left text-amber-900 shadow-inner">
                 <AlertTriangle size={24} className="md:block hidden shrink-0 text-amber-600" />
                 <AlertTriangle size={20} className="md:hidden block shrink-0 text-amber-600" />
                 <div className="space-y-1">
                   <p className="text-xs md:text-sm font-black uppercase tracking-widest">Challan Formatting Rule</p>
                   <p className="text-[8px] md:text-[10px] font-bold leading-relaxed opacity-70">
                     Ensure your CSV header follows: <span className="text-amber-600">Name, Category, BuyPrice, SellPrice, Stock, ExpiryDate</span>. The system will auto-match items based on naming conventions.
                   </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

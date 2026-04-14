'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, Package, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  expiryDate?: string | null;
}

export default function POSTerminal() {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedicines();
    // Keyboard shortcut to focus search (Ctrl+F)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchMedicines = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', user?.id)
      .gt('stock_quantity', 0)
      .order('name', { ascending: true });
    if (data) setMedicines(data);
  };

  const addToCart = (med: any) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock_quantity) {
        return toast.error("Out of stock!");
      }
      setCart(cart.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        id: med.id, 
        name: med.name, 
        price: Number(med.selling_price), 
        quantity: 1, 
        stock: med.stock_quantity,
        expiryDate: med.expiry_date 
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) {
          toast.error("Stock limit reached");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; // Can add tax/discount logic here

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setLoading(true);
    const toastId = toast.loading("Finalizing Transaction...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const salesData = cart.map(item => ({
        user_id: user?.id,
        medicine_id: item.id,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        customer_name: customerName || 'Walk-in Customer'
      }));

      const { error } = await supabase.from('sales').insert(salesData);
      if (error) throw error;

      // Note: Stock update is handled automatically by the 'update_stock_after_sale' 
      // database trigger. Manual deduction removed to prevent double-decrement.

      // Generate Receipt Data
      const receiptData = {
        customerName: customerName || 'Walk-in Customer',
        total: total,
        items: cart,
        date: new Date(),
      };

      toast.success("Checkout Successful!", { id: toastId });
      
      // Automatic Print Trigger
      generateReceipt(receiptData);

      setCart([]);
      setCustomerName('');
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = (data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; 
              padding: 4mm; 
              font-size: 12px; 
              line-height: 1.4;
              color: #000;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
            .header { font-size: 16px; margin-bottom: 2px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 5px; font-size: 14px; font-weight: bold; }
            .footer { margin-top: 15px; font-size: 10px; line-height: 1.2; }
          </style>
        </head>
        <body>
          <div class="text-center header bold">MEDI-STORE LITE</div>
          <div class="text-center">Enterprise Pharma System</div>
          <div class="divider"></div>
          <div>Date: ${format(data.date, 'dd/MM/yyyy HH:mm')}</div>
          <div>Cust: ${data.customerName}</div>
          <div class="divider"></div>
          <div class="bold item-row">
            <span style="flex: 2">ITEM</span>
            <span style="flex: 0.5; text-align: center">QTY</span>
            <span style="flex: 1; text-align: right">TOTAL</span>
          </div>
          ${data.items.map((item: any) => `
            <div class="item-row">
              <span style="flex: 2">${item.name.toUpperCase()}</span>
              <span style="flex: 0.5; text-align: center">${item.quantity}</span>
              <span style="flex: 1; text-align: right">৳${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="total-row">
            <span>GRAND TOTAL</span>
            <span>৳${data.total.toFixed(2)}</span>
          </div>
          <div class="divider" style="border-top-style: solid;"></div>
          <div class="text-center footer">
            THANK YOU FOR YOUR VISIT<br>
            Please keep this receipt for records.<br>
            Software by PharmaCore Enterprise
          </div>
          <script>
            window.onload = () => { 
              window.print(); 
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* Left Part: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               ref={searchInputRef}
               type="text" 
               placeholder="Search medicine (Ctrl+F)..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
             />
          </div>
          <button onClick={() => setSearch('')} className="p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-500 transition-all">
             Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {filteredMedicines.map(med => (
            <button 
              key={med.id} 
              onClick={() => addToCart(med)}
              className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 text-left transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="bg-blue-600 text-white rounded-lg p-1" size={24} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{med.category}</p>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase leading-tight">{med.name}</h3>
              <div className="mt-4 flex justify-between items-end">
                 <div>
                   <p className="text-xs text-gray-400">Available Stock</p>
                   <p className="font-bold text-gray-700">{med.stock_quantity}</p>
                 </div>
                 <p className="text-lg font-black text-blue-600">৳{med.selling_price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Part: Cart and Checkout */}
      <div className="w-[450px] flex flex-col gap-6">
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-blue-50 flex flex-col overflow-hidden">
          <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
             <div className="flex items-center gap-2">
                <ShoppingCart size={24} />
                <h2 className="font-black text-lg uppercase tracking-wider">Checkout Cart</h2>
             </div>
             <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{cart.length} Items</span>
          </div>

          <div className="p-4 bg-blue-50 border-b border-blue-100">
             <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                   <Package size={48} className="opacity-20" />
                   <p className="font-bold text-sm tracking-widest uppercase opacity-40">Cart is empty</p>
                </div>
             ) : (
               cart.map(item => (
                 <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <h4 className="font-black text-gray-800 text-xs uppercase tracking-tight">{item.name}</h4>
                       <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600"><Minus size={14} /></button>
                          <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-blue-600"><Plus size={14} /></button>
                       </div>
                       <p className="font-bold text-gray-900 text-sm">৳{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                 </div>
               ))
             )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500 font-bold uppercase tracking-widest">
                   <span>Subtotal</span>
                   <span>৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t border-gray-200">
                   <span>Total</span>
                   <span>৳{total.toFixed(2)}</span>
                </div>
             </div>

             <button 
               onClick={handleCheckout}
               disabled={loading || cart.length === 0}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
             >
                <CreditCard size={24} />
                {loading ? "Processing..." : "Finish & Print"}
             </button>
          </div>
        </div>
        
        {/* Quick Receipt Stats */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
           <span>Date: {format(new Date(), 'dd-MMM-yy')}</span>
           <span className="flex items-center gap-1"><AlertCircle size={10} /> Auto-Stock Update</span>
        </div>
      </div>
    </div>
  );
}

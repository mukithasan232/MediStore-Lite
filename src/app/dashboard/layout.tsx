"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Pill, LayoutDashboard, Database, ShoppingCart, LogOut, Loader2, Menu, X, Clock, Building2, BarChart3, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="mt-4 text-gray-500 font-medium tracking-wide">Securing Enterprise Session...</span>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inventory", href: "/dashboard/inventory", icon: Database },
    { name: "POS Terminal", href: "/dashboard/sales", icon: ShoppingCart },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Billing", href: "/dashboard/billing", icon: FileText },
    { name: "Expiry Alerts", href: "/dashboard/expiry", icon: Clock },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    navItems.push({ name: "Global Nodes", href: "/dashboard/settings/branches", icon: Building2 });
  }

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-50 transform transition-transform duration-200 ease-in-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-20 flex items-center px-6 border-b border-neutral-100 bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-xl">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter">PharmaCore</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-gray-500 hover:bg-gray-100 hover:text-blue-600"}`}>
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-neutral-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-4 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black uppercase">
              {user?.email?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
              <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all font-bold text-sm">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-neutral-200 flex items-center px-8 justify-between">
          <div className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
             <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Enterprise Mode
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none text-right">Node Location</p>
               <h4 className="font-bold text-gray-900 flex items-center gap-1 justify-end mt-1 text-sm">
                 <Building2 size={16} className="text-blue-600" />
                 {user?.branchName || "Central Server"}
               </h4>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}

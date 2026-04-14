"use client";

import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, Terminal, Key, Database, ArrowRight } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: session.user.user_metadata?.role || "USER",
            branchId: session.user.user_metadata?.branchId,
            branchName: session.user.user_metadata?.branchName,
          });
        } else {
          setUser(null);
        }
        
        setIsLoading(false);

        if (!session && pathname.startsWith("/dashboard")) {
          router.push("/login");
        }
        if (session && (pathname === "/login" || pathname === "/")) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Auth session check failed:", err);
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: session.user.user_metadata?.role || "USER",
          branchId: session.user.user_metadata?.branchId,
          branchName: session.user.user_metadata?.branchName,
        });
      } else {
        setUser(null);
      }

      if (!session && pathname.startsWith("/dashboard")) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, setUser, setIsLoading]);

  // If Supabase is not configured, show a beautiful connection bridge UI
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 font-sans selection:bg-blue-500/30">
        <div className="max-w-2xl w-full">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-blue-600/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20">
                <Database className="text-blue-500" size={32} />
              </div>
              
              <h1 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">
                Database Bridge <span className="text-blue-500">Offline</span>
              </h1>
              
              <p className="text-neutral-400 font-medium mb-12 max-w-md leading-relaxed">
                PharmaCore Enterprise requires a secure connection to your Supabase instance. Please configure your environment credentials.
              </p>

              <div className="w-full grid gap-4 text-left">
                <div className="bg-neutral-950/50 border border-neutral-800 p-6 rounded-3xl flex items-start gap-4">
                  <div className="bg-neutral-900 p-2 rounded-lg text-neutral-400 mt-1">
                    <Terminal size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">Update Environment</h4>
                    <p className="text-neutral-500 text-xs">Edit <code className="text-blue-400">.env.local</code> and replace the placeholders with your project keys.</p>
                  </div>
                </div>

                <div className="bg-neutral-950/50 border border-neutral-800 p-6 rounded-3xl flex items-start gap-4">
                  <div className="bg-neutral-900 p-2 rounded-lg text-neutral-400 mt-1">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">Anon Key Found</h4>
                    <p className="text-neutral-500 text-xs">Locate your <span className="text-neutral-300 italic">anon_public</span> key in Supabase Project Settings.</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 w-full flex flex-col items-center gap-4">
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-900/20"
                >
                  Supabase Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest mt-4">
                  Automatic reload detected once configured
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

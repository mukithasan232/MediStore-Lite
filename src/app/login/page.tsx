"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Pill } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      // Safety check to ensure environment variables are loaded
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("Supabase URL is missing. Please check your .env.local file.");
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        // Optional: show a message if email verification is required
        setError("Account created. Please login now.");
        setIsLogin(true);
      }
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to the server. Please check your internet connection or ensure your database is running.");
      } else {
        setError(err.message || "An error occurred");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-100 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
        <div className="p-8 pb-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
            <Pill className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-neutral-500 mt-2 text-sm">
            {isLogin ? "Enter your credentials to access your store." : "Start managing your pharmacy with MediStore Lite."}
          </p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className={`p-3 text-sm rounded-lg ${error.includes('Account created') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Email</label>
              <input 
                type="email"
                {...register("email", { required: true })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                placeholder="owner@pharmacy.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Password</label>
              <input 
                type="password"
                {...register("password", { required: true, minLength: 6 })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-2 group"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-neutral-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-primary hover:text-primary-dark font-medium transition-colors"
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

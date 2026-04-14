"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) router.push("/dashboard");
      else router.push("/login");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 flex-col">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="mt-4 text-neutral-600 font-medium">Loading MediStore Lite...</span>
    </div>
  );
}

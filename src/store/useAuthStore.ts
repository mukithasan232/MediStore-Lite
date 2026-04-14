// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EnterpriseUser = {
  id: string;
  email: string;
  role: string;
  branchId?: string | null;
  branchName?: string | null;
};

interface AuthState {
  user: EnterpriseUser | null;
  setUser: (user: EnterpriseUser | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isLoading: true,
      setIsLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'pharma-core-auth',
    }
  )
);

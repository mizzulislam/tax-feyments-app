import { create } from "zustand";
import { TaxpayerProfile } from "@/types/taxpayer";

interface TaxpayerState {
  profile: TaxpayerProfile | null;
  isLoading: boolean;
  isMfaVerified: boolean;
  setProfile: (profile: TaxpayerProfile | null) => void;
  setIsLoading: (status: boolean) => void;
  setMfaStatus: (status: boolean) => void;
  clearStore: () => void;
}

export const useTaxpayerStore = create<TaxpayerState>((set) => ({
  profile: null,
  isLoading: false,
  isMfaVerified: false,

  setProfile: (profile) => set({ profile }),
  setIsLoading: (status) => set({ isLoading: status }),
  setMfaStatus: (status) => set({ isMfaVerified: status }),
  clearStore: () => set({ profile: null, isMfaVerified: false, isLoading: false }),
}));

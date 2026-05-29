import { create } from 'zustand';
import { TaxpayerProfile, IncomeSource, Asset, TaxDocument } from '@/types/taxpayer';
import { TaxReportData } from '@/hooks/useFetchReports';
import { v4 as uuidv4 } from 'uuid';

export type PersonaType = 'Karyawan' | 'Freelancer' | 'Karyawan + Freelancer' | 'UMKM' | 'Belajar Pajak' | null;

interface DemoState {
  isDemoMode: boolean;
  persona: PersonaType;
  setDemoMode: (active: boolean) => void;
  setPersona: (persona: PersonaType) => void;
  loadDemoData: (persona: PersonaType) => void;
  clearDemoMode: () => void;
  
  // Dynamic Demo Data Arrays
  demoProfile: TaxpayerProfile | null;
  demoIncomeSources: IncomeSource[];
  demoDocuments: TaxDocument[];
  demoAssets: Asset[];
  demoReports: TaxReportData[];

  // CRUD for Income
  addDemoIncome: (income: Partial<IncomeSource>) => void;
  deleteDemoIncome: (id: string) => void;

  // CRUD for Documents
  addDemoDocument: (doc: Partial<TaxDocument>) => void;
  deleteDemoDocument: (id: string) => void;

  // CRUD for Assets
  addDemoAsset: (asset: Partial<Asset>) => void;
  deleteDemoAsset: (id: string) => void;

  // CRUD for Reports
  addOrUpdateDemoReport: (report: Partial<TaxReportData>) => void;

  // Static helpers for UI that we haven't refactored yet
  demoDeadline: string;
}

const DEMO_USER_ID = 'demo-user-id';
const MOCK_DATE = new Date().toISOString();

export const useDemoStore = create<DemoState>((set) => ({
  isDemoMode: false,
  persona: null,
  
  demoProfile: null,
  demoIncomeSources: [],
  demoDocuments: [],
  demoAssets: [],
  demoReports: [],
  demoDeadline: '31 Maret',

  setDemoMode: (active) => set({ isDemoMode: active }),
  setPersona: (persona) => set({ persona }),

  loadDemoData: (persona) => {
    let profile: TaxpayerProfile = {
      fullName: 'Wajib Pajak (Demo)',
      nik: '1234567890123456',
      npwp: '123456789012345',
      taxpayerType: 'pribadi',
      phoneNumber: '081234567890'
    };

    let incomeSources: IncomeSource[] = [];
    let documents: TaxDocument[] = [];
    let assets: Asset[] = [];
    let reports: TaxReportData[] = [];

    if (persona === 'Karyawan + Freelancer' || persona === 'Karyawan' || persona === 'Freelancer') {
      incomeSources = [
        {
          id: uuidv4(),
          user_id: DEMO_USER_ID,
          created_at: MOCK_DATE,
          sourceName: 'PT Teknologi Inovasi',
          sourceType: 'pekerjaan_tetap',
          annualIncome: 120000000,
          taxYear: new Date().getFullYear(),
          isTaxWithheld: true,
          withheldAmount: 8500000,
          npwpPemotong: '987654321098765'
        }
      ];

      documents = [
        {
          id: uuidv4(),
          user_id: DEMO_USER_ID,
          created_at: MOCK_DATE,
          fileName: 'Invoice_Freelance_Desember.pdf',
          filePath: 'demo/invoice_freelance.pdf',
          fileSize: 204800,
          fileType: 'application/pdf',
          category: 'nota_transaksi',
          taxYear: new Date().getFullYear(),
          isVerified: true
        }
      ];

      reports = [
        {
          id: uuidv4(),
          tax_year: new Date().getFullYear(),
          tax_period: '12',
          gross_income: 156000000,
          tax_payable: 2450000,
          status: 'draft',
          created_at: MOCK_DATE
        }
      ];
    }

    set({
      isDemoMode: true,
      persona,
      demoProfile: profile,
      demoIncomeSources: incomeSources,
      demoDocuments: documents,
      demoAssets: assets,
      demoReports: reports,
      demoDeadline: 'SPT Tahunan OP',
    });
  },

  clearDemoMode: () => set({
    isDemoMode: false,
    persona: null,
    demoProfile: null,
    demoIncomeSources: [],
    demoDocuments: [],
    demoAssets: [],
    demoReports: [],
  }),

  addDemoIncome: (income) => set((state) => ({
    demoIncomeSources: [
      {
        ...income,
        id: uuidv4(),
        user_id: DEMO_USER_ID,
        created_at: new Date().toISOString(),
      } as IncomeSource,
      ...state.demoIncomeSources
    ]
  })),

  deleteDemoIncome: (id) => set((state) => ({
    demoIncomeSources: state.demoIncomeSources.filter(i => i.id !== id)
  })),

  addDemoDocument: (doc) => set((state) => ({
    demoDocuments: [
      {
        ...doc,
        id: uuidv4(),
        user_id: DEMO_USER_ID,
        created_at: new Date().toISOString(),
        isVerified: true
      } as TaxDocument,
      ...state.demoDocuments
    ]
  })),

  deleteDemoDocument: (id) => set((state) => ({
    demoDocuments: state.demoDocuments.filter(d => d.id !== id)
  })),

  addDemoAsset: (asset) => set((state) => ({
    demoAssets: [
      {
        ...asset,
        id: uuidv4(),
        user_id: DEMO_USER_ID,
        created_at: new Date().toISOString(),
      } as Asset,
      ...state.demoAssets
    ]
  })),

  deleteDemoAsset: (id) => set((state) => ({
    demoAssets: state.demoAssets.filter(a => a.id !== id)
  })),

  addOrUpdateDemoReport: (report) => set((state) => {
    const existingIndex = state.demoReports.findIndex(
      (r) => r.tax_year === report.tax_year && r.tax_period === report.tax_period
    );
    
    let newReports = [...state.demoReports];
    
    if (existingIndex >= 0) {
      newReports[existingIndex] = { ...newReports[existingIndex], ...report };
    } else {
      newReports.unshift({
        ...report,
        id: uuidv4(),
        created_at: new Date().toISOString()
      } as TaxReportData);
    }
    
    return { demoReports: newReports };
  }),
}));

import { z } from "zod";

// Regex pengunci: Memastikan input string hanya berisi angka 0-9
const numericRegex = /^[0-9]+$/;
const taxPeriodValues = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const;
const maxFinancialAmount = 999_999_999_999_999;

export const taxpayerProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Nama lengkap minimal terdiri dari 3 karakter." })
    .max(100, { message: "Nama lengkap maksimal 100 karakter." }),
  
  taxpayerType: z.enum(["pribadi", "badan"], {
    message: "Jenis wajib pajak harus dipilih antara 'pribadi' atau 'badan'.",
  }),

  // NIK Indonesia wajib tepat 16 digit angka sesuai KTP
  nik: z
    .string()
    .length(16, { message: "NIK harus tepat berukuran 16 digit." })
    .regex(numericRegex, { message: "NIK hanya boleh berisi karakter angka." }),

  // NPWP format 15 digit (lama) atau 16 digit (KTP/format baru per 2024/2026)
  npwp: z
    .string()
    .refine((val) => val.length === 15 || val.length === 16, {
      message: "NPWP wajib berukuran 15 digit atau 16 digit (format baru).",
    })
    .regex(numericRegex, { message: "NPWP hanya boleh berisi karakter angka tanpa tanda baca." }),

  phoneNumber: z
    .string()
    .min(10, { message: "Nomor telepon minimal berjumlah 10 digit." })
    .max(15, { message: "Nomor telepon maksimal berjumlah 15 digit." })
    .regex(/^\+?[0-9]+$/, { message: "Format nomor telepon tidak valid (Gunakan format standar angka)." }),

  // Bidang tambahan FR-03 (Personalisasi Profil & AI Assistant)
  username: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  domicile: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  currentCompany: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  hobbiesActivities: z.string().optional().nullable(),
  portfolioUrl: z.string().optional().nullable(),
  certificateName: z.string().optional().nullable(),
  specializationInterests: z.string().optional().nullable(),
  discoverySource: z.string().optional().nullable(),
  expectedMaterials: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  dependents: z.number().int().min(0).max(10).optional().nullable(),
  hobbies: z.string().optional().nullable(),
  role: z.enum(['user', 'consultant', 'admin']).optional(),
});

// Inferensi tipe otomatis dari skema Zod untuk TypeScript static typing
export type TaxpayerProfile = z.infer<typeof taxpayerProfileSchema>;

export const taxReportSchema = z.object({
  taxYear: z
    .number()
    .int()
    .min(2020, { message: "Tahun pajak minimal 2020." })
    .max(2100, { message: "Tahun pajak maksimal 2100." }),
  taxPeriod: z
    .enum(taxPeriodValues, { message: "Masa pajak harus berada di antara '01' sampai '12'." }),
  grossIncome: z
    .number()
    .finite({ message: "Penghasilan bruto harus berupa angka valid." })
    .min(0, { message: "Penghasilan bruto tidak boleh bernilai negatif." })
    .max(maxFinancialAmount, { message: "Penghasilan bruto melebihi batas sistem." }),
});

export type TaxReportInput = z.infer<typeof taxReportSchema>;

export const incomeSourceSchema = z.object({
  sourceName: z.string().min(2, { message: "Nama sumber minimal 2 karakter." }),
  sourceType: z.enum(['pekerjaan_tetap','pekerjaan_bebas','usaha','sewa','investasi','lainnya'], {
    message: "Jenis sumber harus dipilih dari opsi yang valid.",
  }),
  annualIncome: z.number().finite().min(0, { message: "Penghasilan bruto tidak boleh negatif." }).max(maxFinancialAmount),
  taxYear: z.number().int().min(2020, { message: "Tahun pajak minimal 2020." }).max(2100),
  npwpPemotong: z.string().optional().nullable().refine(val => !val || (numericRegex.test(val) && (val.length === 15 || val.length === 16)), { message: "NPWP pemotong harus 15 atau 16 digit angka." }),
  namaPemotong: z.string().optional().nullable(),
  isTaxWithheld: z.boolean().default(false),
  withheldAmount: z.number().finite().min(0, { message: "Jumlah PPh dipotong tidak boleh negatif." }).max(maxFinancialAmount).default(0),
  notes: z.string().optional().nullable(),
  registrationYearForUmkm: z.number().int().min(1950, { message: "Tahun registrasi tidak valid" }).max(2100).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export type IncomeSourceInput = z.infer<typeof incomeSourceSchema>;

export interface IncomeSource extends IncomeSourceInput {
  id: string;
  user_id: string;
  created_at: string;
}

export const assetSchema = z.object({
  assetName: z.string().min(2, { message: "Nama aset/harta minimal 2 karakter." }),
  assetType: z.enum(['tanah_bangunan','kendaraan','deposito_tabungan','saham_obligasi','piutang','perhiasan','peralatan','lainnya'], {
    message: "Jenis aset/harta harus dipilih dari opsi yang valid.",
  }),
  acquisitionYear: z.number().int().min(1950, { message: "Tahun perolehan minimal 1950." }),
  acquisitionValue: z.number().finite().min(0, { message: "Nilai perolehan tidak boleh negatif." }).max(maxFinancialAmount),
  currentValue: z.number().finite().min(0, { message: "Nilai perkiraan saat ini tidak boleh negatif." }).max(maxFinancialAmount).optional().nullable(),
  description: z.string().optional().nullable(),
  taxYear: z.number().int().min(2020, { message: "Tahun pajak pelaporan minimal 2020." }).max(2100),
});

export type AssetInput = z.infer<typeof assetSchema>;

export interface Asset extends AssetInput {
  id: string;
  user_id: string;
  created_at: string;
}

export const documentSchema = z.object({
  fileName: z.string().min(1, { message: "Nama file tidak boleh kosong." }),
  filePath: z.string().min(1, { message: "Path file tidak boleh kosong." }),
  fileSize: z.number().min(0),
  fileType: z.string().min(1),
  category: z.enum([
    'bukti_potong',
    'faktur_pajak',
    'spt_tahunan',
    'nota_transaksi',
    'laporan_keuangan',
    'rekening_koran',
    'surat_keterangan',
    'identitas',
    'lainnya'
  ], {
    message: "Kategori dokumen tidak valid.",
  }),
  taxYear: z.number().int().min(2020).optional().nullable(),
  description: z.string().optional().nullable(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

export interface TaxDocument extends DocumentInput {
  id: string;
  user_id: string;
  isVerified: boolean;
  created_at: string;
}

export const whatIfScenarioSchema = z.object({
  scenarioName: z.string().min(2, { message: "Nama skenario minimal 2 karakter." }),
  baseGrossIncome: z.number().min(0).default(0),
  basePtkpStatus: z.string().default('TK/0'),
  baseTaxResult: z.number().min(0).default(0),
  
  simGrossIncome: z.number().min(0).optional().nullable(),
  simPtkpStatus: z.string().optional().nullable(),
  simAdditionalIncome: z.number().min(0).default(0),
  simAdditionalDeductions: z.number().min(0).default(0),
  simUmkmMode: z.boolean().default(false),
  simUmkmOmzet: z.number().min(0).default(0),
  simTaxResult: z.number().min(0).default(0),
  
  taxDifference: z.number().default(0),
  savingsPercentage: z.number().default(0),
  notes: z.string().optional().nullable(),
});

export type WhatIfScenarioInput = z.infer<typeof whatIfScenarioSchema>;

export interface WhatIfScenario extends WhatIfScenarioInput {
  id: string;
  user_id: string;
  created_at: string;
}

export type UserRole = 'user' | 'consultant' | 'admin';
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AdminUser {
  id: string;
  email: string | null;
  fullName: string | null;
  npwp: string | null;
  role: UserRole;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetTable: string | null;
  targetId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  severity: AuditSeverity;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalTaxPayable: number;
  pendingDocuments: number;
  auditEventsToday: number;
  criticalAuditEvents: number;
  systemHealth: number;
  registrationTrend: Array<{ label: string; count: number }>;
}

export interface AdminDocument {
  id: string;
  userId: string;
  ownerName: string | null;
  fileName: string;
  fileType: string;
  category: string;
  taxYear: number | null;
  isVerified: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type CmsTaxDifficulty = 'dasar' | 'menengah' | 'lanjut';
export type CmsLearningStatus = 'belum' | 'sedang' | 'selesai';

export interface CmsTaxModule {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  difficulty: CmsTaxDifficulty;
  category: string;
  status: CmsLearningStatus;
  quizScore: number | null;
  estimatedMinutes: number;
  icon: string;
  intro: string;
  learningGoals: string[];
  coreConcept: string;
  keyPoints: string[];
  analogyTitle: string;
  analogy: string;
  relevanceTitle: string;
  relevance: string;
  practicalChecklist: string[];
  nextSteps: string[];
  caution: string;
  isPublished: boolean;
  orderIndex: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type CmsTaxModuleInput = Omit<CmsTaxModule, 'id' | 'createdAt' | 'updatedAt'>;

export type BillingStatus = 'draft' | 'reviewed' | 'exported' | 'cancelled';

export interface BillingCode {
  id: string;
  user_id: string;
  report_id: string | null;
  billingCode: string;
  amount: number;
  taxType: string;
  status: BillingStatus;
  expiresAt: string;
  paidAt: string | null;
  created_at: string;
  report?: {
    tax_year: number;
    tax_period: string;
    status: string;
  } | null;
}

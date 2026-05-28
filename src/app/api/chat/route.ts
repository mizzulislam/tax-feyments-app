import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeMarkdown, sanitizePlainText } from '@/lib/sanitize';
import { createScopedServerClient, logSecurityEvent } from '@/lib/adminServer';
import { ApiAuthError, requireBearerToken } from '@/lib/apiAuth';
import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 20;

// Daftar kata kunci berisiko tinggi atau sengketa perpajakan
const RISK_WORDS = [
  'sengketa', 
  'banding', 
  'penggelapan', 
  'pidana', 
  'manipulasi', 
  'korupsi', 
  'tax evasion', 
  'fraud', 
  'hukum', 
  'sanksi', 
  'denda', 
  'palsu', 
  'menghindari pajak'
];

const MANDATORY_SAFETY_SYSTEM_PROMPT = `
⚠️ PERINGATAN KEAMANAN MUTLAK (SANGAT KETAT) ⚠️
Kamu DILARANG KERAS:
1. Memberikan saran penggelapan pajak, penghindaran pajak ilegal (tax evasion), atau manipulasi data keuangan.
2. Membantu menyembunyikan aset, mengubah nominal transaksi palsu, atau membuat faktur fiktif.
3. Mengajarkan cara menyuap petugas pajak atau memalsukan dokumen SPT.
4. Menjawab pertanyaan di luar konteks perpajakan, keuangan, atau fitur aplikasi "My Tax".
Jika pengguna meminta hal-hal di atas, kamu WAJIB menolak dengan sopan dan mengingatkan mereka tentang risiko hukum yang berlaku di Indonesia.
`;

interface AiTaxContextPayload {
  currentYear?: number;
  totalIncome?: number;
  totalTax?: number;
  draftCount?: number;
  submittedCount?: number;
  paidCount?: number;
  incomeSources?: Array<{ name?: string; type?: string; annualIncome?: number; taxYear?: number }>;
  assets?: Array<{ name?: string; type?: string; currentValue?: number | null; taxYear?: number }>;
  recentTransactions?: Array<{ date?: string; amount?: number; category?: string; description?: string | null; taxType?: string | null }>;
  recentScenarios?: Array<{ name?: string; baseTax?: number; simTax?: number | null; taxSaving?: number | null }>;
}

type ChatHistoryItem = {
  role: 'user' | 'ai' | 'system';
  content: string;
};

type SupabaseQueryResult<T> = PromiseLike<{
  data: T | null;
  error: { code?: string; message?: string } | null;
}>;

type RateLimitResult = {
  allowed: boolean;
  retry_after: number;
  remaining: number;
  reset_at: string;
};

async function safeSelect<T>(query: SupabaseQueryResult<T>, fallback: T): Promise<T> {
  const { data, error } = await query;
  if (error) {
    const message = String(error.message || '');
    if (
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      error.code === 'PGRST204' ||
      error.code === 'P0001' ||
      message.includes('Could not find')
    ) {
      return fallback;
    }
    throw new Error(message);
  }
  return data ?? fallback;
}

async function consumeChatRateLimit(
  supabase: ReturnType<typeof createScopedServerClient>,
  payload: {
    userId: string;
    ipAddress: string;
  }
) {
  const rateKey = `api:chat:${payload.userId}:${payload.ipAddress || 'unknown'}`;
  const { data, error } = await supabase.rpc('consume_rate_limit', {
    p_key: rateKey,
    p_user_id: payload.userId,
    p_endpoint: 'api:chat',
    p_limit: RATE_LIMIT_MAX,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
  });

  if (error) {
    throw new Error(error.message || 'Rate limiter database tidak tersedia.');
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error('Rate limiter tidak mengembalikan hasil.');
  }

  return result as RateLimitResult;
}

function formatRupiah(value?: number | null) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function formatAiContext(aiContext?: AiTaxContextPayload | null) {
  if (!aiContext) {
    return 'Konteks multi-source belum tersedia dari aplikasi.';
  }

  const incomeSources = (aiContext.incomeSources || [])
    .slice(0, 6)
    .map((source) => `${source.name || 'Sumber'} (${source.type || '-'}): ${formatRupiah(source.annualIncome)}/tahun ${source.taxYear || ''}`.trim())
    .join('; ') || 'Belum ada sumber penghasilan tersimpan';

  const recentTransactions = (aiContext.recentTransactions || [])
    .slice(0, 6)
    .map((trx) => `${trx.date || '-'} ${trx.category || 'Transaksi'} ${formatRupiah(trx.amount)} (${trx.taxType || 'jenis pajak belum diklasifikasi'})`)
    .join('; ') || 'Belum ada transaksi terbaru';

  const assets = (aiContext.assets || [])
    .slice(0, 5)
    .map((asset) => `${asset.name || 'Aset'} (${asset.type || '-'}): ${asset.currentValue === null ? 'nilai kini belum diisi' : formatRupiah(asset.currentValue)}`)
    .join('; ') || 'Belum ada aset tersimpan';

  const scenarios = (aiContext.recentScenarios || [])
    .slice(0, 4)
    .map((scenario) => `${scenario.name || 'Skenario'}: pajak dasar ${formatRupiah(scenario.baseTax)}, simulasi ${scenario.simTax === null ? 'belum dihitung' : formatRupiah(scenario.simTax)}, selisih ${scenario.taxSaving === null ? 'belum dihitung' : formatRupiah(scenario.taxSaving)}`)
    .join('; ') || 'Belum ada skenario what-if';

  return [
    `Tahun konteks: ${aiContext.currentYear || new Date().getFullYear()}`,
    `Total Penghasilan Tahun Ini: ${formatRupiah(aiContext.totalIncome)}`,
    `Total Pajak Terutang Tahun Ini: ${formatRupiah(aiContext.totalTax)}`,
    `Status Laporan: ${aiContext.draftCount || 0} draft, ${aiContext.submittedCount || 0} submitted, ${aiContext.paidCount || 0} lunas`,
    `Sumber Penghasilan: ${incomeSources}`,
    `Aset Tercatat: ${assets}`,
    `Transaksi Terakhir: ${recentTransactions}`,
    `Skenario What-If Terakhir: ${scenarios}`,
  ].join('\n- ');
}

async function fetchAiTaxContextForUser(
  supabase: ReturnType<typeof createScopedServerClient>,
  userId: string
): Promise<AiTaxContextPayload> {
  const currentYear = new Date().getFullYear();
  const [reports, incomeSources, assets, transactions, scenarios] = await Promise.all([
    safeSelect<Array<{ tax_year: number | string | null; gross_income: number | string | null; tax_payable: number | string | null; status: string | null }>>(
      supabase
        .from('tax_reports')
        .select('tax_year, gross_income, tax_payable, status')
        .eq('user_id', userId),
      []
    ),
    safeSelect<Array<{ source_name: string | null; source_type: string | null; annual_income: number | string | null; tax_year: number | string | null }>>(
      supabase
        .from('income_sources')
        .select('source_name, source_type, annual_income, tax_year')
        .eq('user_id', userId)
        .order('annual_income', { ascending: false })
        .limit(8),
      []
    ),
    safeSelect<Array<{ asset_name: string | null; asset_type: string | null; current_value: number | string | null; tax_year: number | string | null }>>(
      supabase
        .from('assets')
        .select('asset_name, asset_type, current_value, tax_year')
        .eq('user_id', userId)
        .order('current_value', { ascending: false })
        .limit(8),
      []
    ),
    safeSelect<Array<{ date: string | null; amount: number | string | null; category: string | null; description: string | null; tax_type: string | null }>>(
      supabase
        .from('transactions')
        .select('date, amount, category, description, tax_type')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(8),
      []
    ),
    safeSelect<Array<{ scenario_name: string | null; base_tax_result: number | string | null; sim_tax_result: number | string | null; tax_difference: number | string | null }>>(
      supabase
        .from('what_if_scenarios')
        .select('scenario_name, base_tax_result, sim_tax_result, tax_difference, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      []
    ),
  ]);

  const currentYearReports = reports.filter((report) => Number(report.tax_year) === currentYear);

  return {
    currentYear,
    totalIncome: currentYearReports.reduce((sum, report) => sum + Number(report.gross_income || 0), 0),
    totalTax: currentYearReports.reduce((sum, report) => sum + Number(report.tax_payable || 0), 0),
    draftCount: reports.filter((report) => report.status === 'draft').length,
    submittedCount: reports.filter((report) => report.status === 'submitted').length,
    paidCount: reports.filter((report) => report.status === 'paid').length,
    incomeSources: incomeSources.map((source) => ({
      name: source.source_name || 'Sumber penghasilan',
      type: source.source_type || '-',
      annualIncome: Number(source.annual_income || 0),
      taxYear: Number(source.tax_year || currentYear),
    })),
    assets: assets.map((asset) => ({
      name: asset.asset_name || 'Aset',
      type: asset.asset_type || '-',
      currentValue: asset.current_value === null ? null : Number(asset.current_value || 0),
      taxYear: Number(asset.tax_year || currentYear),
    })),
    recentTransactions: transactions.map((transaction) => ({
      date: transaction.date || '-',
      amount: Number(transaction.amount || 0),
      category: transaction.category || 'Transaksi',
      description: transaction.description,
      taxType: transaction.tax_type,
    })),
    recentScenarios: scenarios.map((scenario) => ({
      name: scenario.scenario_name || 'Skenario',
      baseTax: Number(scenario.base_tax_result || 0),
      simTax: scenario.sim_tax_result === null ? null : Number(scenario.sim_tax_result || 0),
      taxSaving: scenario.tax_difference === null ? null : Number(scenario.tax_difference || 0),
    })),
  };
}

export async function POST(req: NextRequest) {
  let message = '';
  let context: {
    id?: string;
    full_name?: string | null;
    occupation?: string | null;
    education?: string | null;
    education_level?: string | null;
    hobbies?: string | null;
  } | null = null;
  let aiContext: AiTaxContextPayload | null = null;
  let sessionId: string | null = null;
  let persona = 'umum';
  let tone = 'jelas';
  let customPersonaInstruction: string | null = null;
  let history: ChatHistoryItem[] = [];

  try {
    requireBearerToken(req.headers);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      await logSecurityEvent({
        action: 'AI_CHAT_AUTH_MISSING_BEARER',
        severity: 'warning',
        req,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const supabase = createScopedServerClient(req);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    await logSecurityEvent({
      action: 'AI_CHAT_AUTH_INVALID_SESSION',
      severity: 'warning',
      details: { reason: userError?.message || 'missing user' },
      req,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    message = sanitizePlainText(body.message, 1200);
    sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;
    persona = sanitizePlainText(body.persona || 'umum', 80);
    tone = sanitizePlainText(body.tone || 'jelas', 80);
    customPersonaInstruction = typeof body.customPersonaInstruction === 'string'
      ? sanitizePlainText(body.customPersonaInstruction, 700)
      : null;
  } catch {
    return new Response(JSON.stringify({ error: 'Format permintaan tidak valid' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, occupation, education, hobbies')
    .eq('id', user.id)
    .maybeSingle();

  context = profile || { id: user.id, full_name: user.email || 'Wajib Pajak' };
  aiContext = await fetchAiTaxContextForUser(supabase, user.id);

  if (sessionId) {
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!session) {
      await logSecurityEvent({
        actorId: user.id,
        actorEmail: user.email || null,
        action: 'AI_CHAT_SESSION_FORBIDDEN',
        targetTable: 'chat_sessions',
        targetId: sessionId,
        severity: 'warning',
        req,
      });
      return NextResponse.json({ error: 'Sesi chat tidak ditemukan atau bukan milik pengguna.' }, { status: 403 });
    }

    const rows = await safeSelect<Array<{ role: 'user' | 'ai' | 'system'; content: string }>>(
      supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10),
      []
    );
    history = rows.reverse().map((item) => ({
      role: item.role,
      content: sanitizePlainText(item.content, 1200),
    }));
  }

  if (!message) {
    return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  let rateLimit: RateLimitResult;
  try {
    rateLimit = await consumeChatRateLimit(supabase, {
      userId: user.id,
      ipAddress: forwardedFor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rate limiter database tidak tersedia.';
    return NextResponse.json(
      { error: `Rate limiter belum siap: ${message}` },
      { status: 503 }
    );
  }

  if (!rateLimit.allowed) {
    await logSecurityEvent({
      actorId: user.id,
      actorEmail: user.email || null,
      action: 'AI_CHAT_RATE_LIMITED',
      severity: 'warning',
      details: {
        retryAfter: rateLimit.retry_after,
        resetAt: rateLimit.reset_at,
      },
      req,
    });
    return new Response(JSON.stringify({ error: 'Rate limit tercapai. Coba lagi dalam sekitar 1 menit.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(rateLimit.retry_after, 1)),
      },
    });
  }

  const currentApiKey = process.env.GEMINI_API_KEY || '';

  // Fallback ke kunci default dihapus untuk keamanan
  if (!currentApiKey) {
    console.error('[AI Chat API] GEMINI_API_KEY is not defined in environment variables.');
    return new Response(
      JSON.stringify({ 
        error: 'Konfigurasi server bermasalah: GEMINI_API_KEY tidak dikonfigurasi di environment variables.' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const dynamicGenAI = new GoogleGenerativeAI(currentApiKey);

  // Deteksi tingkat risiko berdasarkan kata kunci
  const isHighRisk = RISK_WORDS.some((word) => 
    message.toLowerCase().includes(word)
  );

  // Deskripsi persona dan analogi (Feynman Technique support)
  let personaInstruction = '';
  switch (persona) {
    case 'karyawan':
      personaInstruction = 'Gunakan analogi dunia karyawan seperti slip gaji, bukti potong 1721-A1, tunjangan, bonus, lembur, iuran pensiun, dan HR/payroll untuk menjelaskan istilah perpajakan.';
      break;
    case 'umkm':
      personaInstruction = 'Gunakan analogi pelaku UMKM seperti omzet harian, kas toko, stok barang, pelanggan, nota penjualan, biaya operasional, dan PPh Final UMKM untuk menjelaskan istilah perpajakan.';
      break;
    case 'pengusaha':
      personaInstruction = 'Gunakan analogi dunia usaha seperti cashflow, margin, biaya usaha, invoice, piutang, ekspansi, arus kas, dan pembukuan untuk menjelaskan istilah perpajakan.';
      break;
    case 'investor':
      personaInstruction = 'Gunakan analogi investasi seperti portofolio, dividen, bunga, capital gain, risiko, rebalancing, dan laporan broker untuk menjelaskan istilah perpajakan.';
      break;
    case 'properti':
      personaInstruction = 'Gunakan analogi pemilik aset seperti sewa rumah, tanah/bangunan, nilai perolehan, NJOP, cicilan, renovasi, dan daftar harta SPT untuk menjelaskan istilah perpajakan.';
      break;
    case 'keluarga':
      personaInstruction = 'Gunakan analogi keluarga dan rumah tangga seperti tanggungan, pasangan, anak, biaya sekolah, anggaran bulanan, dan status PTKP untuk menjelaskan istilah perpajakan.';
      break;
    case 'pensiunan':
      personaInstruction = 'Gunakan analogi masa pensiun seperti dana pensiun, penghasilan pasif, tabungan hari tua, biaya kesehatan, dan pengelolaan aset untuk menjelaskan istilah perpajakan.';
      break;
    case 'konsultan':
      personaInstruction = 'Gunakan analogi kerja konsultan pajak/akuntan seperti rekonsiliasi data, checklist dokumen, working paper, audit trail, risiko kepatuhan, dan review SPT untuk menjelaskan istilah perpajakan.';
      break;
    case 'gamer':
      personaInstruction = 'Gunakan analogi dunia game seperti leveling up, quest, grinding, item shop, mana, HP, dan boss fight untuk menjelaskan istilah perpajakan.';
      break;
    case 'kpop':
      personaInstruction = 'Gunakan analogi dunia K-Pop seperti album debut, photocard (PC), comeback, fanchant, bias, dan konser stadium untuk menjelaskan istilah perpajakan.';
      break;
    case 'bola':
      personaInstruction = 'Gunakan analogi sepak bola seperti mencetak gol, kartu kuning/merah, formasi taktis, offside, penalty, dan babak tambahan untuk menjelaskan istilah perpajakan.';
      break;
    case 'traveler':
      personaInstruction = 'Gunakan analogi petualangan seperti boarding pass, paspor, itinerary perjalanan, transit, pemandu wisata, dan penginapan untuk menjelaskan istilah perpajakan.';
      break;
    case 'otaku':
      personaInstruction = 'Gunakan analogi dunia anime seperti kekuatan tersembunyi, jurus pamungkas, nakama, filler episode, dan evolusi karakter untuk menjelaskan istilah perpajakan.';
      break;
    case 'freelancer':
      personaInstruction = 'Gunakan analogi dunia kerja lepas seperti gig economy, invoice macet, revisi tanpa batas dari klien, deadline mepet, dan portfolio untuk menjelaskan istilah perpajakan.';
      break;
    case 'barista':
      personaInstruction = 'Gunakan analogi pembuatan kopi seperti takaran espresso, latte art, roasting, gilingan biji, dan racikan sirup untuk menjelaskan istilah perpajakan.';
      break;
    case 'creator':
      personaInstruction = 'Gunakan analogi media sosial seperti algoritma, view meledak, endorse, kolaborasi, subscribers, dan video viral untuk menjelaskan istilah perpajakan.';
      break;
    case 'pelajar':
      personaInstruction = 'Gunakan analogi sekolah seperti ujian akhir semester, tugas kelompok, PR mendadak, bolos kelas, uang jajan harian, dan kerja kelompok untuk menjelaskan istilah perpajakan.';
      break;
    default:
      personaInstruction = 'Gunakan analogi kehidupan sehari-hari yang sederhana dan mudah dipahami oleh orang awam.';
  }

  if (persona.startsWith('custom_') && customPersonaInstruction) {
    personaInstruction = customPersonaInstruction;
  }

  // Deskripsi tone bahasa
  let toneInstruction = '';
  switch (tone) {
    case 'jelas':
      toneInstruction = 'Gunakan gaya bahasa netral, jelas, ramah, tidak terlalu gaul dan tidak terlalu formal. Cocok untuk mayoritas wajib pajak dari berbagai latar belakang.';
      break;
    case 'eksekutif':
      toneInstruction = 'Gunakan gaya bahasa ringkas, strategis, dan langsung ke keputusan. Mulai dengan kesimpulan, lalu beri poin risiko, dampak, dan langkah berikutnya.';
      break;
    case 'step':
      toneInstruction = 'Gunakan gaya bahasa sangat terstruktur dan bertahap. Pecah jawaban menjadi langkah 1, langkah 2, langkah 3, dengan checklist tindakan yang praktis.';
      break;
    case 'patuh':
      toneInstruction = 'Gunakan gaya bahasa hati-hati, berbasis kepatuhan, dan menekankan batas aman. Jelaskan aturan, dokumen pendukung, risiko sanksi, serta kapan perlu konsultasi profesional.';
      break;
    case 'empatik':
      toneInstruction = 'Gunakan gaya bahasa hangat, menenangkan, suportif, dan tidak menghakimi. Cocok untuk wajib pajak yang cemas, baru pertama lapor, atau menghadapi denda/surat pajak.';
      break;
    case 'formal':
      toneInstruction = 'Gunakan gaya bahasa sopan, terstruktur, formal, berwibawa, dan tertata rapi layaknya konsultan profesional senior.';
      break;
    case 'humor':
      toneInstruction = 'Gunakan gaya bahasa yang jenaka, penuh candaan kocak, sarkasme ringan, pantun lucu, dan menghibur agar materi pajak tidak membosankan.';
      break;
    case 'simple':
      toneInstruction = 'Gunakan gaya bahasa anak-anak yang super simpel, ramah, dan sangat mendasar seolah menjelaskan ke anak kecil berusia 10 tahun.';
      break;
    default: // 'gaul'
      toneInstruction = 'Gunakan gaya bahasa santai anak muda Jakarta (lue-gue, gaul, asik, pakai kata-kata seru, hindari formalitas berlebihan).';
  }

  const systemInstruction = `Kamu adalah Feyn, Asisten Konsultan Pajak dari aplikasi "My Tax".
Tugasmu adalah menjawab pertanyaan tentang pajak di Indonesia dengan gaya bahasa yang SANGAT luwes, asik, to the point (langsung ke intinya tanpa basa-basi), dan akurat. Hindari jargon teknis tingkat dewa tanpa analogi.

🎯 PANDUAN MENJAWAB (WAJIB DIIKUTI!):
1. **Langsung Jawab & To the Point:** Paragraf pertama langsung menjawab pertanyaannya. 
2. **Visual & Rich Formatting:** Gunakan elemen Markdown yang menarik agar enak dibaca. 
   - Gunakan format header level 3 (\`### 💡 Analogi "[Nama Analogi]"\` atau \`### 📝 Catatan Penting\` atau \`### 📊 Perbandingan ...\`) secara aktif! Setiap kali Anda memberikan analogi atau poin penting, letakkan di bawah header level 3 tersebut agar sistem bisa merendernya sebagai Kartu Callout Visual yang cantik.
   - Gunakan emojis secara melimpah (minimal 1 emoji di setiap sub-heading dan list item) untuk memberikan elemen grafis visual pendukung!
   - Highlight kalimat penting, kata kunci, tarif pajak, atau angka penting menggunakan format Bold (\`**teks**\`) atau inline code (\`\`teks\`\`) agar otomatis disorot dengan warna khusus di aplikasi!
3. **Format Tabel Perbandingan:** Jika membandingkan dua tarif, kategori, atau opsi pajak, Anda **WAJIB** menuliskannya dalam format tabel Markdown (dengan | dan -). Ini akan otomatis dirender menjadi tabel visual interaktif dengan bar indikator persentase!
4. **Penyederhanaan Terekstrem:** Kalau ada istilah teknis, langsung ubah ke analogi kehidupan sehari-hari berdasarkan Persona dan Tone yang ditentukan.
5. **Mini Kuis & Gamifikasi (INTERAKTIF):** Di akhir jawabanmu, Anda **WAJIB** menyertakan mini kuis interaktif berupa format JSON DI DALAM CODEBLOCK \`\`\`quiz. Buat array yang berisi MINIMAL 3 SOAL kuis terkait penjelasanmu! JANGAN tulis gamifikasi, achievement, atau reward di luar codeblock JSON.

Contoh format kuis wajib (pastikan JSON valid dan memiliki properti persis seperti ini):
\`\`\`quiz
{
  "quizzes": [
    {
      "question": "Pajak apa yang dikenakan saat kamu beli kopi di cafe?",
      "options": ["Pajak Penghasilan (PPh)", "Pajak Pertambahan Nilai (PPN)", "Pajak Bumi dan Bangunan (PBB)"],
      "correctAnswerIndex": 1,
      "explanation": "Yap! PPN (Pajak Pertambahan Nilai) dikenakan untuk konsumsi barang/jasa, termasuk beli kopi!"
    },
    {
      "question": "Berapa tarif dasar PPN saat ini?",
      "options": ["10%", "11%", "5%"],
      "correctAnswerIndex": 1,
      "explanation": "Benar! Tarif dasar PPN saat ini adalah 11%."
    },
    {
      "question": "Jika Izzul berpenghasilan Rp 3.000.000 sebulan, apakah wajib membayar PPh 21?",
      "options": ["Ya, wajib", "Tidak, karena di bawah PTKP", "Ya, tapi hanya 1%"],
      "correctAnswerIndex": 1,
      "explanation": "Benar sekali! Karena Rp 3 juta/bulan (Rp 36 juta/tahun) masih di bawah batas PTKP (Rp 54 juta/tahun), Izzul tidak wajib membayar PPh 21!"
    }
  ],
  "reward": {
    "title": "TAX-FREE MASTER",
    "xp": 750
  }
}
\`\`\`

Kamu sedang berbicara dengan ${context?.full_name || 'Teman Feyn'}. 
Pekerjaan asli: ${context?.occupation || '-'}
Pendidikan: ${context?.education || context?.education_level || '-'}
Hobi/Minat: ${context?.hobbies || 'Umum'}

Konteks pajak multi-source dari aplikasi:
- ${formatAiContext(aiContext)}

ID sesi chat aktif: ${sessionId || 'sesi sementara / belum disimpan'}

💡 STRATEGI PERSONA & TONE WAJIB:
- Persona Anda saat ini: ${persona.toUpperCase()}
  -> Aturan Persona: ${personaInstruction}
- Tone suara Anda saat ini: ${tone.toUpperCase()}
  -> Aturan Tone: ${toneInstruction}
  
Buatlah analogi spesifik yang mencocokkan dunia dari Persona tersebut dengan konsep perpajakan yang sedang dijelaskan!

${MANDATORY_SAFETY_SYSTEM_PROMPT}`;

  // Format history ke dalam prompt
  let formattedPrompt = '';
  if (history && history.length > 0) {
    formattedPrompt += 'Berikut adalah riwayat percakapan sebelumnya untuk referensi Anda:\n';
    history.forEach((h) => {
      const roleName = h.role === 'user' ? 'User' : 'Feyn (AI)';
      const text = h.content || '';
      if (text) {
        formattedPrompt += `[${roleName}]: ${text}\n`;
      }
    });
    formattedPrompt += '\nKini, lanjutkan percakapan dan jawab pertanyaan berikut:\n';
  }
  formattedPrompt += `Pertanyaan/Pesan Pengguna: ${message}`;

  const buildLocalFallbackAnswer = () => {
    const lowerMessage = message.toLowerCase();
    const pphFinalUmkm = lowerMessage.includes('umkm') || lowerMessage.includes('0.5') || lowerMessage.includes('final');
    const pph21 = lowerMessage.includes('pph 21') || lowerMessage.includes('ter') || lowerMessage.includes('pegawai');

    if (pphFinalUmkm) {
      return `Maaf, koneksi ke Gemini sedang gagal, jadi Feyn pakai mode fallback lokal dulu.\n\n### Ringkasnya\n**PPh Final UMKM 0.5%** adalah pajak final untuk pelaku usaha dengan omzet bruto sampai **Rp 4,8 miliar setahun**. Untuk Wajib Pajak Orang Pribadi UMKM, omzet sampai **Rp 500 juta setahun** tidak dikenai PPh Final 0.5%.\n\n| Topik | Ketentuan umum |\n| - | - |\n| Tarif | 0.5% dari omzet bruto |\n| Batas omzet | Sampai Rp 4,8 miliar per tahun |\n| Orang pribadi UMKM | Bagian omzet sampai Rp 500 juta/tahun bebas PPh Final |\n| Sifat pajak | Final, tidak digabung ke tarif progresif Pasal 17 |\n\n### Catatan Penting\nSimpan catatan omzet bulanan, bukti transaksi, dan pisahkan omzet usaha dari penghasilan lain agar pelaporan SPT lebih rapi.`;
    }

    if (pph21) {
      return `Maaf, koneksi ke Gemini sedang gagal, jadi Feyn pakai mode fallback lokal dulu.\n\n### Ringkasnya\n**PPh 21** adalah pajak atas penghasilan dari pekerjaan, jasa, atau kegiatan. Skema **TER** dipakai untuk pemotongan bulanan pegawai, lalu perhitungan tahunan tetap direkonsiliasi di akhir tahun.\n\n| Tahap | Inti perhitungan |\n| - | - |\n| Bulanan | Gunakan TER sesuai status PTKP dan penghasilan bruto bulanan |\n| Tahunan | Hitung penghasilan neto, kurangi PTKP, lalu pakai tarif progresif Pasal 17 |\n| Selisih | Dikoreksi pada masa pajak terakhir atau SPT |\n\n### Catatan Penting\nStatus PTKP, penghasilan bruto, tunjangan, dan potongan sangat memengaruhi hasil akhir.`;
    }

    return `Maaf, koneksi ke Gemini sedang gagal, jadi Feyn pakai mode fallback lokal dulu.\n\n### Jawaban Singkat\nPertanyaan Anda sudah diterima, tetapi layanan AI eksternal sedang tidak merespons. Coba lagi beberapa saat lagi, atau cek konfigurasi **GEMINI_API_KEY**, kuota/billing, dan akses model di Google AI Studio.\n\n### Saran Cepat\nUntuk pertanyaan pajak umum, pastikan data profil, penghasilan, transaksi, dan draft laporan sudah terisi agar jawaban AI bisa lebih kontekstual saat layanan Gemini kembali normal.`;
  };

  // Tentukan model dengan mekanisme fallback dinamis saat runtime
  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash'];
  let aiText = '';
  let selectedModelName = '';
  const modelErrors: Array<{ model: string; error: string }> = [];

  for (const modelName of modelsToTry) {
    try {
      selectedModelName = modelName;
      console.log(`[AI Chat API] Trying model: ${modelName}`);
      const model = dynamicGenAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
      });
      const result = await model.generateContent(formattedPrompt);
      aiText = result.response.text();
      console.log(`[AI Chat API] Successfully generated response with model: ${modelName}`);
      break;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Gagal memproses respons dengan model ${modelName}:`, errMsg);
      modelErrors.push({ model: modelName, error: errMsg });
    }
  }

  if (!aiText) {
    console.error('[AI Chat API] All Gemini models failed to respond.');
    aiText = buildLocalFallbackAnswer();
    selectedModelName = 'local-fallback';
  }

  try {
    const encoder = new TextEncoder();
      const safeAiText = sanitizeMarkdown(aiText);
      const finalText = isHighRisk
      ? `${safeAiText}\n\n> PENTING / RISIKO TINGGI: Pertanyaan Anda menyentuh topik hukum/perpajakan yang cukup kompleks atau berisiko tinggi. Informasi di atas disediakan sebagai dasar pemahaman awal. Harap konsultasikan lebih lanjut dengan konsultan pajak bersertifikat atau ahli hukum resmi untuk penanganan kasus hukum konkret Anda secara sah.`
      : safeAiText;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chunkSize = 180;
          for (let i = 0; i < finalText.length; i += chunkSize) {
            controller.enqueue(encoder.encode(finalText.slice(i, i + chunkSize)));
            await new Promise((resolve) => setTimeout(resolve, 12));
          }
          controller.close();
        } catch (streamError: unknown) {
          console.error('Error during content stream writing:', streamError);
          const message = streamError instanceof Error ? streamError.message : String(streamError);
          controller.enqueue(encoder.encode(`\n\n[Terjadi gangguan koneksi streaming jawaban: ${message}]`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-High-Risk': isHighRisk ? 'true' : 'false',
        'X-Model-Used': selectedModelName,
        'Access-Control-Expose-Headers': 'X-High-Risk, X-Model-Used',
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Gemini Stream Error:', message);
    return new Response(JSON.stringify({ error: `Gagal memproses AI stream: ${message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

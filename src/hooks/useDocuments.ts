import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TaxDocument } from '@/types/taxpayer';
import { v4 as uuidv4 } from 'uuid';
import { useDemoStore } from '@/store/useDemoStore';

type DocumentRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | string;
  file_type: string;
  category: TaxDocument['category'];
  tax_year: number | string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
};

export function useFetchDocuments(category?: string, taxYear?: number) {
  return useQuery<TaxDocument[]>({
    queryKey: ['documents_list', category, taxYear],
    queryFn: async () => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        let docs = demoState.demoDocuments;
        if (category) docs = docs.filter(d => d.category === category);
        if (taxYear) docs = docs.filter(d => d.taxYear === taxYear);
        return docs as TaxDocument[];
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (category) query = query.eq('category', category);
      if (taxYear) query = query.eq('tax_year', taxYear);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes("Could not find the table") || error.code === 'P0001') {
          return [];
        }
        throw new Error(error.message);
      }

      return ((data || []) as DocumentRow[]).map((d) => ({
        id: d.id,
        user_id: d.user_id,
        fileName: d.file_name,
        filePath: d.file_path,
        fileSize: Number(d.file_size),
        fileType: d.file_type,
        category: d.category,
        taxYear: d.tax_year ? Number(d.tax_year) : null,
        description: d.description,
        isVerified: d.is_verified,
        created_at: d.created_at,
      }));
    },
  });
}

// Upload file to storage and insert metadata to DB
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      category,
      taxYear,
      description
    }: {
      file: File;
      category: string;
      taxYear?: number;
      description?: string;
    }) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate upload
        
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExt}`;
        const filePath = `demo/${category}/${uniqueFileName}`;
        
        const doc: Partial<TaxDocument> = {
          fileName: file.name,
          filePath: filePath,
          fileSize: file.size,
          fileType: file.type,
          category: category as any,
          taxYear: taxYear || null,
          description: description || null,
        };
        demoState.addDemoDocument(doc);
        return { id: 'demo-doc', ...doc };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi aktif tidak ditemukan.');

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${category}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tax-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Gagal upload file: ${uploadError.message}`);
      }

      // 2. Insert metadata to documents table
      const CATEGORY_PREFIXES: Record<string, string> = {
        'bukti_potong': 'BP',
        'faktur_pajak': 'FP',
        'spt_tahunan': 'SPT',
        'nota_transaksi': 'NOTA',
        'laporan_keuangan': 'LK',
        'rekening_koran': 'RK',
        'surat_keterangan': 'SK',
        'identitas': 'ID',
        'lainnya': 'DOC'
      };
      const prefix = CATEGORY_PREFIXES[category] || 'DOC';
      const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const newFileName = `${prefix}_${cleanOriginalName}`;

      const payload = {
        user_id: user.id,
        file_name: newFileName,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category: category,
        tax_year: taxYear || null,
        description: description || null,
      };

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert(payload)
        .select()
        .single();

      if (dbError) {
        // Rollback storage if DB fails
        await supabase.storage.from('tax-documents').remove([filePath]);
        throw new Error(`Gagal menyimpan data dokumen: ${dbError.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_list'] });
    },
  });
}

// Delete file from storage and remove metadata from DB
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: TaxDocument) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 400));
        demoState.deleteDemoDocument(doc.id);
        return doc.id;
      }

      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('tax-documents')
        .remove([doc.filePath]);

      if (storageError) {
        throw new Error(`Gagal menghapus file di storage: ${storageError.message}`);
      }

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw new Error(`Gagal menghapus data dokumen: ${dbError.message}`);

      return doc.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_list'] });
    },
  });
}

// Get Signed URL for private bucket
export async function getDocumentUrl(filePath: string): Promise<string> {
  const demoState = useDemoStore.getState();
  if (demoState.isDemoMode && filePath.startsWith('demo/')) {
    return '#'; // return dummy link in demo mode
  }

  const { data, error } = await supabase.storage
    .from('tax-documents')
    .createSignedUrl(filePath, 60 * 60); // 1 hour valid

  if (error) {
    console.error('Error getting signed url, falling back to public URL:', error);
    const { data: publicData } = supabase.storage.from('tax-documents').getPublicUrl(filePath);
    return publicData.publicUrl;
  }
  return data.signedUrl;
}

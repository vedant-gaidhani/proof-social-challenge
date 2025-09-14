import { supabase } from '@/lib/supabase'

export async function uploadProof(file: File, userId: string) {
  const path = `${userId}/${Date.now()}_${file.name}`
  const { data, error } = await supabase.storage.from('proof-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) return { error }
  const { data: publicUrl } = supabase.storage.from('proof-media').getPublicUrl(data.path)
  return { url: publicUrl.publicUrl, path: data.path, error: null }
}


import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://nindbkahmhbutpizbgpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbmRia2FobWhidXRwaXpiZ3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODExMTEsImV4cCI6MjA2Njk1NzExMX0.WcaK-r_cHb5rmImb4DDbYmOXi6uz05GJurBu1d21vsQ'
)

export async function obtenerPreguntas(cuestionarioID = 1) {
  const { data, error } = await supabase
    .from('preguntas')
    .select('*')
    .eq('cuestionario_id', cuestionarioID)
    .order('id', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener preguntas:', error)
    return []
  }

  return data
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Cambia a tu dominio en producción
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parsear JSON
    const { textoPDF } = await req.json();
    if (!textoPDF || textoPDF.length < 20) {
      throw new Error('El texto del PDF es demasiado corto o está vacío.');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error("La clave de API de Gemini no está configurada.");

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
      Basado en el siguiente texto académico, genera un máximo de 5 preguntas de opción múltiple (con 4 opciones) y 5 preguntas de verdadero/falso.
      Para cada pregunta, proporciona la respuesta correcta y un fundamento breve extraído directamente del texto.
      El formato de salida debe ser exclusivamente un objeto JSON válido con la siguiente estructura:
      {
        "preguntas": [
          {
            "texto_pregunta": "...",
            "opciones": ["...", "...", "...", "..."],
            "respuesta_correcta": "...",
            "fundamento": "..."
          }
        ]
      }
      TEXTO A ANALIZAR:
      ---
      ${textoPDF.substring(0, 15000)}
      ---
    `;

    // Llamada a la API de Gemini
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Error en la respuesta de Gemini: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Limpiar delimitadores ```json
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Validar que sea JSON válido
    let parsedJSON;
    try {
      parsedJSON = JSON.parse(cleanText);
    } catch {
      throw new Error('La IA respondió un JSON malformado o incompleto.');
    }

    return new Response(JSON.stringify(parsedJSON), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

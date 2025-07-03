// supabase/functions/generar-preguntas/index.ts

// Cabeceras CORS que tú mismo definiste. ¡Perfecto!
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Usamos '*' para desarrollo, luego podemos cambiarlo
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function handler(req: Request): Promise<Response> {
  // Manejo de la petición OPTIONS (pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { textoPDF } = await req.json();
    if (!textoPDF) throw new Error("No se proporcionó texto de PDF.");

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
    
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    
    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Error en la respuesta de Gemini: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates[0].content.parts[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(generatedText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

Deno.serve(handler);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Cabeceras para permitir que nuestra página web se comunique con esta función
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// El corazón de nuestra función
serve(async (req) => {
  // Manejo de la petición pre-vuelo (preflight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extraemos el texto del PDF que nos envía el frontend
    const { textoPDF } = await req.json()
    if (!textoPDF) {
      throw new Error("No se proporcionó texto de PDF.");
    }

    // 2. Obtenemos nuestra clave secreta de Gemini de forma segura
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error("La clave de API de Gemini no está configurada en los secrets.");
    }
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

    // 3. Creamos el "prompt": la instrucción detallada para la IA
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
    ` // Limito el texto a 15000 caracteres para no exceder los límites de la API

    // 4. Hacemos la llamada a la API de Gemini
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Error en la respuesta de la API de Gemini: ${errorBody}`)
    }

    const geminiData = await geminiResponse.json()
    // Limpiamos la respuesta de la IA para asegurarnos que sea un JSON válido
    const generatedText = geminiData.candidates[0].content.parts[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // 5. Devolvemos el JSON con las preguntas al frontend
    return new Response(generatedText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Si algo falla, devolvemos un mensaje de error claro
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
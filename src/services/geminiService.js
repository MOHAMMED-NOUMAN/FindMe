// ============================================================
// DisasterIQ — Client-side Gemini Auto-tagger
// Calls the Gemini REST API directly from the browser using
// a Google AI Studio key (VITE_GEMINI_API_KEY in .env).
// This is separate from the GCP project key so it uses the
// AI Studio free tier quota independently.
// ============================================================

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.0-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`

/**
 * Converts a File object to a base64-encoded inline data part for the Gemini API.
 */
function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve({ inlineData: { data: base64, mimeType: file.type || 'image/jpeg' } })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Extracts physical descriptor tags from a photo File object using Gemini 1.5 Flash.
 * Sends the image directly as base64 — no storage upload needed.
 *
 * @param {File} file - The photo file to analyse.
 * @returns {Promise<string[]>} - Array of tag strings, e.g. ["blue shirt", "short hair"]
 */
export async function extractTagsFromFile(file) {
  if (!GEMINI_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file from aistudio.google.com/apikey')
  }

  const imagePart = await fileToGenerativePart(file)

  const prompt = [
    'Analyze this photo of a person. Extract their physical descriptors ',
    '(e.g. clothing colour, hair colour/style, glasses, facial hair, approximate age range, distinguishing marks). ',
    'Return ONLY a valid JSON object like: {"physical_tags": ["blue shirt", "short black hair", "glasses", "~30s"]}. ',
    'No markdown, no explanation — pure JSON only.',
  ].join('')

  const body = {
    contents: [{ parts: [{ text: prompt }, imagePart] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim()
  }

  const parsed = JSON.parse(text)
  return Array.isArray(parsed.physical_tags) ? parsed.physical_tags : []
}

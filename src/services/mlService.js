// ============================================================
// DisasterIQ — ML Service Adapter
// Bridges the Firebase layer to the FastAPI matching engine.
// ============================================================

const ML_API_BASE =
  import.meta.env.VITE_ML_API_URL?.replace(/\/$/, '') || 'http://localhost:8080'

/**
 * Calls the FastAPI `/match/strings` endpoint to rank missing-person
 * candidates against a found-person document.
 *
 * @param {Object} missingPersonDoc  - The "found person" record (the newly
 *   submitted missing-person report, formatted as a PersonRecord).
 * @param {Object[]} candidatesList  - Array of PersonRecord objects from the
 *   `found_persons` Firestore collection to rank against.
 *
 * @returns {Promise<{found_person_id: string, matches: Array}>}
 *   The full StringMatchResponse from the API, with `matches` sorted by
 *   descending `composite_score`.
 *
 * @throws {Error} If the network request fails or the API returns a non-2xx
 *   status.  Callers should treat this as non-critical and degrade gracefully.
 */
export async function callMLMatchingAPI(missingPersonDoc, candidatesList) {
  const url = `${ML_API_BASE}/match/strings`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      found_person: missingPersonDoc,
      missing_persons: candidatesList,
    }),
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const err = await response.json()
      detail = err?.detail?.message || err?.detail || detail
    } catch {
      // ignore JSON parse errors on error bodies
    }
    throw new Error(`[ML API] ${response.status} — ${detail}`)
  }

  return response.json()
}

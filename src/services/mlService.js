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
 * @param {Object} foundPerson       - The "found person" PersonRecord.
 * @param {Object[]} candidatesList  - Array of missing PersonRecord objects to rank against.
 *
 * @returns {Promise<{found_person_id: string, matches: Array}>}
 *   The full StringMatchResponse from the API, with `matches` sorted by
 *   descending `composite_score`.
 *
 * @throws {Error} If the network request fails or the API returns a non-2xx status.
 */
export async function callMLMatchingAPI(foundPerson, candidatesList) {
  const url = `${ML_API_BASE}/match/strings`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      found_person: foundPerson,
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

/**
 * Calls the FastAPI `/match/faces` endpoint to compare two face images by URL.
 *
 * @param {string} imageUrl1 - Public URL of the first image.
 * @param {string} imageUrl2 - Public URL of the second image.
 *
 * @returns {Promise<{is_match: boolean, similarity_percentage: number, face_distance: number, backend: string}>}
 *
 * @throws {Error} If the network request fails or the API returns a non-2xx status.
 */
export async function callMLFaceMatchAPI(imageUrl1, imageUrl2) {
  const url = `${ML_API_BASE}/match/faces`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url_1: imageUrl1,
      image_url_2: imageUrl2,
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
    throw new Error(`[ML Face API] ${response.status} — ${detail}`)
  }

  return response.json()
}

/**
 * Calls the FastAPI `/health` endpoint for a liveness check.
 * @returns {Promise<{status: string}>}
 */
export async function checkMLHealth() {
  const url = `${ML_API_BASE}/health`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`[ML API] Health check failed: ${response.status}`)
  return response.json()
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

async function request(url) {
  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}

export async function searchTerm(term) {
  return request(
    `${API_BASE_URL}/search?term=${encodeURIComponent(term)}`
  );
}

export async function searchAnd(term1, term2) {
  return request(
    `${API_BASE_URL}/search/and?term1=${encodeURIComponent(term1)}&term2=${encodeURIComponent(term2)}`
  );
}

export async function searchOr(term1, term2) {
  return request(
    `${API_BASE_URL}/search/or?term1=${encodeURIComponent(term1)}&term2=${encodeURIComponent(term2)}`
  );
}

export async function searchPhrase(query) {
  return request(
    `${API_BASE_URL}/search/phrase?query=${encodeURIComponent(query)}`
  );
}

export async function searchNear(term1, term2, distance) {
  return request(
    `${API_BASE_URL}/search/near?term1=${encodeURIComponent(term1)}&term2=${encodeURIComponent(term2)}&distance=${encodeURIComponent(distance)}`
  );
}

export async function getStats() {
  return request(`${API_BASE_URL}/stats`);
}

export async function getDocument(docId) {
  return request(`${API_BASE_URL}/document/${docId}`);
}
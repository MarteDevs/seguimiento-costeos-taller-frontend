const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };
  if (body !== undefined && body !== null) {
    options.body = JSON.stringify(body);
  }
  const resp = await fetch(url, options);
  let json;
  try {
    json = await resp.json();
  } catch (e) {
    json = null;
  }
  if (!resp.ok) {
    const msg = (json && (json.message || json.error)) || `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return json ?? { ok: true };
}

export const http = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

export { BASE_URL };
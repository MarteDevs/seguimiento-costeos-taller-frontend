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
    let message;
    if (json) {
      if (typeof json.message === 'string') {
        message = json.message;
      } else if (json.error) {
        if (typeof json.error === 'string') {
          message = json.error;
        } else if (typeof json.error.message === 'string') {
          message = json.error.message;
        } else {
          try { message = JSON.stringify(json.error); } catch { message = '[error]'; }
        }
      }
    }
    if (!message) message = `HTTP ${resp.status}`;
    const err = new Error(message);
    err.status = resp.status;
    err.payload = json;
    throw err;
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
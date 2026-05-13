const BASE = '';

function getToken(platform = false) {
  if (platform) return sessionStorage.getItem('platformToken');
  return sessionStorage.getItem('token');
}

export async function api(path, opts = {}) {
  const { skipAuth, platform, ...fetchOpts } = opts;
  const headers = new Headers(fetchOpts.headers || {});
  if (!(fetchOpts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = platform ? getToken(true) : getToken(false);
  if (token && !skipAuth) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

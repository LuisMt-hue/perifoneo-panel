const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchConToken(endpoint, options = {}) {
  const token = sessionStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Tu sesión expiró');
  }

  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.mensaje || errorMessage;
    } catch (e) {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export const cliente = {
  get: (endpoint) => fetchConToken(endpoint, { method: 'GET' }),
  post: (endpoint, body) => fetchConToken(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => fetchConToken(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (endpoint, body) => fetchConToken(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  del: (endpoint) => fetchConToken(endpoint, { method: 'DELETE' }),
};

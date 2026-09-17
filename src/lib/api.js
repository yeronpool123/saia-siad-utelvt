const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const json = await parseResponse(response)

  if (!response.ok) {
    throw buildError(response, json)
  }

  return json
}

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function buildError(response, json) {
  const error = new Error(json?.message || 'Error del servidor')
  error.status = response.status
  error.errors = json?.errors
  error.response = { status: response.status, data: json, headers: response.headers }
  return error
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data) => request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  uploadFile: async (endpoint, formData) => {
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const json = await parseResponse(response)

    if (!response.ok) {
      throw buildError(response, json)
    }

    return json
  },
}

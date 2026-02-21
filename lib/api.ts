import type { Item, ItemStatus } from './types'

interface ApiError {
  error: string
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) {
    const error = data as ApiError
    throw new ApiRequestError(error.error || 'Request failed', response.status)
  }
  return data as T
}

export const api = {
  items: {
    async list(): Promise<Item[]> {
      // Fetch all items (high limit for now - full pagination UI can be added later)
      const response = await fetch('/api/items?limit=100')
      const data = await handleResponse<PaginatedResponse<Item>>(response)
      return data.items
    },

    async update(id: string, data: { status?: ItemStatus; title?: string }): Promise<Item> {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return handleResponse<Item>(response)
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      await handleResponse<{ success: boolean }>(response)
    },

    async ingest(data: { input: string }): Promise<{ item: Item }> {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return handleResponse<{ item: Item }>(response)
    },
  },
}

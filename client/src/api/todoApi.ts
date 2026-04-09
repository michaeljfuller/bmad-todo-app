import { mapApiError } from './mapApiError'

export type Todo = {
  id: number
  text: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      'VITE_API_BASE_URL is missing. Copy client/.env.example to client/.env.',
    )
  }
  return raw.replace(/\/+$/, '')
}

export async function fetchTodos(): Promise<Todo[]> {
  const base = resolveApiBaseUrl()
  const res = await fetch(`${base}/todos`, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  })

  if (!res.ok) {
    const userMessage = await mapApiError(res)
    throw new Error(userMessage)
  }

  const body: unknown = await res.json()
  if (!body || typeof body !== 'object' || !('todos' in body)) {
    throw new Error('The server returned an unexpected response.')
  }
  const { todos } = body as { todos: unknown }
  if (!Array.isArray(todos)) {
    throw new Error('The server returned an unexpected response.')
  }

  return todos as Todo[]
}

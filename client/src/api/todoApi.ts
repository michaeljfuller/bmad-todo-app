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

function isTodoShape(value: unknown): value is Todo {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'number' &&
    typeof o.text === 'string' &&
    typeof o.completed === 'boolean' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  )
}

export async function createTodo(input: { text: string }): Promise<Todo> {
  const base = resolveApiBaseUrl()
  const res = await fetch(`${base}/todos`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'omit',
    body: JSON.stringify({ text: input.text }),
  })

  if (!res.ok) {
    const userMessage = await mapApiError(res)
    throw new Error(userMessage)
  }

  const body: unknown = await res.json()
  if (!isTodoShape(body)) {
    throw new Error('The server returned an unexpected response.')
  }
  return body
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ todos: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('renders the app title', async () => {
    renderApp()
    expect(
      screen.getByRole('heading', { name: /todo app/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument()
  })
})

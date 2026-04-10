import { describe, expect, it } from 'vitest'
import { mapApiError } from './mapApiError'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('mapApiError', () => {
  it('returns generic copy for 5xx even when server sends internal-looking message', async () => {
    const msg = await mapApiError(
      jsonResponse(500, {
        error: { code: 'INTERNAL', message: 'at Database.query (db.js:1:1)' },
      }),
    )
    expect(msg).toBe('Something went wrong on our end. Please try again.')
  })

  it('maps known error codes on 4xx', async () => {
    expect(
      await mapApiError(
        jsonResponse(404, {
          error: { code: 'TODO_NOT_FOUND', message: 'missing' },
        }),
      ),
    ).toBe('That todo could not be found.')
  })

  it('uses safe server message for 4xx when short and not internal-looking', async () => {
    expect(
      await mapApiError(
        jsonResponse(400, {
          error: { code: 'OTHER', message: 'Title is required.' },
        }),
      ),
    ).toBe('Title is required.')
  })

  it('falls back when body is not JSON', async () => {
    const res = new Response('not json', { status: 502 })
    expect(await mapApiError(res)).toBe(
      'Something went wrong on our end. Please try again.',
    )
  })
})

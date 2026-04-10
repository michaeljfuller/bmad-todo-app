/** Maps API failures to safe, user-visible copy (no raw JSON or stack traces). */

const CODE_MESSAGES: Record<string, string> = {
  TODO_NOT_FOUND: 'That todo could not be found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
}

function looksInternalMessage(message: string): boolean {
  return (
    /^\s*at\s+/m.test(message) ||
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message) ||
    message.length > 200
  )
}

export async function mapApiError(response: Response): Promise<string> {
  const status = response.status
  let code: string | undefined
  let serverMessage: string | undefined

  try {
    const ct = response.headers.get('content-type')
    if (ct?.includes('application/json')) {
      const body: unknown = await response.json()
      if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        body.error &&
        typeof body.error === 'object'
      ) {
        const err = body.error as Record<string, unknown>
        if (typeof err.code === 'string') code = err.code
        if (typeof err.message === 'string') serverMessage = err.message
      }
    }
  } catch {
    // ignore parse errors — fall through to status-based copy
  }

  if (status >= 500) {
    return 'Something went wrong on our end. Please try again.'
  }

  if (code && CODE_MESSAGES[code]) {
    return CODE_MESSAGES[code]
  }

  if (
    serverMessage &&
    serverMessage.trim().length > 0 &&
    !looksInternalMessage(serverMessage)
  ) {
    return serverMessage
  }

  if (status === 404) {
    return 'That resource could not be found.'
  }

  if (status === 400) {
    return 'The request was not valid. Please try again.'
  }

  if (status === 401 || status === 403) {
    return 'You are not allowed to do that.'
  }

  return 'Something went wrong. Please try again.'
}

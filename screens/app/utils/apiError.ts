export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false
  const { code, message } = value as Record<string, unknown>
  return typeof code === 'string' && typeof message === 'string'
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  if (isApiErrorBody(body)) return new ApiError(response.status, body)
  return new ApiError(response.status, {
    code: 'unknown_error',
    message: response.statusText || `HTTP ${response.status}`,
  })
}

import type { AxiosRequestConfig, AxiosResponse, Method, ResponseType } from 'axios'
import { getApiClient } from '~/api/client'
import { getUserFriendlyError } from '~/composables/useApiErrorHandler'

export interface ApiRequestOptions<TData = unknown> {
  url: string
  method?: Method
  params?: Record<string, unknown>
  data?: TData
  headers?: Record<string, string>
  responseType?: ResponseType
  timeout?: number
  signal?: AbortSignal
  dedupe?: boolean
  dedupeKey?: string
  skipAuthHandling?: boolean
  required?: string[]
}

export interface ApiResponseEnvelope<T = Record<string, unknown>> {
  success: boolean
  message: string
  data: T
}

export interface ApiServiceResult<T = Record<string, unknown>> {
  success: boolean
  message: string
  data: T | null
  status: number
  raw: AxiosResponse<T>
}

const inflightRequests = new Map<string, Promise<ApiServiceResult<unknown>>>()

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, currentValue]) => `${key}:${stableStringify(currentValue)}`).join(',')}}`
}

function buildDedupeKey(options: ApiRequestOptions) {
  return options.dedupeKey || [
    options.method || 'GET',
    options.url,
    stableStringify(options.params),
    stableStringify(options.data)
  ].join('|')
}

function validateRequired(options: ApiRequestOptions) {
  if (!options.required?.length) return

  const payload = {
    ...(options.params || {}),
    ...(typeof options.data === 'object' && options.data !== null ? options.data as Record<string, unknown> : {})
  }

  const missing = options.required.filter((key) => {
    const value = payload[key]
    return value === undefined || value === null || value === ''
  })

  if (missing.length) {
    throw new Error(`Missing required field(s): ${missing.join(', ')}`)
  }
}

function normalizeResponse<T>(response: AxiosResponse<T>): ApiServiceResult<T> {
  const body = response.data as ApiResponseEnvelope<T> | T
  const envelope = body && typeof body === 'object' && 'success' in (body as object)
    ? body as ApiResponseEnvelope<T>
    : null

  return {
    success: envelope?.success ?? true,
    message: envelope?.message ?? '',
    data: envelope?.data ?? (response.data ?? null),
    status: response.status,
    raw: response
  }
}

export async function apiService<TResponse = Record<string, unknown>, TData = unknown>(
  options: ApiRequestOptions<TData>
): Promise<ApiServiceResult<TResponse>> {
  validateRequired(options)

  const request = async () => {
    try {
      const client = getApiClient()
      const response = await client.request<TResponse>({
        url: options.url,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        headers: options.headers,
        responseType: options.responseType,
        timeout: options.timeout,
        signal: options.signal
      } as AxiosRequestConfig<TData>)

      return normalizeResponse(response)
    } catch (error) {
      throw new Error(getUserFriendlyError(error, { action: `${(options.method || 'GET').toLowerCase()}-${options.url}` }))
    }
  }

  if (options.dedupe === false) {
    return await request()
  }

  const dedupeKey = buildDedupeKey(options)
  const existing = inflightRequests.get(dedupeKey)
  if (existing) {
    return await existing
  }

  const pending = request().finally(() => {
    inflightRequests.delete(dedupeKey)
  })

  inflightRequests.set(dedupeKey, pending)
  return await pending
}

export function clearApiRequestDedupe(dedupeKey?: string) {
  if (dedupeKey) {
    inflightRequests.delete(dedupeKey)
    return
  }

  inflightRequests.clear()
}

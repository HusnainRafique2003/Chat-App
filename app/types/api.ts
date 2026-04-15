import type { AxiosResponse } from 'axios'

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ApiResult<T> {
  data: T | null
  error: string | null
}

export type ApiResponse<T> = AxiosResponse<ApiEnvelope<T>>

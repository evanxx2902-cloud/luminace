// Auth API 服务层
// 对齐 api/proto/v1/user.proto 规范

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// ── Request Types ──

export interface RegisterRequest {
  username: string
  password: string
}

export interface LoginRequest {
  auth_type: 'password'
  username: string
  password: string
}

export interface RefreshRequest {
  refresh_token: string
}

// ── Response Types ──

export interface UserProfile {
  id: number
  username: string
  is_member: boolean
  member_level: number
  member_expire_at: number
  free_trial_count: number
  avatar?: string
  created_at: number
}

export interface RegisterResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  profile: UserProfile
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  profile: UserProfile
}

export interface RefreshResponse {
  access_token: string
  expires_in: number
}

export interface LogoutResponse {
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
}

// ── HTTP Client ──

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = data as ApiError
    throw new Error(err.message ?? `请求失败 (${res.status})`)
  }

  return data as T
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = data as ApiError
    throw new Error(err.message ?? `请求失败 (${res.status})`)
  }

  return data as T
}

// ── API Methods ──

export const authApi = {
  register: (req: RegisterRequest) =>
    post<RegisterResponse>('/auth/register', req),

  login: (username: string, password: string) =>
    post<LoginResponse>('/auth/login', {
      auth_type: 'password',
      username,
      password,
    } satisfies LoginRequest),

  refresh: (refreshToken: string) =>
    post<RefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    } satisfies RefreshRequest),

  logout: (_token: string) =>
    post<LogoutResponse>('/auth/logout', {}),

  getProfile: (token: string) =>
    get<UserProfile>('/user/profile', token),
}

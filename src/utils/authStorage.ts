import type { AuthSession, AuthUser } from './authTypes'

const USERS_KEY = 'mynotes_users'
const SESSION_KEY = 'mynotes_session'

const USERS_KEY_LEGACY = 'collabnotes_users'
const SESSION_KEY_LEGACY = 'collabnotes_session'

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadUsers(): AuthUser[] {
  const users = safeJsonParse<AuthUser[]>(localStorage.getItem(USERS_KEY))
  if (Array.isArray(users)) return users

  // 兼容旧 key，避免改名后用户无法登录
  const legacyUsers = safeJsonParse<AuthUser[]>(localStorage.getItem(USERS_KEY_LEGACY))
  if (Array.isArray(legacyUsers)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(legacyUsers))
    return legacyUsers
  }
  return []
}

export function saveUsers(users: AuthUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function loadSession(): AuthSession | null {
  const session = safeJsonParse<AuthSession>(localStorage.getItem(SESSION_KEY))
  if (session) return session

  // 兼容旧 key
  const legacy = safeJsonParse<AuthSession>(localStorage.getItem(SESSION_KEY_LEGACY))
  if (legacy) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(legacy))
    return legacy
  }
  return null
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  try { localStorage.removeItem(SESSION_KEY_LEGACY) } catch { /* ignore */ }
}

export function getCurrentUserFromStorage(): AuthUser | null {
  const session = loadSession()
  if (!session) return null
  const users = loadUsers()
  return users.find(u => u.id === session.userId) ?? null
}


import { create } from 'zustand'
import { uid } from '../utils/idGenerator'
import type { AuthSession, AuthUser } from '../utils/authTypes'
import { clearSession, getCurrentUserFromStorage, loadSession, loadUsers, saveSession, saveUsers } from '../utils/authStorage'
import { sha256Hex } from '../utils/passwordHash'

interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  error: string | null

  hydrate: () => void
  loginOrRegister: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getCurrentUserFromStorage(),
  session: loadSession(),
  loading: false,
  error: null,

  hydrate() {
    set({ user: getCurrentUserFromStorage(), session: loadSession(), error: null })
  },

  async loginOrRegister(username, password) {
    const uname = username.trim()
    if (!uname) {
      set({ error: '请输入用户名' })
      return false
    }
    if (!password) {
      set({ error: '请输入密码' })
      return false
    }

    set({ loading: true, error: null })
    try {
      const users = loadUsers()
      const existing = users.find(u => u.username === uname) ?? null
      const passwordHash = await sha256Hex(`${uname}:${password}`)

      let user: AuthUser
      if (!existing) {
        user = { id: uid(), username: uname, passwordHash, createdAt: Date.now() }
        saveUsers([user, ...users])
      } else {
        if (existing.passwordHash !== passwordHash) {
          set({ loading: false, error: '用户名或密码错误' })
          return false
        }
        user = existing
      }

      const session: AuthSession = { userId: user.id, username: user.username, loginAt: Date.now() }
      saveSession(session)
      set({ user, session, loading: false, error: null })
      return true
    } catch {
      set({ loading: false, error: '登录失败，请重试' })
      return false
    }
  },

  logout() {
    clearSession()
    set({ user: null, session: null, error: null, loading: false })
  },
}))


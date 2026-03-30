export interface AuthUser {
  id: string
  username: string
  passwordHash: string
  createdAt: number
}

export interface AuthSession {
  userId: string
  username: string
  loginAt: number
}


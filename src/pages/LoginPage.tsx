import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const loginOrRegister = useAuthStore(s => s.loginOrRegister)
  const loading = useAuthStore(s => s.loading)
  const error = useAuthStore(s => s.error)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const subText = useMemo(() => {
    return '首次输入新用户名会自动创建账号'
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await loginOrRegister(username, password)
    if (ok) navigate('/', { replace: true })
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">✦</div>
          <div>
            <div className="auth-title">MyNotes</div>
            <div className="auth-subtitle">{subText}</div>
          </div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-label">
            用户名
            <input
              className="auth-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="例如：alice"
              autoComplete="username"
              spellCheck={false}
            />
          </label>

          <label className="auth-label">
            密码
            <input
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}


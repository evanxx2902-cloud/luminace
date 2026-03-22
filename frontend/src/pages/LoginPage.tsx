import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import ClayInput from '../components/ClayInput'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { access_token, refresh_token, profile } = await authApi.login(username, password)
      login(access_token, refresh_token, profile)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4">
      {/* 背景装饰圆圈 */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cta/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* 卡片 */}
        <div
          className="bg-white rounded-clay border-[3px] border-primary p-8 sm:p-10"
          style={{ boxShadow: 'var(--shadow-clay)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-clay border-[3px] border-primary bg-primary/10 flex items-center justify-center"
              style={{ boxShadow: '3px 3px 0px 0px rgba(37,99,235,0.20)' }}
            >
              <BookOpen size={22} className="text-primary" strokeWidth={2.5} />
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary">Luminance</h1>
          </div>

          <h2 className="font-heading text-xl font-bold text-text text-center mb-1">
            欢迎回来！
          </h2>
          <p className="font-body text-sm text-slate-500 text-center mb-7">
            登录你的学习账号继续探索
          </p>

          {/* 全局错误提示 */}
          {error && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-clay border-[2px] border-[#EF4444] bg-red-50 font-body text-sm text-[#DC2626]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <ClayInput
              label="用户名"
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="你的用户名"
              autoComplete="username"
              required
            />

            <ClayInput
              label="密码"
              id="password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入你的密码"
              autoComplete="current-password"
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? '隐藏密码' : '显示密码'}
                  className="text-slate-400 hover:text-primary transition-colors duration-150 cursor-pointer p-1"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className={[
                'mt-2 w-full py-3.5 rounded-clay border-[3px] border-cta',
                'font-heading font-bold text-white text-base',
                'bg-cta hover:bg-[#ea6c10] active:translate-y-0.5',
                'transition-all duration-[250ms] ease-[var(--ease-clay-out)]',
                'cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
              ].join(' ')}
              style={{ boxShadow: loading ? 'none' : 'var(--shadow-clay-cta)' }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          <p className="font-body text-sm text-slate-500 text-center mt-6">
            还没有账号？{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Loader2, CheckCircle2 } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import ClayInput from '../components/ClayInput'

interface FieldErrors {
  username?: string
  password?: string
  confirmPassword?: string
}

function validateForm(
  username: string,
  password: string,
  confirmPassword: string,
): FieldErrors {
  const errors: FieldErrors = {}

  if (!username.trim()) {
    errors.username = '请输入用户名'
  } else if (username.trim().length < 2) {
    errors.username = '用户名至少需要 2 个字符'
  } else if (username.trim().length > 32) {
    errors.username = '用户名最多 32 个字符'
  } else if (!/^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/.test(username.trim())) {
    errors.username = '用户名只能包含字母、数字、中文、下划线或连字符'
  }

  if (!password) {
    errors.password = '请输入密码'
  } else if (password.length < 8) {
    errors.password = '密码至少需要 8 位'
  } else if (password.length > 128) {
    errors.password = '密码最多 128 位'
  }

  if (!confirmPassword) {
    errors.confirmPassword = '请确认密码'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
  }

  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername]               = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd]                 = useState(false)
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [globalError, setGlobalError]         = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]         = useState<FieldErrors>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGlobalError(null)

    const errors = validateForm(username, password, confirmPassword)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // 聚焦到第一个有错误的字段
      const firstErrorKey = Object.keys(errors)[0] as keyof FieldErrors
      document.getElementById(firstErrorKey)?.focus()
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      const { access_token, refresh_token, profile } = await authApi.register({
        username: username.trim(),
        password,
      })
      login(access_token, refresh_token, profile)
      navigate('/')
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const pwdStrength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : password.length < 12 ? 2
    : 3

  const strengthLabels = ['', '较弱', '中等', '较强']
  const strengthColors = ['', '#EF4444', '#F97316', '#22C55E']

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      {/* 背景装饰 */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cta/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
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
            创建你的账号
          </h2>
          <p className="font-body text-sm text-slate-500 text-center mb-7">
            加入 Luminance，开启智慧学习之旅
          </p>

          {/* 全局错误 */}
          {globalError && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-clay border-[2px] border-[#EF4444] bg-red-50 font-body text-sm text-[#DC2626]"
            >
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <ClayInput
              label="用户名"
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="设置一个用户名"
              autoComplete="username"
              required
              error={fieldErrors.username}
            />

            <div className="flex flex-col gap-1">
              <ClayInput
                label="密码"
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 8 位"
                autoComplete="new-password"
                required
                error={fieldErrors.password}
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

              {/* 密码强度指示 */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= pwdStrength
                            ? strengthColors[pwdStrength]
                            : '#E2E8F0',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="font-body text-xs font-semibold"
                    style={{ color: strengthColors[pwdStrength] }}
                  >
                    {strengthLabels[pwdStrength]}
                  </span>
                </div>
              )}
            </div>

            <ClayInput
              label="确认密码"
              id="confirmPassword"
              type={showConfirmPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              autoComplete="new-password"
              required
              error={fieldErrors.confirmPassword}
              suffix={
                confirmPassword && !fieldErrors.confirmPassword && password === confirmPassword
                  ? (
                    <CheckCircle2 size={18} className="text-[#22C55E]" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(v => !v)}
                      aria-label={showConfirmPwd ? '隐藏密码' : '显示密码'}
                      className="text-slate-400 hover:text-primary transition-colors duration-150 cursor-pointer p-1"
                    >
                      {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )
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
              {loading ? '注册中…' : '立即注册'}
            </button>
          </form>

          <p className="font-body text-sm text-slate-500 text-center mt-6">
            已有账号？{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

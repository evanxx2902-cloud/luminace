import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function HomePage() {
  const { user, logout } = useAuth()
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div
        className="bg-white rounded-clay border-[3px] border-primary p-10 max-w-md w-full text-center"
        style={{ boxShadow: 'var(--shadow-clay)' }}
      >
        <h1 className="font-heading text-4xl font-bold text-primary mb-3">Luminance</h1>
        <p className="font-body text-text text-lg mb-1">
          你好，{user?.username ?? '同学'} 👋
        </p>
        <p className="font-body text-secondary text-sm mb-6">教育平台已就绪</p>
        <button
          onClick={logout}
          className="px-6 py-2.5 rounded-clay border-[3px] border-primary font-heading font-semibold text-primary
            hover:bg-primary/5 active:translate-y-0.5 transition-all duration-[250ms] cursor-pointer"
          style={{ boxShadow: 'var(--shadow-clay)' }}
        >
          退出登录
        </button>
      </div>
    </main>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

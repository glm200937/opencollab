import { Routes, Route, Navigate } from 'react-router-dom'

// Pages (à créer module par module)
const LoginPage    = () => <div className="flex h-screen items-center justify-center text-2xl font-semibold">🔐 Login — coming soon</div>
const DashboardPage = () => <div className="flex h-screen items-center justify-center text-2xl font-semibold">🏠 Dashboard — coming soon</div>

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

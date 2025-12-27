import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'

const AppLayout = () => {
  const { logout } = useAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-motion-lavender text-motion-plum">
      <NavBar onSignOut={logout} />
      <main className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout

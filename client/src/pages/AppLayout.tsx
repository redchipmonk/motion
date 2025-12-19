import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'

const AppLayout = () => (
  <div className="flex h-screen flex-col overflow-hidden bg-motion-lavender text-motion-plum">
    <NavBar />
    <main className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </main>
  </div>
)

export default AppLayout

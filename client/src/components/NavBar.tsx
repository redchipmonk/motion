import { NavLink } from 'react-router-dom'
import { motionTheme, cn } from '../theme'

const NAV_LINKS = [
  { label: 'All Events', path: '/events' },
  { label: 'My Events', path: '/my-events' },
  { label: 'Profile', path: '/profile' },
]

type NavBarProps = {
  onSignOut?: () => void
}

const NavBar = ({ onSignOut }: NavBarProps = {}) => (
  <header className={cn(motionTheme.nav.background, 'text-white shadow-sm')}>
    <div className="flex w-full items-center justify-between gap-12 px-16 py-4">
      {/* Logo + Search */}
      <div className="flex flex-1 items-center gap-12 pr-12">
        <NavLink to="/events" className="flex items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-motion-plum text-2xl font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
            M
          </span>
        </NavLink>
        <label htmlFor="motion-search" className="group relative flex-1 max-w-lg">
          <span className={cn('pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-black/50 transition', motionTheme.states.navIconFocus)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
          </span>
          <input
            id="motion-search"
            type="search"
            placeholder="Search for users/events/etc..."
            aria-label="Search for users, events, etc"
            className={cn(
              'peer h-[38px] w-full border border-transparent bg-white pl-12 pr-4 text-black placeholder-black/50 outline-none transition focus:placeholder-transparent',
              motionTheme.radii.button,
              motionTheme.typography.authInputSizeClass,
              'shadow-[0_4px_4px_rgba(0,0,0,0.15)]',
              motionTheme.shadows.navFocusRing,
            )}
          />
        </label>
      </div>
      {/* Nav Links + Sign out */}
      <div className="flex items-center gap-12">
        <nav aria-label="Primary" className="flex items-center gap-12">
          {NAV_LINKS.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  motionTheme.typography.sizes.tag,
                  'cursor-pointer select-none',
                  motionTheme.nav.link,
                  isActive ? 'font-black' : 'font-semibold',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => onSignOut?.()}
          className={cn(
            'min-w-[140px] px-7 py-2 text-base font-bold transition',
            motionTheme.radii.button,
            motionTheme.nav.signOutBg,
            motionTheme.text.accent,
            'shadow-[0_4px_4px_rgba(0,0,0,0.15)]',
            motionTheme.states.navSignOutActiveBg,
            motionTheme.states.navSignOutActiveText,
          )}
        >
          Sign Out
        </button>
      </div>
    </div>
  </header>
)

export default NavBar

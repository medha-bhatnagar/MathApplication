import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { loadData } from '../services/storage'

export function PageLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  function navigateSafely(event: React.MouseEvent<HTMLAnchorElement>, to: string) {
    const active = loadData().activeSession
    if (
      active?.status === 'active' &&
      location.pathname === '/practice/session' &&
      to !== location.pathname
    ) {
      if (
        !window.confirm(
          'Leave your practice session? Your progress is saved and you can return later.',
        )
      ) {
        event.preventDefault()
      }
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" onClick={(event) => navigateSafely(event, '/')}>
          Math Practice
        </NavLink>
        <nav aria-label="Main navigation">
          <NavLink
            to="/practice/setup"
            onClick={(event) => navigateSafely(event, '/practice/setup')}
          >
            Practice
          </NavLink>
          <NavLink to="/statistics" onClick={(event) => navigateSafely(event, '/statistics')}>
            Statistics
          </NavLink>
          <NavLink to="/settings" onClick={(event) => navigateSafely(event, '/settings')}>
            Settings
          </NavLink>
          {loadData().activeSession?.status === 'active' &&
            location.pathname !== '/practice/session' && (
              <button className="nav-resume" onClick={() => navigate('/practice/session')}>
                Resume
              </button>
            )}
        </nav>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
      <footer className="site-footer">Your practice stays on this device.</footer>
    </div>
  )
}

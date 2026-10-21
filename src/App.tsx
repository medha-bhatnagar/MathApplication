import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PageLayout } from './components/PageLayout'
import { HomePage } from './pages/HomePage'
import { SessionPage } from './pages/SessionPage'
import { SetupPage } from './pages/SetupPage'
import { SummaryPage } from './pages/SummaryPage'

const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((page) => ({ default: page.SettingsPage })),
)
const StatisticsPage = lazy(() =>
  import('./pages/StatisticsPage').then((page) => ({ default: page.StatisticsPage })),
)

function LoadingPage() {
  return (
    <p className="content-card" role="status">
      Loading…
    </p>
  )
}

function NotFoundPage() {
  return (
    <section className="content-card empty-state">
      <p className="eyebrow">Page not found</p>
      <h1>Let’s get you back on track</h1>
      <p>That page isn’t here, but your math practice is.</p>
      <a className="button button-primary" href="/">
        Return home
      </a>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageLayout />}>
          <Route index element={<HomePage />} />
          <Route path="practice/setup" element={<SetupPage />} />
          <Route path="practice/session" element={<SessionPage />} />
          <Route path="practice/summary" element={<SummaryPage />} />
          <Route
            path="statistics"
            element={
              <Suspense fallback={<LoadingPage />}>
                <StatisticsPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<LoadingPage />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

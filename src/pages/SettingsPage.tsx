import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DifficultySelector,
  OperationSelector,
  SessionLengthSelector,
} from '../components/Selectors'
import { clearAllData, loadData, saveSettings } from '../services/storage'
import { DEFAULT_APPLICATION_SETTINGS, type ApplicationSettings } from '../types/settings'

export function SettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<ApplicationSettings>(() => loadData().settings)
  const [message, setMessage] = useState('')

  function clearData() {
    if (
      window.confirm(
        'Delete all practice history, settings, and saved sessions from this device? This cannot be undone.',
      )
    ) {
      clearAllData()
      setSettings(DEFAULT_APPLICATION_SETTINGS)
      navigate('/')
    }
  }

  return (
    <section className="content-card settings-page">
      <div className="page-heading">
        <p className="eyebrow">Make it feel right</p>
        <h1>Settings</h1>
        <p>Choose the defaults for your next practice session.</p>
      </div>
      <OperationSelector
        value={settings.defaultOperations}
        onChange={(defaultOperations) => setSettings({ ...settings, defaultOperations })}
      />
      <DifficultySelector
        value={settings.defaultDifficulty}
        onChange={(defaultDifficulty) => setSettings({ ...settings, defaultDifficulty })}
      />
      <SessionLengthSelector
        value={settings.defaultSessionLength}
        onChange={(defaultSessionLength) => setSettings({ ...settings, defaultSessionLength })}
      />
      <div className="settings-toggles">
        <label className="toggle-row">
          <span>
            <strong>Mistake mastery goal</strong>
            <small>Correct similar questions this many times to master a pattern.</small>
          </span>
          <select
            value={settings.masteryThreshold}
            onChange={(event) =>
              setSettings({ ...settings, masteryThreshold: Number(event.target.value) })
            }
          >
            {[2, 3, 4, 5].map((threshold) => (
              <option key={threshold} value={threshold}>
                {threshold} correct answers
              </option>
            ))}
          </select>
        </label>
        <label className="toggle-row">
          <span>
            <strong>Sound effects</strong>
            <small>Play a gentle tone after each answer.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.soundEffectsEnabled}
            onChange={(event) =>
              setSettings({ ...settings, soundEffectsEnabled: event.target.checked })
            }
          />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Answer explanations</strong>
            <small>Show a short explanation when you reveal an answer.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.explanationsEnabled}
            onChange={(event) =>
              setSettings({ ...settings, explanationsEnabled: event.target.checked })
            }
          />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Card-flip animation</strong>
            <small>Use a gentle flip when revealing answers.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.animationsEnabled}
            onChange={(event) =>
              setSettings({ ...settings, animationsEnabled: event.target.checked })
            }
          />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Encouraging feedback</strong>
            <small>Show a short supportive message after each answer.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.feedbackEnabled}
            onChange={(event) =>
              setSettings({ ...settings, feedbackEnabled: event.target.checked })
            }
          />
        </label>
      </div>
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      <div className="form-actions">
        <button
          className="button button-primary"
          onClick={() => {
            const saved = saveSettings(settings)
            setMessage(
              saved ? 'Settings saved.' : 'Your browser cannot save these settings right now.',
            )
          }}
        >
          Save Settings
        </button>
        <Link className="text-button" to="/">
          Back home
        </Link>
      </div>
      <div className="privacy-note">
        <h2>Your data stays on this device</h2>
        <p>
          Practice history is stored in this browser. Clearing browser data will also remove your
          progress.
        </p>
      </div>
      <button className="text-button destructive-link" onClick={clearData}>
        Clear all app data
      </button>
    </section>
  )
}

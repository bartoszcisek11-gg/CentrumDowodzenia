import React, { useState } from 'react';
import './LoginModal.css';
import { importDatabase, restoreFromPayload } from '../utils/storage';
import { getSavedClientId, requestDriveToken, downloadFromDrive, getAccessToken } from '../utils/googleDriveSync';

export default function LoginModal({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  const storedPassword = localStorage.getItem('app_user_password');
  const isDriveConnected = Boolean(getAccessToken());

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPass = storedPassword || '123';

    if (password === correctPass) {
      sessionStorage.setItem('app_authenticated', 'true');
      sessionStorage.setItem('app_pin', password);
      onLogin();
    } else {
      setError('Niepoprawne hasło!');
    }
  };

  const handleDriveDownload = async () => {
    let clientId = getSavedClientId();
    if (!clientId) {
      clientId = window.prompt(
        'Podaj swój Google OAuth Client ID (wygenerowany w Google Cloud Console dla Twojej domeny):',
        ''
      );
      if (!clientId) return;
      setSavedClientId(clientId);
    }

    setError('');
    setIsLoadingDrive(true);

    try {
      const token = await requestDriveToken(clientId.trim());
      const driveData = await downloadFromDrive(token);
      const result = await restoreFromPayload(driveData, password);

      if (result && result.success) {
        sessionStorage.setItem('app_authenticated', 'true');
        if (result.usedPin) {
          sessionStorage.setItem('app_pin', result.usedPin);
        }
        onLogin();
      } else {
        setError('Nie udało się odblokować bazy danych.');
      }
    } catch (err) {
      console.error(err);
      setError(`Błąd Google Drive: ${err.message}`);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importDatabase(
      file,
      (unlockedPin) => {
        sessionStorage.setItem('app_authenticated', 'true');
        if (unlockedPin) {
          sessionStorage.setItem('app_pin', unlockedPin);
        }
        window.location.reload();
      },
      password
    );
  };

  // Generowanie kresek dla obrotowego pierścienia SVG
  const totalBars = 60;
  const radius = 190;
  const correctPass = storedPassword || '123';
  const targetLength = Math.max(correctPass.length, 1);
  const activeCount = Math.min(Math.round((password.length / targetLength) * totalBars), totalBars);

  const bars = Array.from({ length: totalBars }).map((_, i) => {
    const angle = (i * 360) / totalBars;
    const rad = (angle * Math.PI) / 180;
    
    // Punkt początkowy i końcowy kreski
    const x1 = 220 + (radius - 16) * Math.cos(rad);
    const y1 = 220 + (radius - 16) * Math.sin(rad);
    const x2 = 220 + radius * Math.cos(rad);
    const y2 = 220 + radius * Math.sin(rad);

    const isActive = i < activeCount;

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth="4"
        strokeLinecap="round"
        className={`ring-bar ${isActive ? 'active' : 'inactive'}`}
      />
    );
  });

  return (
    <div className="login-overlay">
      <div className="login-dial-wrapper">
        {/* Dynamiczny pierścień w tle */}
        <svg className="login-svg-ring" viewBox="0 0 440 440">
          {bars}
        </svg>

        {/* Panel wewnętrzny */}
        <div className="login-card">
          <h2 className="login-title">Centrum Dowodzenia</h2>

          {!storedPassword ? (
            /* WARIANT 1: Nowe urządzenie (brak zarejestrowanego hasła/bazy) */
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <p style={{ color: '#8b949e', fontSize: '0.8rem', margin: '0 0 4px 0', lineHeight: '1.3' }}>
                Zaloguj się kontem Google, aby automatycznie pobrać Twoją bazę z Dysku.
              </p>

              {error && <div className="login-error">{error}</div>}

              {/* Główny turkusowy przycisk Zaloguj z Google Drive */}
              <button
                type="button"
                onClick={handleDriveDownload}
                disabled={isLoadingDrive}
                className="login-btn"
                style={{ margin: '4px 0 0 0' }}
              >
                {isLoadingDrive ? '⏳ Łączenie z Google...' : '☁️ Zaloguj z Google Drive'}
              </button>

              {/* Mniejszy, dyskretny przycisk Wgraj plik JSON */}
              <label
                className="login-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '4px',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#8b949e',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00f2ff';
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8b949e';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                📂 Wgraj plik JSON
                <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            /* WARIANT 2: Urządzenie z zapisanym hasłem/bazą */
            <form onSubmit={handlePasswordSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <input
                type="password"
                className="login-input"
                placeholder="Hasło / PIN"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
              />

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-btn">
                🔑 Zaloguj
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {!isDriveConnected && (
                  <button
                    type="button"
                    onClick={handleDriveDownload}
                    disabled={isLoadingDrive}
                    className="login-link"
                    style={{
                      background: 'rgba(0, 242, 255, 0.08)',
                      border: '1px solid rgba(0, 242, 255, 0.25)',
                      padding: '6px 12px',
                      borderRadius: '14px',
                      color: '#00f2ff',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.78rem'
                    }}
                  >
                    {isLoadingDrive ? '⏳ Pobieranie z Dysku...' : '☁️ Synchronizuj z Google Drive'}
                  </button>
                )}

                <label
                  className="login-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#8b949e',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  📂 Wgraj plik JSON
                  <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
                </label>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
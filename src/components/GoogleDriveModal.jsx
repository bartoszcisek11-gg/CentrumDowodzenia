import React, { useState, useEffect } from 'react';
import {
  getSavedClientId,
  setSavedClientId,
  getAccessToken,
  requestDriveToken,
  disconnectDrive,
  uploadToDrive,
  downloadFromDrive
} from '../utils/googleDriveSync';
import { createBackupPayload, restoreFromPayload } from '../utils/storage';

export default function GoogleDriveModal({ isOpen, onClose, onDataRestored }) {
  const [clientId, setClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lastSync, setLastSync] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedId = getSavedClientId();
      setClientId(savedId);

      const token = getAccessToken();
      setIsConnected(!!token);

      const email = localStorage.getItem('gdrive_user_email') || '';
      setUserEmail(email);

      const lsTime = localStorage.getItem('gdrive_last_sync');
      if (lsTime) {
        setLastSync(new Date(lsTime).toLocaleString('pl-PL'));
      }

      setAutoSync(localStorage.getItem('gdrive_auto_sync') === 'true');

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveClientId = () => {
    setSavedClientId(clientId);
    setStatusMsg('✅ Zapisano Google Client ID.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleConnect = async () => {
    if (!clientId.trim()) {
      alert('Proszę podać prawidłowy Google OAuth Client ID.');
      return;
    }
    setSavedClientId(clientId);
    setIsLoading(true);
    setStatusMsg('Łączenie z usługą Google...');

    try {
      const token = await requestDriveToken(clientId.trim());
      setIsConnected(true);
      const email = localStorage.getItem('gdrive_user_email') || '';
      setUserEmail(email);
      setStatusMsg('🟢 Pomyślnie połączono z Dyskiem Google!');
    } catch (err) {
      console.error(err);
      setStatusMsg(`❌ Błąd połączenia: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive();
    setIsConnected(false);
    setUserEmail('');
    setStatusMsg('🔌 Rozłączono z Dyskiem Google.');
  };

  const handleUpload = async () => {
    setIsLoading(true);
    setStatusMsg('Przygotowywanie zaszyfrowanej kopii "centrumdowodzenia.json"...');

    try {
      let token = getAccessToken();
      if (!token) {
        token = await requestDriveToken(clientId.trim());
        setIsConnected(true);
      }

      const payload = await createBackupPayload();
      await uploadToDrive(token, payload);

      const nowStr = new Date().toLocaleString('pl-PL');
      setLastSync(nowStr);
      setStatusMsg('✅ Pomyślnie zapisano plik "centrumdowodzenia.json" na Twoim Dysku Google!');
    } catch (err) {
      console.error(err);
      setStatusMsg(`❌ Błąd zapisu na Dysk: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!window.confirm('Czy na pewno chcesz pobrać plik "centrumdowodzenia.json" z Dysku Google i nadpisać dane lokalne?')) {
      return;
    }

    setIsLoading(true);
    setStatusMsg('Pobieranie pliku "centrumdowodzenia.json" z Dysku Google...');

    try {
      let token = getAccessToken();
      if (!token) {
        token = await requestDriveToken(clientId.trim());
        setIsConnected(true);
      }

      const driveData = await downloadFromDrive(token);
      const result = await restoreFromPayload(driveData);

      if (result && result.success) {
        const nowStr = new Date().toLocaleString('pl-PL');
        setLastSync(nowStr);
        setStatusMsg('✅ Dane zostały pobrane i zaktualizowane!');
        if (onDataRestored) {
          onDataRestored();
        }
      } else {
        setStatusMsg('Anulowano lub błąd przy odszyfrowywaniu danych.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg(`❌ Błąd pobierania z Dysku: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoSync = (e) => {
    const checked = e.target.checked;
    setAutoSync(checked);
    localStorage.setItem('gdrive_auto_sync', checked ? 'true' : 'false');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '550px',
        width: '100%',
        color: '#c9d1d9',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* NAGŁÓWEK */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ☁️ Synchronizacja z Google Drive
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* STATUSEK POŁĄCZENIA */}
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: isConnected ? '#0d2d18' : '#21262d',
          border: isConnected ? '1px solid #238636' : '1px solid #363b42',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 'bold', color: isConnected ? '#3fb950' : '#8b949e' }}>
              {isConnected ? '🟢 Połączono z Google Drive' : '⚪ Brak aktywnego połączenia'}
            </div>
            {userEmail && <div style={{ fontSize: '0.85rem', color: '#8b949e' }}>{userEmail}</div>}
            {lastSync && <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '4px' }}>Ostatnia synchro: {lastSync}</div>}
          </div>

          {isConnected ? (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                backgroundColor: '#21262d',
                color: '#f85149',
                border: '1px solid #f85149',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Rozłącz
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: '#238636',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔑 Zaloguj
            </button>
          )}
        </div>

        {/* KOMUNIKATY STATUSU */}
        {statusMsg && (
          <div style={{
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: '#1f242c',
            border: '1px solid #38414e',
            fontSize: '0.85rem',
            color: '#e6edf3'
          }}>
            {statusMsg}
          </div>
        )}

        {/* AKCJE SYNCHRONIZACJI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#e6edf3' }}>
            Operacje na pliku <code style={{ backgroundColor: '#21262d', padding: '2px 6px', borderRadius: '4px', color: '#79c0ff' }}>centrumdowodzenia.json</code>:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              style={{
                padding: '12px',
                backgroundColor: '#1f6beb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>💾 Zapisz na Dysk Google</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal' }}>Wysyła aktualne dane</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isLoading}
              style={{
                padding: '12px',
                backgroundColor: '#238636',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>📥 Pobierz z Dysku Google</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal' }}>Wczytuje najnowszą wersję</span>
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.85rem', cursor: 'pointer', color: '#8b949e' }}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={handleToggleAutoSync}
            />
            Automatycznie wysyłaj dane na Dysk Google po imporcie pliku JSON
          </label>
        </div>

        {/* MONTAŻ CLIENT ID */}
        <div style={{ borderTop: '1px solid #30363d', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Google OAuth Client ID:</label>
            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{ background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {showHelp ? 'Ukryj instrukcję' : 'Jak uzyskać Client ID?'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="np. 123456789-abc...apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '0.8rem'
              }}
            />
            <button
              onClick={handleSaveClientId}
              style={{
                padding: '8px 12px',
                backgroundColor: '#21262d',
                color: '#c9d1d9',
                border: '1px solid #363b42',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Zapisz
            </button>
          </div>

          {showHelp && (
            <div style={{
              marginTop: '6px',
              padding: '12px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              fontSize: '0.78rem',
              lineHeight: '1.4',
              color: '#8b949e'
            }}>
              <strong style={{ color: '#58a6ff' }}>📌 Jak skonfigurować własny Google OAuth Client ID dla GitHub Pages:</strong>
              <ol style={{ paddingLeft: '18px', margin: '6px 0 0 0' }}>
                <li>Wejdź na <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#58a6ff' }}>Google Cloud Console</a>.</li>
                <li>Utwórz projekt i włącz <strong>Google Drive API</strong>.</li>
                <li>W zakładce <strong>Credentials / Dane dostępowe</strong> utwórz <em>OAuth 2.0 Client ID (Aplikacja internetowa / Web application)</em>.</li>
                <li>Dodaj adres swojej strony (np. <code>https://bartoszcisek11.github.io</code>) w polu <strong>Autoryzowane źródła JavaScript (Authorized JavaScript Origins)</strong>.</li>
                <li>Skopiuj wygenerowany ID (kończący się na <code>.apps.googleusercontent.com</code>) i wklej go powyżej. Twój klucz jest bezpieczny – identyfikator Client ID służy tylko do identyfikacji domeny.</li>
              </ol>
            </div>
          )}
        </div>

        {/* STOPKA MODALA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #363b42',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}

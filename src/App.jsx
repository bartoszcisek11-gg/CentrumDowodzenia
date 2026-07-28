import './App.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoginModal from './components/LoginModal';
import MainDashboard from './components/MainDashboard';
import ClearDataButton from './components/ClearDataButton';
import GoogleDriveModal from './components/GoogleDriveModal';

// Moduły
import OrtoBazaView from './modules/OrtoBaza/OrtoBazaView';
import StazView from './modules/StazCalculator/StazView';
import FinancesView from './modules/Finances/FinancesView';
import WorkView from './modules/WorkWorksheets/WorkView';

import { exportDatabase, importDatabase, createBackupPayload } from './utils/storage';
import { getAccessToken, uploadToDrive } from './utils/googleDriveSync';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('app_authenticated') === 'true';
  });

  const [currentApp, setCurrentApp] = useState(null);
  const [currentAppTitle, setCurrentAppTitle] = useState('');
  
  // Stan podświetlenia dla przycisku Wyloguj
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  // Stan modala Google Drive
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(() => !!getAccessToken());

  // Odświeżanie stanu połączenia Google Drive przy otwarciu
  useEffect(() => {
    setIsDriveConnected(!!getAccessToken());
  }, [isDriveModalOpen]);

  // Rejestracja dedykowanej obsługi powrotu z aktywnego modułu
  const backHandlerRef = useRef(null);

  const registerBackHandler = useCallback((handler) => {
    backHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    backHandlerRef.current = null;
  }, [currentApp]);

  const handleGoHome = () => {
    setCurrentApp(null);
    setCurrentAppTitle('');
  };

  const handleGoBack = () => {
    if (backHandlerRef.current) {
      const handled = backHandlerRef.current();
      if (handled) return;
    }
    handleGoHome();
  };

  // Globalna obsługa klawisza Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (currentApp !== null) {
          handleGoBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentApp]);

  if (!isAuthenticated) {
    return <LoginModal onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleOpenApp = (id, title, url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (id === 'app-5') {
      window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
      return;
    }
    if (id === 'app-6') {
      window.open('https://gmail.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    setCurrentApp(id);
    setCurrentAppTitle(title);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('app_authenticated');
    sessionStorage.removeItem('app_pin');
    setIsAuthenticated(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importDatabase(file, async () => {
      // Jeśli użytkownik jest połączony z Google Drive, zaktualizuj plik centrumdowodzenia.json na dysku
      const token = getAccessToken();
      if (token) {
        try {
          const payload = await createBackupPayload();
          await uploadToDrive(token, payload);
          console.log('Automatycznie zaktualizowano zbiór na Google Drive po imporcie JSON');
        } catch (err) {
          console.error('Błąd auto-synchronizacji z Google Drive:', err);
        }
      }
      window.location.reload();
    });
  };

  const renderAppContent = () => {
    switch (currentApp) {
      case 'app-1':
        return <OrtoBazaView onRegisterBack={registerBackHandler} />;
      case 'app-2':
        return <StazView onRegisterBack={registerBackHandler} />;
      case 'app-3':
        return <FinancesView onRegisterBack={registerBackHandler} />;
      case 'app-4':
        return <WorkView onRegisterBack={registerBackHandler} />;
      default:
        return <MainDashboard onOpenApp={handleOpenApp} />;
    }
  };

  return (
    <div className="app-root">
      <header className="app-header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* LEWA STRONA NAGŁÓWKA (Przycisk Powrót oraz Przyciski Import/Eksport) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2, minHeight: '38px' }}>
          {currentApp && (
            <button onClick={handleGoBack} className="btn-save">
              ⬅️ Powrót
            </button>
          )}

          <button onClick={exportDatabase} className="btn-global-io">
            📥 Eksport JSON
          </button>
          
          <label className="btn-global-io" style={{ margin: 0, cursor: 'pointer' }}>
            📤 Import JSON
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>
        </div>

        {/* ŚRODEK NAGŁÓWKA (Wyśrodkowana nazwa aktywnej zakładki / Centrum Dowodzenia) */}
        <h1 style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 1
        }}>
          {currentAppTitle || 'Centrum Dowodzenia'}
        </h1>

        {/* PRAWA STRONA NAGŁÓWKA (Przycisk Dysk Google oraz Wyloguj) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', zIndex: 2 }}>
          <button 
            onClick={() => setIsDriveModalOpen(true)} 
            className="btn-global-io" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Konfiguracja i synchronizacja z Google Drive"
          >
            ☁️ Dysk Google
            {isDriveConnected && (
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#3fb950',
                  boxShadow: '0 0 6px #3fb950' 
                }} 
                title="Połączono"
              />
            )}
          </button>

          {/* Przycisk Wyloguj – podświetlenie na czerwono po najechaniu */}
          <button 
            onClick={handleLogout} 
            onMouseEnter={() => setIsLogoutHovered(true)}
            onMouseLeave={() => setIsLogoutHovered(false)}
            style={{ 
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: isLogoutHovered ? '#b3261e' : '#21262d', 
              color: isLogoutHovered ? '#ffffff' : '#f85149', 
              border: isLogoutHovered ? '1px solid #f85149' : '1px solid #363b42',
              transition: 'all 0.2s ease'
            }}
          >
            🔒 Wyloguj
          </button>
        </div>
      </header>

      <main className="app-content">
        {renderAppContent()}
      </main>

      <ClearDataButton />

      <GoogleDriveModal 
        isOpen={isDriveModalOpen} 
        onClose={() => setIsDriveModalOpen(false)}
        onDataRestored={() => window.location.reload()}
      />
    </div>
  );
}
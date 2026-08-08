import './App.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoginModal from './components/LoginModal';
import MainDashboard from './components/MainDashboard';
import ClearDataButton from './components/ClearDataButton';
import GoogleDriveModal from './components/GoogleDriveModal';
import { RadioProvider, useRadio } from './components/RadioContext';
import RadioIcon from './components/RadioIcon';

// Moduły
import OrtoBazaView from './modules/OrtoBaza/OrtoBazaView';
import StazView from './modules/StazCalculator/StazView';
import FinancesView from './modules/Finances/FinancesView';
import WorkView from './modules/WorkWorksheets/WorkView';

import { exportDatabase, importDatabase, createBackupPayload } from './utils/storage';
import { getAccessToken, uploadToDrive } from './utils/googleDriveSync';

function HeaderRadioWidget() {
  const { selectedStation, isPlaying, isLoading, togglePlay } = useRadio();

  return (
    <button
      type="button"
      onClick={togglePlay}
      className={`btn-global-io header-radio-btn ${isPlaying ? 'is-playing' : ''}`}
      title={isPlaying ? `Zatrzymaj ${selectedStation.name}` : `Odtwórz ${selectedStation.name}`}
    >
      <RadioIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
      <span className="btn-label-text header-radio-text">
        {selectedStation.name}
      </span>
      {isLoading ? (
        <span className="header-radio-badge loading">⌛</span>
      ) : isPlaying ? (
        <span className="header-radio-badge playing">❚❚</span>
      ) : (
        <span className="header-radio-badge stopped">▶</span>
      )}
    </button>
  );
}

function AppContent() {
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
      <header className="app-header">
        {/* LEWA STRONA NAGŁÓWKA (Przycisk Powrót oraz Przyciski Import/Eksport) */}
        <div className="header-actions-left">
          {currentApp && (
            <button onClick={handleGoBack} className="btn-save btn-back-nav" title="Powrót">
              ⬅️ <span className="btn-label-text">Powrót</span>
            </button>
          )}

          <button onClick={exportDatabase} className="btn-global-io" title="Eksportuj plik JSON z danymi">
            📥 <span className="btn-label-text">Eksport JSON</span>
          </button>
          
          <label className="btn-global-io" style={{ margin: 0, cursor: 'pointer' }} title="Importuj plik JSON z danymi">
            📤 <span className="btn-label-text">Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>
        </div>

        {/* ŚRODEK NAGŁÓWKA (Wyśrodkowana nazwa aktywnej zakładki / Centrum Dowodzenia) */}
        <h1 className="header-app-title">
          {currentAppTitle || 'Centrum Dowodzenia'}
        </h1>

        {/* PRAWA STRONA NAGŁÓWKA (Przycisk Radio, Dysk Google oraz Wyloguj) */}
        <div className="header-actions-right">
          <HeaderRadioWidget />

          <button 
            onClick={() => setIsDriveModalOpen(true)} 
            className="btn-global-io" 
            title="Konfiguracja i synchronizacja z Google Drive"
          >
            ☁️ <span className="btn-label-text">Dysk Google</span>
            <span 
              className={`drive-status-dot ${isDriveConnected ? 'connected' : 'disconnected'}`} 
              title={isDriveConnected ? "Połączono z Google Drive" : "Nie połączono z Google Drive"}
            />
          </button>

          {/* Przycisk Wyloguj – podświetlenie na czerwono po najechaniu */}
          <button 
            onClick={handleLogout} 
            onMouseEnter={() => setIsLogoutHovered(true)}
            onMouseLeave={() => setIsLogoutHovered(false)}
            className={`btn-logout ${isLogoutHovered ? 'hovered' : ''}`}
            title="Wyloguj z aplikacji"
          >
            🔒 <span className="btn-label-text">Wyloguj</span>
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

export default function App() {
  return (
    <RadioProvider>
      <AppContent />
    </RadioProvider>
  );
}

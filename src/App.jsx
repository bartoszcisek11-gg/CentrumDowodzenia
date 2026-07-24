import './App.css';
import React, { useState, useEffect } from 'react';
import LoginModal from './components/LoginModal';
import MainDashboard from './components/MainDashboard';
import ClearDataButton from './components/ClearDataButton';

// Moduły
import OrtoBazaView from './modules/OrtoBaza/OrtoBazaView';
import StazView from './modules/StazCalculator/StazView';
import FinancesView from './modules/Finances/FinancesView';
import WorkView from './modules/WorkWorksheets/WorkView';

import { exportDatabase, importDatabase } from './utils/storage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('app_authenticated') === 'true';
  });

  const [currentApp, setCurrentApp] = useState(null);
  const [currentAppTitle, setCurrentAppTitle] = useState('');
  
  // Stan podświetlenia dla przycisku Wyloguj
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  // Globalna obsługa klawisza Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (currentApp !== null) {
          handleGoHome();
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

  const handleOpenApp = (id, title) => {
    setCurrentApp(id);
    setCurrentAppTitle(title);
  };

  const handleGoHome = () => {
    setCurrentApp(null);
    setCurrentAppTitle('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('app_authenticated');
    setIsAuthenticated(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importDatabase(file, () => {
      window.location.reload();
    });
  };

  const renderAppContent = () => {
    switch (currentApp) {
      case 'app-1':
        return <OrtoBazaView />; /* POPRAWIONE: OrtoBaza -> OrtoBazaView */
      case 'app-2':
        return <StazView />;
      case 'app-3':
        return <FinancesView />;
      case 'app-4':
        return <WorkView />;
      default:
        return <MainDashboard onOpenApp={handleOpenApp} />;
    }
  };

  return (
    <div className="app-root">
      <header className="app-header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* LEWA STRONA NAGŁÓWKA (Przycisk Powrót) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', zIndex: 2, minHeight: '38px' }}>
          {currentApp && (
            <button onClick={handleGoHome} className="btn-save">
              ⬅️ Powrót
            </button>
          )}
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

        {/* PRAWA STRONA NAGŁÓWKA (Przyciski Import/Eksport/Wyloguj) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', zIndex: 2 }}>
          <button onClick={exportDatabase} className="btn-global-io">
            📥 Eksport JSON
          </button>
          
          <label className="btn-global-io" style={{ margin: 0, cursor: 'pointer' }}>
            📤 Import JSON
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>

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
    </div>
  );
}
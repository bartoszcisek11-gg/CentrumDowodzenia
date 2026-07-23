import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MainDashboard from './components/MainDashboard';
import OrtoBazaView from './modules/OrtoBaza/OrtoBazaView';
import StazView from './modules/StazCalculator/StazView';
import FinancesView from './modules/Finances/FinancesView';
import WorkView from './modules/WorkWorksheets/WorkView';
import ModalRules from './components/ModalRules';
import ClearDataButton from './components/ClearDataButton';
import './App.css';

export default function App() {
  const [activeApp, setActiveApp] = useState('menu');
  const [appTitle, setAppTitle] = useState('Centrum Dowodzenia');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const handleOpenApp = (appId, title) => {
    setActiveApp(appId);
    setAppTitle(title);
  };

  const handleBackToMenu = () => {
    setActiveApp('menu');
    setAppTitle('Centrum Dowodzenia');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isRulesModalOpen) {
          setIsRulesModalOpen(false);
        } else if (activeApp !== 'menu') {
          handleBackToMenu();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRulesModalOpen, activeApp]);

  return (
    <div className="app-root">
      <Header 
        title={appTitle} 
        activeApp={activeApp} 
        onBack={handleBackToMenu} 
      />

      <main>
        {activeApp === 'menu' && (
          <MainDashboard onOpenApp={handleOpenApp} />
        )}

        {/* OrtoBaza używa standardowej ramki .app-view */}
        {activeApp === 'app-1' && (
          <section className="app-view active">
            <OrtoBazaView />
          </section>
        )}

        {/* Pozostałe moduły zarządzają własnymi tłam/ramkami bez otoczki .app-view */}
        {activeApp === 'app-2' && (
          <StazView onOpenModal={() => setIsRulesModalOpen(true)} />
        )}

        {activeApp === 'app-3' && (
          <FinancesView />
        )}

        {activeApp === 'app-4' && (
          <WorkView />
        )}
      </main>

      <ClearDataButton />

      {isRulesModalOpen && (
        <ModalRules onClose={() => setIsRulesModalOpen(false)} />
      )}
    </div>
  );
}

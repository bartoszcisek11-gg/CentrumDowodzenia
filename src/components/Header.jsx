import React, { useRef } from 'react';
import { exportDatabase, importDatabase } from '../utils/storage';

export default function Header({ title, activeApp, onBack }) {
  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    importDatabase(e.target.files[0], () => window.location.reload());
  };

  return (
    <header>
      <div className="header-left">
        <h1 id="page-title">{title}</h1>
        {activeApp !== 'menu' && (
          <button className="btn-back" style={{ display: 'block' }} onClick={onBack}>
            ← Powrót do menu
          </button>
        )}
      </div>

      <div className="global-actions">
        <button 
          className="btn-global-io" 
          onClick={exportDatabase} 
          title="Zapisz dane do pliku w celu przeniesienia na inne urządzenie"
        >
          📥 Eksport danych
        </button>
        <button 
          className="btn-global-io" 
          onClick={() => fileInputRef.current.click()} 
          title="Wczytaj dane wyeksportowane z innego urządzenia"
        >
          📤 Import danych
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImport} 
        />
      </div>
    </header>
  );
}
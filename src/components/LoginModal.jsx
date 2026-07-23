import React, { useState } from 'react';
import './LoginModal.css';
import { importDatabase } from '../utils/storage';

export default function LoginModal({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const storedPassword = localStorage.getItem('app_user_password');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPass = storedPassword || '123';

    if (password === correctPass) {
      sessionStorage.setItem('app_authenticated', 'true');
      onLogin();
    } else {
      setError('Niepoprawne hasło!');
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importDatabase(file, () => {
      window.location.reload();
    });
  };

  // Generowanie kresek dla obrotowego pierścienia SVG
  const totalBars = 60;
  const radius = 190;
  const activeCount = Math.min(password.length * 5, totalBars);

  const bars = Array.from({ length: totalBars }).map((_, i) => {
    const angle = (i * 360) / totalBars;
    const rad = (angle * Math.PI) / 180;
    
    // Punkt początkowy i końcowy kreski
    const x1 = 220 + (radius - 16) * Math.cos(rad);
    const y1 = 220 + (radius - 16) * Math.sin(rad);
    const x2 = 220 + radius * Math.cos(rad);
    const y2 = 220 + radius * Math.sin(rad);

    const isActive = i < activeCount || (!storedPassword && i < 20);

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
            <div>
              <p style={{ color: '#52677d', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Zaimportuj plik <strong>JSON</strong>, aby odblokować bazę danych.
              </p>
              <label className="login-btn" style={{ display: 'block', margin: 0, cursor: 'pointer' }}>
                📤 Wgraj plik JSON
                <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
              <input
                type="password"
                className="login-input"
                placeholder="Hasło"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
              />

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-btn">
                Login
              </button>

              <label className="login-link" style={{ display: 'inline-block', marginTop: '5px' }}>
                Wgraj inny plik JSON
                <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
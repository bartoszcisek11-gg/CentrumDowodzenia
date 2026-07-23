import React, { useState } from 'react';
import { importDatabase } from '../utils/storage';

export default function LoginModal({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Sprawdzamy, czy w localStorage jest już zapisane hasło z pliku JSON
  const storedPassword = localStorage.getItem('app_user_password');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Jeśli w pliku nie było hasła, domyślne to np. '123'
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
      // Po pomyślnym zaimportowaniu odświeżamy stronę, by pobrać nowe hasło z JSON-a
      window.location.reload();
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#111318',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #2c3545',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: '#fff', marginTop: 0 }}>Centrum Dowodzenia</h2>

        {!storedPassword ? (
          /* STAN 1: Brak danych w localStorage – prośba o import JSON */
          <div>
            <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Brak wykrytych danych. Zaimportuj plik kopii zapasowej <strong>JSON</strong>, aby odblokować dostęp do bazy.
            </p>
            <label className="btn-global-io" style={{
              display: 'inline-block',
              padding: '12px 20px',
              backgroundColor: '#238636',
              color: '#fff',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              📤 Wgraj plik JSON z danymi
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileImport} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        ) : (
          /* STAN 2: Dane istnieją – okno do wpisania hasła */
          <form onSubmit={handlePasswordSubmit}>
            <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Podaj hasło dostępowe do Twoich danych
            </p>
            <input
              type="password"
              placeholder="Wpisz hasło..."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: error ? '1px solid #ff4d4f' : '1px solid #2c3545',
                backgroundColor: '#111318',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '10px'
              }}
            />

            {error && (
              <div style={{ color: '#ff4d4f', fontSize: '0.85rem', marginBottom: '10px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#238636',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              Zaloguj
            </button>

            {/* Opcja wgrania innego pliku JSON */}
            <label style={{ color: '#58a6ff', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Wgraj inny plik JSON
              <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
          </form>
        )}
      </div>
    </div>
  );
}
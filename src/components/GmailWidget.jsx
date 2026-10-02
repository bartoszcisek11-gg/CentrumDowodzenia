import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  requestGmailToken,
  logout,
  fetchUnreadEmails,
  getAccessToken,
  getSavedUser,
  getSavedClientId,
  getCurrentOrigin,
  DRIVE_CLIENT_ID,
  extractUrlFromError
} from '../utils/gmailService';

// Ikona Gmail SVG
const GmailIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M34.9 448h81.5V250.2L0 163v250.2C0 432.5 15.7 448 34.9 448" fill="#4285f4"/>
    <path d="M395.6 448h81.5c19.3 0 34.9-15.7 34.9-34.9V163l-116.4 87.3" fill="#34a853"/>
    <path d="M395.6 99v151.3L512 163v-46.5c0-43.2-49.3-67.8-83.8-41.9" fill="#fbbc04"/>
    <path d="M116.4 250.2V99L256 203.7 395.6 99v151.3L256 355" fill="#ea4335"/>
    <path d="M0 116.4V163l116.4 87.3V99L83.8 74.5C49.2 48.6 0 73.2 0 116.4" fill="#c5221f"/>
  </svg>
);

// Kolor tła dla awatara na podstawie nazwy
function getAvatarColor(name = '') {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#6366f1', '#14b8a6', '#f97316', '#e11d48'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function GmailWidget() {
  const [currentUser, setCurrentUser] = useState(() => getSavedUser());
  const [hasToken, setHasToken] = useState(() => !!getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [emails, setEmails] = useState([]);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState('inbox'); // 'inbox' lub 'all'
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Stan pomocy origin_mismatch
  const [showOriginHelp, setShowOriginHelp] = useState(false);
  const [activeClientId] = useState(() => getSavedClientId());
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin = getCurrentOrigin();

  // Kopiowanie bieżącego źródła
  const handleCopyOrigin = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2500);
    }
  };

  // Funkcja ładowania maili
  const loadEmails = useCallback(async (type = filterType) => {
    setIsLoadingEmails(true);
    setErrorDetails(null);
    try {
      const data = await fetchUnreadEmails(35, type);
      setEmails(data.messages);
      setTotalEstimate(data.totalEstimate);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Błąd podczas pobierania maili:', err);

      if (err.status === 401) {
        setHasToken(false);
        setErrorDetails({
          title: 'Sesja wygasła',
          message: 'Twoja sesja autoryzacji Google wygasła. Kliknij przycisk poniżej, aby połączyć konto ponownie.',
          isAuth: true
        });
      } else {
        const consoleUrl = err.consoleUrl || extractUrlFromError(err.message || '');
        const isApiDisabled = err.message?.toLowerCase().includes('disabled') || err.message?.toLowerCase().includes('not been used');

        setErrorDetails({
          title: isApiDisabled ? 'Gmail API nie jest włączone w projekcie Google Cloud' : 'Nie udało się pobrać wiadomości',
          message: err.message || 'Wystąpił nieoczekiwany błąd podczas łączenia z Gmail API.',
          consoleUrl,
          status: err.status,
          isApiDisabled
        });
      }
    } finally {
      setIsLoadingEmails(false);
    }
  }, [filterType]);

  // Automatyczne ładowanie wiadomości po uzyskaniu tokena
  useEffect(() => {
    if (hasToken) {
      loadEmails(filterType);
    }
  }, [hasToken, filterType, loadEmails]);

  // Nasłuchiwanie na autoryzację wywołaną przez Dysk Google lub inne moduły
  useEffect(() => {
    const handleAuthEvent = () => {
      const token = getAccessToken();
      const user = getSavedUser();
      if (token) {
        setHasToken(true);
        if (user) setCurrentUser(user);
      } else {
        setHasToken(false);
        setCurrentUser(null);
        setEmails([]);
      }
    };

    window.addEventListener('gmail-auth-change', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);
    return () => {
      window.removeEventListener('gmail-auth-change', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
    };
  }, []);

  // Logowanie przez Google
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorDetails(null);
    try {
      const currentId = getSavedClientId();
      const result = await requestGmailToken(currentId);
      if (result) {
        setCurrentUser(result.user);
        setHasToken(true);
      }
    } catch (err) {
      console.error('Błąd logowania:', err);
      const isOriginMismatch =
        err.message?.includes('origin_mismatch') ||
        err.message?.includes('400') ||
        err.code === 'idpiframe_initialization_failed' ||
        err.message?.includes('popup_closed');
      const consoleUrl = extractUrlFromError(err.message || '');

      setErrorDetails({
        title: 'Błąd autoryzacji Google (origin_mismatch)',
        message: 'Google zablokowało logowanie ze względów bezpieczeństwa (błąd 400: origin_mismatch), ponieważ Twój adres (' + currentOrigin + ') nie jest wpisany na liście dozwolonych domen dla Twojego projektu Google Cloud.',
        consoleUrl,
        isOriginMismatch: true
      });
      setShowOriginHelp(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Wylogowanie
  const handleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setHasToken(false);
      setEmails([]);
      setTotalEstimate(0);
      setErrorDetails(null);
    } catch (err) {
      console.error('Błąd wylogowywania:', err);
    }
  };

  // Filtrowanie wiadomości na podstawie wyszukiwarki
  const filteredEmails = useMemo(() => {
    if (!filterQuery.trim()) return emails;
    const q = filterQuery.toLowerCase().trim();
    return emails.filter(email => {
      const senderName = (email.sender?.name || '').toLowerCase();
      const senderEmail = (email.sender?.email || '').toLowerCase();
      const subject = (email.subject || '').toLowerCase();
      const snippet = (email.snippet || '').toLowerCase();
      return senderName.includes(q) || senderEmail.includes(q) || subject.includes(q) || snippet.includes(q);
    });
  }, [emails, filterQuery]);

  // Pomocnicza nazwa bieżącego Client ID
  const clientIdLabel = useMemo(() => {
    if (activeClientId === DRIVE_CLIENT_ID) return 'Projekt Dysku Google (242774...)';
    return activeClientId ? `${activeClientId.slice(0, 16)}...` : 'Projekt Dysku Google';
  }, [activeClientId]);

  // Modal pomocy dotyczący błędu origin_mismatch
  const renderOriginHelpModal = () => {
    if (!showOriginHelp) return null;

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 16, 30, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
        overflowY: 'auto',
        border: '1px solid rgba(0, 242, 255, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ color: '#00f2ff', margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            🛠️ Jak rozwiązać „Błąd 400: origin_mismatch”?
          </h4>
          <button
            type="button"
            onClick={() => setShowOriginHelp(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '2px 6px'
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '14px' }}>
          Google wymaga, aby adres internetowy, z którego loguje się aplikacja, był wpisany na liście <strong>„Autoryzowane źródła JavaScript”</strong> w Twoim projekcie Google Cloud.
        </p>

        {/* Bieżące źródło do skopiowania */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 242, 255, 0.25)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Twój bieżący adres (Origin) do skopiowania:
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <code style={{
              flex: 1,
              background: '#070d19',
              padding: '5px 8px',
              borderRadius: '4px',
              color: '#00f2ff',
              fontSize: '12px',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentOrigin || 'Brak (uruchomiono z pliku)'}
            </code>
            <button
              type="button"
              onClick={handleCopyOrigin}
              style={{
                background: copiedOrigin ? '#10b981' : 'var(--primary)',
                color: '#09121d',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {copiedOrigin ? '✓ Skopiowano!' : '📋 Kopiuj'}
            </button>
          </div>
        </div>

        {/* Instrukcja krok po kroku */}
        <div style={{ fontSize: '11.5px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
              Krok 1: Włącz Gmail API w projekcie Google Cloud
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
              W tym samym projekcie, w którym masz już skonfigurowany Dysk Google, włącz usługę Gmail:
            </div>
            <a
              href="https://console.cloud.google.com/apis/library/gmail.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'rgba(66, 133, 244, 0.25)',
                border: '1px solid rgba(66, 133, 244, 0.5)',
                color: '#90caf9',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Kliknij tutaj i włącz Gmail API ↗
            </a>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
              Krok 2: Upewnij się, że adres strony jest dodany
            </div>
            <ol style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '11px', lineHeight: '1.45', color: 'var(--text-muted)' }}>
              <li>Wejdź na <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff' }}>Google Cloud Console → Credentials ↗</a></li>
              <li>Kliknij w swój <strong>OAuth 2.0 Client ID</strong></li>
              <li>W sekcji <strong>Autoryzowane źródła JavaScript</strong> dodaj: <strong style={{ color: '#fff' }}>{currentOrigin}</strong></li>
              <li>Zapisz zmiany w Google Cloud.</li>
            </ol>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => setShowOriginHelp(false)}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              background: 'var(--primary)',
              border: 'none',
              color: '#09121d',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Rozumiem, zamknij
          </button>
        </div>
      </div>
    );
  };

  // Widok braku aktywnego tokena / logowania
  if (!hasToken) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '360px',
        padding: '20px 16px',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(66, 133, 244, 0.08) 0%, transparent 70%)',
        borderRadius: '12px',
        position: 'relative'
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
        }}>
          <GmailIcon size={30} />
        </div>

        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '6px'
        }}>
          Nieprzeczytane maile z Gmail
        </h3>

        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          maxWidth: '380px',
          lineHeight: '1.45',
          marginBottom: '14px'
        }}>
          {currentUser?.email ? (
            <>Połączono jako: <strong style={{ color: '#fff' }}>{currentUser.email}</strong>. Wymagane odświeżenie uprawnień odczytu wiadomości.</>
          ) : (
            'Połącz swoje konto Google, aby przeglądać najnowsze nieodczytane wiadomości z Gmaila bezpośrednio w tym oknie.'
          )}
        </p>

        {/* Szczegółowy komunikat o błędzie */}
        {errorDetails && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.15)',
            border: '1px solid #e74c3c',
            color: '#ff8a80',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '14px',
            maxWidth: '430px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#ffb4ab', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ {errorDetails.title}</span>
              <button
                type="button"
                onClick={() => setShowOriginHelp(true)}
                style={{
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Jak to naprawić? 💡
              </button>
            </div>
            <div style={{ lineHeight: '1.4', fontSize: '11px', marginBottom: errorDetails.consoleUrl ? '10px' : '0' }}>
              {errorDetails.message}
            </div>

            {errorDetails.consoleUrl && (
              <a
                href={errorDetails.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#e74c3c',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '11px'
                }}
              >
                👉 Włącz Gmail API w Google Cloud ↗
              </a>
            )}
          </div>
        )}

        {/* Oficjalny przycisk logowania przez Google */}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
            color: '#1f1f1f',
            border: 'none',
            borderRadius: '24px',
            padding: '10px 22px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isSigningIn ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.2s ease',
            opacity: isSigningIn ? 0.7 : 1
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f3f4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ display: 'block', flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          <span>{isSigningIn ? 'Łączenie z Google...' : 'Połącz z kontem Google'}</span>
        </button>

        {/* Pasek statusu źródła i Client ID */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div>
            Client ID: <strong style={{ color: '#e2e8f0' }}>{clientIdLabel}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Adres strony: <code style={{ color: '#38bdf8' }}>{currentOrigin || 'localhost'}</code></span>
            <button
              type="button"
              onClick={() => setShowOriginHelp(true)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#90caf9',
                borderRadius: '4px',
                padding: '1px 6px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Pomoc z origin_mismatch 💡
            </button>
          </div>
        </div>

        {renderOriginHelpModal()}
      </div>
    );
  }

  // Widok zalogowanego użytkownika z listą wiadomości
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '380px',
      position: 'relative'
    }}>
      {/* Pasek narzędziowy widgetu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '10px'
      }}>
        {/* Lewa strona: licznik, przełącznik folderu i adres e-mail */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          minWidth: 0,
          flex: 1
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: emails.length > 0 ? 'rgba(0, 242, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
            border: emails.length > 0 ? '1px solid rgba(0, 242, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
            padding: '3px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 700,
            color: emails.length > 0 ? 'var(--primary)' : 'var(--text-muted)',
            flexShrink: 0
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: emails.length > 0 ? '#00f2ff' : '#94a3b8',
              boxShadow: emails.length > 0 ? '0 0 8px #00f2ff' : 'none'
            }} />
            <span>
              {emails.length === 0
                ? 'Brak nieprzeczytanych'
                : `${totalEstimate > emails.length ? `${emails.length}+` : emails.length} nieprzeczytane`}
            </span>
          </div>

          {/* Przełącznik: Odebrane vs Wszystkie */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={() => setFilterType('inbox')}
              style={{
                background: filterType === 'inbox' ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: filterType === 'inbox' ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '10.5px',
                fontWeight: filterType === 'inbox' ? 700 : 500,
                padding: '2px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Odebrane
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              style={{
                background: filterType === 'all' ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: filterType === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '10.5px',
                fontWeight: filterType === 'all' ? 700 : 500,
                padding: '2px 8px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Wszystkie
            </button>
          </div>

          {currentUser?.email && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={`Zalogowano jako: ${currentUser.email}`}
            >
              {currentUser.email}
            </span>
          )}
        </div>

        {/* Prawa strona (prawy górny róg kafelka): Odśwież oraz Wyloguj */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => loadEmails(filterType)}
            disabled={isLoadingEmails}
            className="btn-gmail-refresh"
            title="Odśwież skrzynkę odbiorczą"
          >
            <span style={{
              display: 'inline-block',
              animation: isLoadingEmails ? 'spin 1s linear infinite' : 'none'
            }}>
              🔄
            </span>
            <span>{isLoadingEmails ? 'Odświeżam...' : 'Odśwież'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="btn-gmail-logout"
            title="Rozłącz konto Google"
          >
            Wyloguj
          </button>
        </div>
      </div>

      {/* Pasek wyszukiwania maili */}
      {emails.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '6px 12px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Szukaj po nadawcy, temacie lub treści..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none',
              padding: 0
            }}
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px 4px'
              }}
              title="Wyczyść filtr"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Komunikat o błędzie */}
      {errorDetails && (
        <div style={{
          background: 'rgba(231, 76, 60, 0.15)',
          border: '1px solid #e74c3c',
          color: '#ff8a80',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#ffb4ab', marginBottom: '2px' }}>
                ⚠️ {errorDetails.title}
              </div>
              <div style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
                {errorDetails.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadEmails(filterType)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '3px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Spróbuj ponownie
            </button>
          </div>

          {errorDetails.consoleUrl && (
            <div style={{ marginTop: '8px' }}>
              <a
                href={errorDetails.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#e74c3c',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  fontSize: '11px'
                }}
              >
                👉 Kliknij tutaj, aby włączyć Gmail API w projekcie Google ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Lista wiadomości */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingRight: '4px'
      }}>
        {isLoadingEmails && emails.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '240px',
            color: 'var(--text-muted)',
            gap: '12px'
          }}>
            <div className="gmail-spinner" />
            <span style={{ fontSize: '13px' }}>Pobieranie nieprzeczytanych wiadomości...</span>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '240px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '20px'
          }}>
            {filterQuery ? (
              <>
                <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🔎</span>
                <span style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  Brak wyników dla: „{filterQuery}”
                </span>
                <span style={{ fontSize: '12px' }}>Spróbuj wpisać inną frazę lub wyczyść filtr.</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎉</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff', marginBottom: '6px' }}>
                  Wszystko przeczytane!
                </span>
                <span style={{ fontSize: '12px', maxWidth: '320px', lineHeight: '1.4' }}>
                  {filterType === 'inbox'
                    ? 'W skrzynce Odebrane nie masz żadnych nieprzeczytanych maili.'
                    : 'We wszystkich folderach Gmail nie ma nieprzeczytanych maili.'}
                </span>
              </>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => {
            const senderInitial = (email.sender?.name || email.sender?.email || '?')[0].toUpperCase();
            const avatarBg = getAvatarColor(email.sender?.name || email.sender?.email || '');

            return (
              <a
                key={email.id}
                href={email.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gmail-message-card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                {/* Wskaźnik nieprzeczytania (cyan dot) */}
                <span style={{
                  position: 'absolute',
                  top: '14px',
                  left: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#00f2ff',
                  boxShadow: '0 0 6px #00f2ff'
                }} />

                {/* Awatar nadawcy */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: avatarBg,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                  marginLeft: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {senderInitial}
                </div>

                {/* Treść wiadomości */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {email.sender?.name || email.sender?.email}
                    </span>

                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      fontWeight: 500
                    }}>
                      {email.date}
                    </span>
                  </div>

                  <div style={{
                    fontWeight: 600,
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '4px'
                  }}>
                    {email.subject}
                  </div>

                  {email.snippet && (
                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4'
                    }}>
                      {email.snippet}
                    </div>
                  )}
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Stopka widgetu */}
      {lastRefreshed && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '8px',
          marginTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '10.5px',
          color: 'var(--text-muted)'
        }}>
          <span>Ostatnie odświeżenie: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Kliknij mail, aby otworzyć w Gmail</span>
        </div>
      )}

      {renderOriginHelpModal()}
    </div>
  );
}

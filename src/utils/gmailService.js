// Moduł integracji z Gmail za pomocą Google Identity Services (GSI)
// Bez konieczności instalowania zewnętrznych pakietów npm

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const COMBINED_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.readonly';

// Domyślny identyfikator klienta Google OAuth2 (Projekt Dysku Google użytkownika)
export const DRIVE_CLIENT_ID = '242774672962-gvuvikc5nbn30r4b55hqvvdfhqsqugm9.apps.googleusercontent.com';
export const DEFAULT_CLIENT_ID = DRIVE_CLIENT_ID;

let tokenClient = null;
let cachedAccessToken = null;
let currentUser = null;

// Pobranie bieżącego adresu źródłowego (Origin) w przeglądarce użytkownika
export function getCurrentOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

// Sprawdzenie, czy aplikacja działa w chmurze AI Studio (.run.app) czy na zewnętrznej domenie (np. GitHub Pages, localhost)
export function isAiStudioOrigin() {
  if (typeof window === 'undefined' || !window.location?.hostname) return false;
  const host = window.location.hostname;
  return host.endsWith('.run.app') || host.endsWith('.google.com');
}

// Ładowanie oficjalnego skryptu Google Identity Services
export function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Nie udało się załadować skryptu Google Identity Services.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Nie udało się załadować skryptu Google Identity Services.'));
    document.body.appendChild(script);
  });
}

// Pobieranie zapisanego Client ID (zawsze domyślnie projekt Dysku Google)
export function getSavedClientId() {
  const custom = localStorage.getItem('gmail_client_id');
  if (custom && custom.trim()) {
    // Jeśli w pamięci pozostał stary identyfikator AI Studio, zmigruj go na projekt Dysku Google
    if (custom.includes('112806454538')) {
      localStorage.setItem('gmail_client_id', DRIVE_CLIENT_ID);
      return DRIVE_CLIENT_ID;
    }
    return custom.trim();
  }

  // Jeśli użytkownik skonfigurował Client ID w Dysku Google, użyj go
  const driveCustom = localStorage.getItem('google_drive_client_id');
  if (driveCustom && driveCustom.trim()) {
    return driveCustom.trim();
  }

  return DRIVE_CLIENT_ID;
}

// Zapisywanie Client ID
export function setSavedClientId(clientId) {
  if (clientId && clientId.trim()) {
    localStorage.setItem('gmail_client_id', clientId.trim());
  } else {
    localStorage.removeItem('gmail_client_id');
  }
}

// Pobieranie aktywnego tokena z pamięci podręcznej, localStorage Gmail lub Google Drive
export function getAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const token = localStorage.getItem('gmail_access_token') || localStorage.getItem('gdrive_access_token');
  const expiry = localStorage.getItem('gmail_token_expiry') || localStorage.getItem('gdrive_token_expiry');
  if (token && expiry && Date.now() < parseInt(expiry, 10)) {
    cachedAccessToken = token;
    return token;
  }
  return null;
}

// Zapisywanie tokena
export function saveAccessToken(token, expiresInSeconds = 3600) {
  cachedAccessToken = token;
  const expiryMs = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem('gmail_access_token', token);
  localStorage.setItem('gmail_token_expiry', expiryMs.toString());
}

// Pobieranie danych zalogowanego użytkownika
export function getSavedUser() {
  if (currentUser) return currentUser;
  const email = localStorage.getItem('gmail_user_email') || localStorage.getItem('gdrive_user_email');
  if (email) {
    currentUser = { email };
    return currentUser;
  }
  return null;
}

// Pobieranie profilu użytkownika bezpośrednio z Gmail API (używa tylko zakresu gmail.readonly)
export async function fetchGmailUserProfile(token) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.details = errData;
    throw err;
  }

  const profile = await res.json();
  const user = {
    email: profile.emailAddress,
    messagesTotal: profile.messagesTotal,
    threadsTotal: profile.threadsTotal,
    historyId: profile.historyId
  };

  currentUser = user;
  if (profile.emailAddress) {
    localStorage.setItem('gmail_user_email', profile.emailAddress);
  }
  return user;
}

// Autoryzacja i żądanie tokena przez okno popup Google
export async function requestGmailToken(clientId = getSavedClientId()) {
  await loadGisScript();

  if (!clientId || !clientId.trim()) {
    throw new Error('Brak Google OAuth Client ID.');
  }

  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: COMBINED_SCOPES,
        callback: async (response) => {
          if (response.error) {
            const err = new Error(response.error_description || response.error);
            err.code = response.error;
            reject(err);
            return;
          }
          if (response.access_token) {
            const token = response.access_token;
            const expiresIn = parseInt(response.expires_in, 10) || 3600;
            saveAccessToken(token, expiresIn);

            // Zapisz również dla Dysku Google
            const expiryMs = (Date.now() + expiresIn * 1000).toString();
            localStorage.setItem('gdrive_access_token', token);
            localStorage.setItem('gdrive_token_expiry', expiryMs);

            // Pobierz dane profilu użytkownika
            let user = { email: localStorage.getItem('gmail_user_email') || localStorage.getItem('gdrive_user_email') || 'Użytkownik Google' };
            try {
              const profile = await fetchGmailUserProfile(token);
              if (profile?.email) {
                user = profile;
                localStorage.setItem('gdrive_user_email', profile.email);
              }
            } catch (err) {
              console.warn('Nie udało się pobrać profilu z Gmail API:', err);
              // Jeśli profil nie przeszedł przez 403, przekaż błąd dalej
              if (err.status === 403) {
                reject(err);
                return;
              }
            }

            // Poinformuj komponenty o autoryzacji
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('gmail-auth-change', {
                detail: { token, user }
              }));
            }

            resolve({
              accessToken: token,
              user
            });
          } else {
            reject(new Error('Nie otrzymano tokena dostępu z Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}

// Wylogowanie / odpięcie tokena
export async function logout() {
  const token = getAccessToken();
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {}
  }
  cachedAccessToken = null;
  currentUser = null;
  localStorage.removeItem('gmail_access_token');
  localStorage.removeItem('gmail_token_expiry');
  localStorage.removeItem('gmail_user_email');
}

// Pomocnicza funkcja czyszcząca nagłówek nadawcy
function parseSender(fromHeader = '') {
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    let name = match[1].replace(/^["']|["']$/g, '').trim();
    const email = match[2].trim();
    if (!name) name = email.split('@')[0];
    return { name, email };
  }
  const cleanEmail = fromHeader.replace(/^["']|["']$/g, '').trim();
  return { name: cleanEmail.split('@')[0] || cleanEmail, email: cleanEmail };
}

// Formatowanie daty wiadomości
function formatEmailDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return `Dzisiaj, ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Wczoraj, ${timeStr}`;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}, ${timeStr}`;
  } catch (e) {
    return dateStr;
  }
}

// Dekodowanie encji HTML w tekście podglądu
function decodeHtmlEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

// Wykrywanie linku URL w treści błędu (np. do włączenia Google API)
export function extractUrlFromError(errText = '') {
  const match = errText.match(/https?:\/\/[^\s"',)]+/);
  return match ? match[0] : null;
}

// Pobieranie listy nieprzeczytanych wiadomości z Gmail API
// filterType: 'inbox' (is:unread in:inbox) lub 'all' (is:unread)
export async function fetchUnreadEmails(maxResults = 25, filterType = 'inbox') {
  const token = getAccessToken();
  if (!token) {
    const err = new Error('Brak aktywnego tokena sesji Google. Zaloguj się ponownie.');
    err.status = 401;
    throw err;
  }

  const query = filterType === 'inbox' ? 'is:unread in:inbox' : 'is:unread';
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

  const res = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (res.status === 401) {
    cachedAccessToken = null;
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_token_expiry');
    const err = new Error('Sesja Google wygasła. Zaloguj się ponownie.');
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    let errMessage = `Błąd Gmail API (${res.status})`;
    let consoleUrl = null;
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        errMessage = errData.error.message;
        consoleUrl = extractUrlFromError(errMessage);
      }
    } catch (e) {
      errMessage = await res.text().catch(() => errMessage);
      consoleUrl = extractUrlFromError(errMessage);
    }
    const err = new Error(errMessage);
    err.status = res.status;
    err.consoleUrl = consoleUrl;
    throw err;
  }

  const listData = await res.json();
  const messagesSummary = listData.messages || [];
  const resultSizeEstimate = listData.resultSizeEstimate || 0;

  if (messagesSummary.length === 0) {
    return {
      messages: [],
      totalEstimate: resultSizeEstimate,
      query
    };
  }

  const detailPromises = messagesSummary.map(async (msg) => {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
      const detailRes = await fetch(detailUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();

      const headers = detailData.payload?.headers || [];
      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(Brak tematu)';
      const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

      const sender = parseSender(fromHeader);
      const formattedDate = formatEmailDate(dateHeader);
      const snippet = decodeHtmlEntities(detailData.snippet || '');

      return {
        id: detailData.id,
        threadId: detailData.threadId,
        sender,
        subject: subjectHeader,
        date: formattedDate,
        rawDate: dateHeader,
        snippet,
        internalDate: parseInt(detailData.internalDate, 10) || 0,
        gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${detailData.id}`
      };
    } catch (e) {
      console.warn(`Nie udało się pobrać szczegółów wiadomości ${msg.id}:`, e);
      return null;
    }
  });

  const detailedMessages = (await Promise.all(detailPromises)).filter(Boolean);

  detailedMessages.sort((a, b) => b.internalDate - a.internalDate);

  return {
    messages: detailedMessages,
    totalEstimate: Math.max(resultSizeEstimate, detailedMessages.length),
    query
  };
}

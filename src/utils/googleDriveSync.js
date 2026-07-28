// Moduł integracji z Google Drive (Dysk Google)
// Bezpieczna synchronizacja pliku "centrumdowodzenia.json" w Dysku Google

const DRIVE_FILE_NAME = 'centrumdowodzenia.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DEFAULT_CLIENT_ID = '242774672962-gvuvikc5nbn30r4b55hqvvdfhqsqugm9.apps.googleusercontent.com';

let tokenClient = null;

// Ładowanie skryptu Google Identity Services
export function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Nie udało się załadować skryptu Google API.'));
    document.body.appendChild(script);
  });
}

// Pobieranie zapisanego Client ID
export function getSavedClientId() {
  return localStorage.getItem('google_drive_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
}

// Zapisywanie Client ID
export function setSavedClientId(clientId) {
  localStorage.setItem('google_drive_client_id', clientId.trim());
}

// Pobieranie aktywnego Access Tokena z sessionStorage
export function getAccessToken() {
  const token = sessionStorage.getItem('gdrive_access_token');
  const expiry = sessionStorage.getItem('gdrive_token_expiry');
  if (token && expiry && Date.now() < parseInt(expiry, 10)) {
    return token;
  }
  return null;
}

// Zapis Access Tokena
export function saveAccessToken(token, expiresInSeconds = 3500) {
  sessionStorage.setItem('gdrive_access_token', token);
  sessionStorage.setItem('gdrive_token_expiry', (Date.now() + expiresInSeconds * 1000).toString());
}

// Czyszczenie połączenia
export function disconnectDrive() {
  sessionStorage.removeItem('gdrive_access_token');
  sessionStorage.removeItem('gdrive_token_expiry');
  localStorage.removeItem('gdrive_auto_sync');
  localStorage.removeItem('gdrive_user_email');
}

// Inicjalizacja autoryzacji Google OAuth2
export async function requestDriveToken(clientId) {
  await loadGisScript();

  if (!clientId) {
    throw new Error('Brak Google OAuth Client ID.');
  }

  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: async (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            saveAccessToken(response.access_token, response.expires_in || 3600);
            
            // Spróbuj pobrać e-mail użytkownika
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                if (info.email) {
                  localStorage.setItem('gdrive_user_email', info.email);
                }
              }
            } catch (e) {
              console.warn('Nie udało się pobrać adresu e-mail:', e);
            }

            resolve(response.access_token);
          } else {
            reject(new Error('Nie otrzymano tokena dostępu z Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

// Wyszukiwanie pliku "centrumdowodzenia.json" w Dysku Google
export async function findDriveFile(accessToken) {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, modifiedTime)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      sessionStorage.removeItem('gdrive_access_token');
      throw new Error('Sesja Google wygasła. Zaloguj się ponownie.');
    }
    throw new Error('Błąd komunikacji z Google Drive.');
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0]; // { id, name, modifiedTime }
  }
  return null;
}

// Zapis / Aktualizacja pliku "centrumdowodzenia.json" na Dysku Google
export async function uploadToDrive(accessToken, payloadObj) {
  const fileContent = JSON.stringify(payloadObj, null, 2);
  const existingFile = await findDriveFile(accessToken);

  if (existingFile) {
    // Nadpisz istniejący plik (PATCH /upload)
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });

    if (!updateRes.ok) {
      throw new Error(`Błąd aktualizacji pliku na Google Drive (${updateRes.status})`);
    }

    const updatedData = await updateRes.json();
    localStorage.setItem('gdrive_last_sync', new Date().toISOString());
    return updatedData;
  } else {
    // Stwórz nowy plik (POST multipart)
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      close_delim;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    if (!createRes.ok) {
      throw new Error(`Błąd tworzenia pliku na Google Drive (${createRes.status})`);
    }

    const createdData = await createRes.json();
    localStorage.setItem('gdrive_last_sync', new Date().toISOString());
    return createdData;
  }
}

// Pobieranie zawartości "centrumdowodzenia.json" z Dysku Google
export async function downloadFromDrive(accessToken) {
  const existingFile = await findDriveFile(accessToken);
  if (!existingFile) {
    throw new Error(`Nie znaleziono pliku ${DRIVE_FILE_NAME} na Twoim Dysku Google.`);
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error('Błąd podczas pobierania pliku z Google Drive.');
  }

  const jsonContent = await res.json();
  localStorage.setItem('gdrive_last_sync', new Date().toISOString());
  return jsonContent;
}

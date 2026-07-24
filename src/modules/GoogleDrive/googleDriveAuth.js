import firebaseConfig from '../../../firebase-applet-config.json';

const CLIENT_ID = firebaseConfig?.oAuthClientId || '228323924605-2j0u6hork1gfcmqu9mnqrqencm89d2qf.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

let cachedAccessToken = localStorage.getItem('gdrive_token') || null;
let cachedUser = null;

try {
  const savedUser = localStorage.getItem('gdrive_user');
  if (savedUser) cachedUser = JSON.parse(savedUser);
} catch (e) {
  cachedUser = null;
}

// Funkcja ładowania skryptu Google Identity Services
const loadGsiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts.oauth2);
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google.accounts.oauth2);
      } else {
        reject(new Error('Nie udało się załadować Google Identity Services'));
      }
    };
    script.onerror = () => reject(new Error('Błąd ładowania skryptu Google GIS'));
    document.body.appendChild(script);
  });
};

export const initAuth = (onAuthSuccess, onAuthFailure) => {
  if (cachedAccessToken && cachedUser) {
    if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
    } else {
        if (onAuthFailure) onAuthFailure();
    }
  return () => {};
};

export const googleSignIn = async () => {
  const googleOauth = await loadGsiScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = googleOauth.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (response) => {
          if (response.error) {
            return reject(new Error(response.error_description || response.error));
          }
          const accessToken = response.access_token;
          cachedAccessToken = accessToken;
          localStorage.setItem('gdrive_token', accessToken);

          // Pobierz informacje o profilu użytkownika Google
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              cachedUser = {
                email: userData.email || 'Konto Google',
                name: userData.name || userData.email,
                picture: userData.picture
              };
            } else {
              cachedUser = { email: 'Konto Google' };
            }
          } catch (e) {
            cachedUser = { email: 'Konto Google' };
          }

          localStorage.setItem('gdrive_user', JSON.stringify(cachedUser));
          resolve({ user: cachedUser, accessToken });
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

export const getAccessToken = () => cachedAccessToken;

export const logoutDrive = async () => {
  if (cachedAccessToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(cachedAccessToken, () => {});
    } catch (e) {
      // Ignoruj błędy odwołania tokena
    }
  }
  cachedAccessToken = null;
  cachedUser = null;
  localStorage.removeItem('gdrive_token');
  localStorage.removeItem('gdrive_user');
};

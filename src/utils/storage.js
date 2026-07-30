function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getKeyFromPin(pin, saltUint8) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltUint8,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPayload(dataObj, pin) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPin(pin, salt);
  const encodedData = enc.encode(JSON.stringify(dataObj));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodedData
  );

  return {
    version: "2.0-encrypted",
    encrypted: true,
    timestamp: new Date().toISOString(),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };
}

export async function decryptPayload(encryptedObj, pin) {
  const dec = new TextDecoder();
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedObj.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedObj.iv));
  const ciphertext = base64ToArrayBuffer(encryptedObj.ciphertext);

  const key = await getKeyFromPin(pin, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr);
}

export function getAppStorageObject() {
  const storageObj = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      storageObj[key] = localStorage.getItem(key);
    }
  }
  return storageObj;
}

export async function createBackupPayload(pin) {
  const currentPin = pin || sessionStorage.getItem('app_pin') || localStorage.getItem('app_user_password') || '123';
  const storageObj = getAppStorageObject();
  const backupData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    storage: storageObj
  };
  return await encryptPayload(backupData, currentPin);
}

export async function restoreFromPayload(importedData, providedPin) {
  let finalStorage = null;
  let usedPin = providedPin || sessionStorage.getItem('app_pin') || localStorage.getItem('app_user_password');

  if (importedData.encrypted || importedData.version === "2.0-encrypted" || importedData.ciphertext) {
    let decryptedObj = null;

    if (usedPin) {
      try {
        decryptedObj = await decryptPayload(importedData, usedPin);
      } catch (e) {
        decryptedObj = null;
      }
    }

    if (!decryptedObj) {
      const promptPin = window.prompt('Dane są zaszyfrowane. Podaj PIN / Hasło do odszyfrowania danych:');
      if (!promptPin) return false;
      try {
        decryptedObj = await decryptPayload(importedData, promptPin);
        usedPin = promptPin;
      } catch (e) {
        alert('❌ Nieprawidłowy PIN / Hasło lub plik jest uszkodzony! Odszyfrowanie nie powiodło się.');
        return false;
      }
    }

    if (decryptedObj && decryptedObj.storage) {
      finalStorage = decryptedObj.storage;
    } else {
      alert('Błędna struktura odszyfrowanych danych!');
      return false;
    }
  } else if (importedData.storage) {
    finalStorage = importedData.storage;
  } else {
    alert('Błąd: Plik nie zawiera poprawnych danych kopii zapasowej.');
    return false;
  }

  if (finalStorage) {
    // Zachowanie aktywnej sesji Google Drive przed czyszczeniem localStorage
    const currentDriveToken = localStorage.getItem('gdrive_access_token');
    const currentDriveExpiry = localStorage.getItem('gdrive_token_expiry');
    const currentDriveEmail = localStorage.getItem('gdrive_user_email');
    const currentDriveClientId = localStorage.getItem('google_drive_client_id');
    const currentDriveAutoSync = localStorage.getItem('gdrive_auto_sync');

    localStorage.clear();
    Object.keys(finalStorage).forEach(key => {
      localStorage.setItem(key, finalStorage[key]);
    });

    // Przywrócenie zachowanej sesji Google Drive, jeśli była aktywna
    if (currentDriveToken) localStorage.setItem('gdrive_access_token', currentDriveToken);
    if (currentDriveExpiry) localStorage.setItem('gdrive_token_expiry', currentDriveExpiry);
    if (currentDriveEmail) localStorage.setItem('gdrive_user_email', currentDriveEmail);
    if (currentDriveClientId) localStorage.setItem('google_drive_client_id', currentDriveClientId);
    if (currentDriveAutoSync) localStorage.setItem('gdrive_auto_sync', currentDriveAutoSync);

    if (usedPin) {
      localStorage.setItem('app_user_password', usedPin);
      sessionStorage.setItem('app_pin', usedPin);
    }
    return { success: true, usedPin };
  }
  return false;
}

export const exportDatabase = async (customPin) => {
  const currentPin = customPin || sessionStorage.getItem('app_pin') || localStorage.getItem('app_user_password') || '123';

  const targetPin = window.prompt(
    'Wprowadź PIN / Hasło, którym chcesz zaszyfrować plik kopii zapasowej:',
    currentPin
  );

  if (!targetPin) return;

  try {
    const encryptedFileObj = await createBackupPayload(targetPin);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(encryptedFileObj, null, 2));
    const downloadAnchor = document.createElement('a');
    const dzisiaj = new Date().toISOString().split('T')[0];

    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `centrumdowodzenia_backup_encrypted_${dzisiaj}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    alert(`🔒 Plik kopii zapasowej został pomyślnie zaszyfrowany!\n\nUżyte hasło/PIN: ${targetPin}\n\nZapamiętaj to hasło, będzie potrzebne przy imporcie.`);
  } catch (e) {
    console.error('Błąd szyfrowania danych:', e);
    alert('Błąd podczas zaszyfrowywania pliku kopii zapasowej!');
  }
};

export const importDatabase = (file, onSuccess, providedPin) => {
  if (!file) return;
  const fileReader = new FileReader();

  fileReader.onload = async () => {
    try {
      const importedData = JSON.parse(fileReader.result);

      if (window.confirm('Czy na pewno chcesz nadpisać obecne dane danymi z pliku?')) {
        const result = await restoreFromPayload(importedData, providedPin);
        if (result && result.success) {
          alert('🔒 Dane zostały pomyślnie odszyfrowane i zaimportowane!');
          if (onSuccess) onSuccess(result.usedPin);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Błąd odczytu pliku JSON! Upewnij się, że plik jest prawidłową (lub zaszyfrowaną) kopią zapasową.');
    }
  };

  fileReader.readAsText(file);
};

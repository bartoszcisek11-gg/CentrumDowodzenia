import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, logoutDrive, getAccessToken } from './googleDriveAuth';

export default function GoogleDriveView() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pliki i nawigacja
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'Mój Dysk' });
  const [folderHistory, setFolderHistory] = useState([{ id: 'root', name: 'Mój Dysk' }]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modale i akcje
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirmFile, setDeleteConfirmFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Inicjalizacja stanu autoryzacji
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Pobieranie plików po zalogowaniu lub zmianie katalogu
  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token, currentFolder.id, searchQuery]);

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      let query = `'${currentFolder.id}' in parents and trashed = false`;
      if (searchQuery.trim()) {
        query = `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink)&pageSize=100&orderBy=folder,name`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.status === 401) {
        setNeedsAuth(true);
        setError('Sesja wygasła. Zaloguj się ponownie.');
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Błąd pobierania plików');
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Błąd pobierania z Google Drive:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setNeedsAuth(false);
      }
    } catch (err) {
      setError('Logowanie nie powiodło się: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await logoutDrive();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setFiles([]);
  };

  const handleOpenFolder = (folder) => {
    setSearchQuery('');
    const newHistory = [...folderHistory, { id: folder.id, name: folder.name }];
    setFolderHistory(newHistory);
    setCurrentFolder({ id: folder.id, name: folder.name });
  };

  const handleNavigateBreadcrumb = (index) => {
    setSearchQuery('');
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolder(newHistory[newHistory.length - 1]);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolder.id]
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Nie udało się utworzyć folderu');
      }

      setNewFolderName('');
      setIsNewFolderModalOpen(false);
      await fetchFiles();
    } catch (err) {
      alert('Błąd tworzenia folderu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress(`Wysyłanie ${file.name}...`);
    try {
      const metadata = {
        name: file.name,
        parents: [currentFolder.id]
      };

      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      formData.append('file', file);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Błąd wysyłania pliku');
      }

      setUploadProgress(null);
      fetchFiles();
    } catch (err) {
      alert('Błąd wysyłania pliku: ' + err.message);
      setUploadProgress(null);
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteConfirmFile) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${deleteConfirmFile.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok && res.status !== 204) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Błąd usuwania pliku');
      }

      setDeleteConfirmFile(null);
      await fetchFiles();
    } catch (err) {
      alert('Nie udało się usunąć: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pomocnicze ikony dla typów plików
  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/vnd.google-apps.folder') return '📁';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📄';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📙';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '-';
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    if (num < 1024 * 1024 * 1024) return (num / (1024 * 1024)).toFixed(1) + ' MB';
    return (num / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  if (needsAuth) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>📁</div>
        <h2 style={{ color: '#00f2ff', marginBottom: '10px' }}>Google Drive</h2>
        <p style={{ color: '#8b949e', marginBottom: '25px', lineHeight: '1.5' }}>
          Zaloguj się ze swoim kontem Google, aby przeglądać, wysyłać i zarządzać plikami z Google Drive bezpośrednio w Centrum Dowodzenia.
        </p>

        {error && (
          <div style={{ padding: '10px', backgroundColor: 'rgba(248, 81, 73, 0.1)', border: '1px solid #f85149', borderRadius: '6px', color: '#f85149', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
            color: '#1f1f1f',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          Zaloguj przez Google
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '24px', position: 'relative' }}>
      {/* Pasek Górny */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="32" height="32" viewBox="0 0 87.3 78" style={{ display: 'inline-block' }}>
            <path fill="#FFC107" d="M28.6 0L0 49.5l14.3 24.8L42.9 24.8z"/>
            <path fill="#00AC47" d="M14.3 74.3h57.2l14.3-24.8H28.6z"/>
            <path fill="#0066DA" d="M28.6 0l14.3 24.8h42.9L71.5 0z"/>
          </svg>
          <div>
            <h2 style={{ margin: 0, color: '#00f2ff', fontSize: '1.4rem' }}>Google Drive</h2>
            {user && (
              <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>
                Zalogowano jako: <strong>{user.email}</strong>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="btn-global-io"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📁 Nowy folder
          </button>

          <label className="btn-orto-action" style={{ cursor: 'pointer', margin: 0 }}>
            📤 Wyślij plik
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#21262d',
              color: '#f85149',
              border: '1px solid #363b42',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            Odłącz Drive
          </button>
        </div>
      </div>

      {/* Pasek Wyszukiwania i Ścieżka (Breadcrumb) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Ścieżka Katalogów */}
        <div style={{ display: 'flex', itemsAlign: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.95rem' }}>
          {folderHistory.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              {idx > 0 && <span style={{ color: '#8b949e' }}>/</span>}
              <button
                onClick={() => handleNavigateBreadcrumb(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === folderHistory.length - 1 ? '#00f2ff' : '#8b949e',
                  fontWeight: idx === folderHistory.length - 1 ? '700' : '400',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Wyszukiwarka */}
        <div style={{ minWidth: '250px' }}>
          <input
            type="text"
            placeholder="🔍 Szukaj plików na Dysku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              backgroundColor: '#0b0e14',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {uploadProgress && (
        <div style={{ padding: '10px 15px', backgroundColor: 'rgba(0, 242, 255, 0.1)', border: '1px solid #00f2ff', borderRadius: '8px', color: '#00f2ff', marginBottom: '15px' }}>
          ⏳ {uploadProgress}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 15px', backgroundColor: 'rgba(248, 81, 73, 0.1)', border: '1px solid #f85149', borderRadius: '8px', color: '#f85149', marginBottom: '15px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Lista Plików */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
          🔄 Ładowanie zawartości Google Drive...
        </div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#8b949e' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📭</span>
          Ten folder jest pusty lub nie znaleziono dopasowanych plików.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: '#8b949e' }}>
                <th style={{ padding: '12px 8px' }}>Nazwa</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>Rozmiar</th>
                <th style={{ padding: '12px 8px', width: '150px' }}>Zmodyfikowano</th>
                <th style={{ padding: '12px 8px', width: '140px', textAlign: 'right' }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                return (
                  <tr
                    key={file.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="drive-row"
                  >
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{getFileIcon(file.mimeType)}</span>
                        {isFolder ? (
                          <button
                            onClick={() => handleOpenFolder(file)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textAlign: 'left',
                              padding: 0
                            }}
                          >
                            {file.name}
                          </button>
                        ) : (
                          <span style={{ color: '#ffffff', fontWeight: '500' }}>{file.name}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8b949e' }}>
                      {formatFileSize(file.size)}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8b949e' }}>
                      {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('pl-PL') : '-'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-global-io"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', textDecoration: 'none' }}
                            title="Otwórz na Google Drive"
                          >
                            👁️
                          </a>
                        )}

                        <button
                          onClick={() => setDeleteConfirmFile(file)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'rgba(248, 81, 73, 0.15)',
                            color: '#f85149',
                            border: '1px solid #f85149',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Usuń plik z Dysku"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tworzenia folderu */}
      {isNewFolderModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ marginTop: 0, color: '#00f2ff' }}>📁 Nowy folder</h3>
            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#8b949e', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Nazwa folderu:
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="np. Dokumenty Medyczne"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0b0e14',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#21262d',
                    color: '#c9d1d9',
                    border: '1px solid #363b42',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="btn-orto-action"
                  disabled={!newFolderName.trim()}
                >
                  Utwórz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Potwierdzenia Usunięcia (Wymagany w zasadach bezpieczeństwa Workspace) */}
      {deleteConfirmFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '24px', border: '1px solid #f85149' }}>
            <h3 style={{ marginTop: 0, color: '#f85149' }}>⚠️ Potwierdzenie Usunięcia</h3>
            <p style={{ color: '#c9d1d9', lineHeight: '1.5' }}>
              Czy na pewno chcesz usunąć <strong>{deleteConfirmFile.name}</strong> z Google Drive?
            </p>
            <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>
              Operacja zostanie wykonana na Twoim koncie Google Drive.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmFile(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #363b42',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDeleteFile}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f85149',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Usuń plik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

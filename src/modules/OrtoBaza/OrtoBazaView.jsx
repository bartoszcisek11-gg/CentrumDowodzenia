import React, { useState, useEffect, useRef } from 'react';

const initialArticles = [
  {
    id: 1,
    title: "Uszkodzenie więzadła krzyżowego przedniego (ACL)",
    category: "Uraz",
    summary: "Mechanizm skrętny, diagnostyka MR, rekonstrukcja.",
    content: "**Mechanizm urazu:**\nNajczęściej mechanizm skrętny, np. lądowanie z rotacją w stawie kolanowym.\n\nPoniżej schemat anatomii kolana z widocznym ACL:\n[IMG:https://upload.wikimedia.org/wikipedia/commons/e/e1/Knee_diagram.svg]\n\n**Diagnostyka:**\n1. Testy fizykalne: Lachman (najczulszy), szuflada przednia, Pivot-shift.\n2. MR: Standard potwierdzający.\n\n**Leczenie:**\n- Operacyjne: Rekonstrukcja (autograft z ST/G lub BTB).\n- Zachowawcze: Fizjoterapia u osób mniej aktywnych."
  }
];

const defaultTiles = [
  {
    id: 'AO',
    title: 'AO Reference',
    icon: '🌐'
  },
  {
    id: 'DOCS',
    title: 'Dokumenty',
    icon: '📄'
  },
  {
    id: 'NOTES',
    title: 'Notatki & Wpisy',
    icon: '📝'
  }
];

export default function OrtoBazaView() {
  // Kontrola widoku (MENU vs NOTATKI)
  const [currentView, setCurrentView] = useState('MENU');

  // Stany dla efektu hover na przyciskach
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isAddHovered, setIsAddHovered] = useState(false);

  // Kolejność Kafelków Menu (Drag and Drop)
  const [tilesOrder, setTilesOrder] = useState(() => {
    return JSON.parse(localStorage.getItem('orto_baza_tiles_order')) || defaultTiles;
  });

  const [draggedTileIndex, setDraggedTileIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [articles, setArticles] = useState(() => {
    return JSON.parse(localStorage.getItem('ortho_articles_pro')) || initialArticles;
  });

  // Stan Notatnika OrtoBazy (Współdzielony między AO a kafelkiem Notatki)
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('orto_baza_notes') || '';
  });

  // Stan Własnych Dokumentów / Zaświadczeń
  const [docs, setDocs] = useState(() => {
    return JSON.parse(localStorage.getItem('orto_baza_custom_docs')) || [];
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  // Stan Modala Edytora Artykułów
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Uraz');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');

  // Stan Modala AO Surgery Reference
  const [isAoModalOpen, setIsAoModalOpen] = useState(false);

  // Stan Modala Dokumentów / Zaświadczeń
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);
  const [docFormTitle, setDocFormTitle] = useState('');
  const [docFormHtml, setDocFormHtml] = useState('');
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);

  const editorRef = useRef(null);

  // Obsługa Klawisza ESCAPE krok po kroku we wszystkich częściach OrtoBazy
  useEffect(() => {
    const handleKeyDownEsc = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {

        // 1. Jeśli otwarty jest edytor wewn. dokumentu -> zamknij edytor
        if (isDocFormOpen) {
          e.stopPropagation();
          setIsDocFormOpen(false);
          return;
        }

        // 2. Jeśli otwarty jest modal edytora wpisu/notatki -> zamknij go
        if (isModalOpen) {
          e.stopPropagation();
          setIsModalOpen(false);
          return;
        }

        // 3. Jeśli otwarte jest okno Dokumenty -> zamknij je i wróć do menu
        if (isDocsModalOpen) {
          e.stopPropagation();
          setIsDocsModalOpen(false);
          return;
        }

        // 4. Jeśli otwarte jest okno AO Reference -> zamknij je i wróć do menu
        if (isAoModalOpen) {
          e.stopPropagation();
          setIsAoModalOpen(false);
          return;
        }

        // 5. Jeśli otwarty jest szczegółowy widok posta/artykułu -> cofnij do listy notatek
        if (selectedArticleId !== null) {
          e.stopPropagation();
          setSelectedArticleId(null);
          return;
        }

        // 6. Jeśli jesteśmy w widoku Notatki & Wpisy -> cofnij do głównego menu OrtoBazy
        if (currentView === 'NOTATKI') {
          e.stopPropagation();
          setCurrentView('MENU');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDownEsc, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDownEsc, true);
    };
  }, [
    isDocFormOpen, 
    isModalOpen, 
    isDocsModalOpen, 
    isAoModalOpen, 
    selectedArticleId, 
    currentView
  ]);

  useEffect(() => {
    localStorage.setItem('ortho_articles_pro', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('orto_baza_notes', notes);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('orto_baza_custom_docs', JSON.stringify(docs));
  }, [docs]);

  useEffect(() => {
    localStorage.setItem('orto_baza_tiles_order', JSON.stringify(tilesOrder));
  }, [tilesOrder]);

  // Synchronizacja treści edytora HTML przy otwarciu
  useEffect(() => {
    if (isDocFormOpen && editorRef.current) {
      editorRef.current.innerHTML = docFormHtml;
    }
  }, [isDocFormOpen]);

  // Obsługa Drag and Drop Kafelków
  const handleDragStart = (e, index) => {
    setDraggedTileIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedTileIndex === null || draggedTileIndex === index) return;

    const newTiles = [...tilesOrder];
    const draggedTile = newTiles[draggedTileIndex];
    newTiles.splice(draggedTileIndex, 1);
    newTiles.splice(index, 0, draggedTile);

    setDraggedTileIndex(index);
    setTilesOrder(newTiles);
  };

  const handleDragEnd = () => {
    setDraggedTileIndex(null);
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleTileClick = (tileId) => {
    if (isDragging) return;

    if (tileId === 'AO') {
      setIsAoModalOpen(true);
    } else if (tileId === 'DOCS') {
      setIsDocsModalOpen(true);
    } else if (tileId === 'NOTES') {
      setCurrentView('NOTATKI');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      const newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
      setFormContent(newText);

      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = end + 2;
      }, 0);
    }
  };

  // Obsługa Tab jako akapitu w edytorze Worda
  const handleEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'Uraz': return { bg: '#3b1719', color: '#ff7875', border: '#7c2d12' };
      case 'Zwyrodnienie': return { bg: '#3a2711', color: '#ffc069', border: '#78350f' };
      case 'Pediatria': return { bg: '#092b21', color: '#82e0aa', border: '#065f46' };
      case 'Wytyczne': return { bg: '#0a2540', color: '#73d13d', border: '#1e3a8a' };
      default: return { bg: '#1c2638', color: '#94a3b8', border: '#334155' };
    }
  };

  const parseContentExact = (text) => {
    if (!text) return '';
    let clean = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00f2ff; font-weight: 700;">$1</strong>');

    const imgRegex = /\[IMG:(https?:\/\/[^\]]+)\]/g;
    clean = clean.replace(imgRegex, (match, url) => {
      return `<img src="${url}" alt="Grafika" style="display:block; margin: 1.5rem auto; max-width: 100%; border-radius: 12px; border: 1px solid #1c2b3d; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />`;
    });

    return clean.replace(/\r\n|\r|\n/g, '<br>');
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('Uraz');
    setFormSummary('');
    setFormContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (art, e) => {
    if (e) e.stopPropagation();
    setEditingId(art.id);
    setFormTitle(art.title);
    setFormCategory(art.category);
    setFormSummary(art.summary || '');
    setFormContent(art.content || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      setArticles(prev => prev.filter(a => a.id !== id));
      if (selectedArticleId === id) setSelectedArticleId(null);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingId) {
      setArticles(prev => prev.map(a => a.id === editingId ? {
        ...a,
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        content: formContent
      } : a));
    } else {
      const newArt = {
        id: Date.now(),
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        content: formContent
      };
      setArticles(prev => [newArt, ...prev]);
    }
    setIsModalOpen(false);
  };

  // Komendy Edytora W stylu Worda
  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDocFormHtml(editorRef.current.innerHTML);
    }
  };

  // Obsługa Własnych Dokumentów
  const handleSaveDoc = (e) => {
    e.preventDefault();
    const content = editorRef.current ? editorRef.current.innerHTML : docFormHtml;
    if (!content.trim() || content === '<br>') return;

    let finalTitle = docFormTitle.trim();
    if (!finalTitle) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.innerText.trim();
      finalTitle = plainText.split('\n')[0].substring(0, 45) || 'Dokument bez tytułu';
    }

    if (editingDocId) {
      setDocs(prev => prev.map(d => d.id === editingDocId ? { ...d, title: finalTitle, content, date: new Date().toLocaleDateString('pl-PL') } : d));
    } else {
      setDocs(prev => [{ id: Date.now(), title: finalTitle, content, date: new Date().toLocaleDateString('pl-PL') }, ...prev]);
    }
    setIsDocFormOpen(false);
    setDocFormTitle('');
    setDocFormHtml('');
    setEditingDocId(null);
  };

  const handleEditDoc = (doc) => {
    setEditingDocId(doc.id);
    setDocFormTitle(doc.title);
    setDocFormHtml(doc.content);
    setIsDocFormOpen(true);
  };

  const handleDeleteDoc = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten dokument?')) {
      setDocs(prev => prev.filter(d => d.id !== id));
    }
  };

  const handlePrintDoc = (doc) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title></title>
          <style>
            @page { 
              size: A4;
              margin: 0; 
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
              }
            }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 20mm; 
              margin: 0;
              color: #000000; 
              line-height: 1.6; 
              font-size: 12pt; 
              box-sizing: border-box;
            }
            .content { width: 100%; }
            p { margin: 0 0 10px 0; }
          </style>
        </head>
        <body>
          <div class="content">${doc.content}</div>
          <script>
            window.onload = function() { 
              window.print(); 
              window.close(); 
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredArticles = articles.filter(a => {
    const textToSearch = (a.title + (a.summary || '') + (a.content || '')).toLowerCase();
    const matchesSearch = textToSearch.includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(docSearch.toLowerCase()) || 
    d.content.toLowerCase().includes(docSearch.toLowerCase())
  );

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  return (
    <div style={{ color: '#f5f6fa' }}>
      {/* Pasek Tytułowy Modułu */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {currentView === 'NOTATKI' && (
            <>
              {/* Przycisk Wróć z efektami podświetlenia (Hover) */}
              <button
                onClick={() => { setCurrentView('MENU'); setSelectedArticleId(null); }}
                onMouseEnter={() => setIsBackHovered(true)}
                onMouseLeave={() => setIsBackHovered(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: isBackHovered ? '#1c2b3d' : '#111622',
                  color: isBackHovered ? '#ffffff' : '#94a3b8',
                  border: isBackHovered ? '1px solid #00f2ff' : '1px solid #1c2b3d',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isBackHovered ? '0 0 12px rgba(0, 242, 255, 0.2)' : 'none'
                }}
              >
                ⬅️ Wróć do Menu
              </button>

              {/* Przycisk Dodaj Wpis z efektami podświetlenia (Hover) */}
              <button
                onClick={openCreateModal}
                onMouseEnter={() => setIsAddHovered(true)}
                onMouseLeave={() => setIsAddHovered(false)}
                style={{
                  padding: '10px 20px',
                  background: isAddHovered 
                    ? 'linear-gradient(90deg, #00f2ff 0%, #38ef7d 100%)' 
                    : 'linear-gradient(90deg, #00d2ff 0%, #00f2ff 100%)',
                  color: '#0b0e14',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: isAddHovered ? '0 0 20px rgba(0, 242, 255, 0.6)' : '0 0 15px rgba(0, 242, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  transform: isAddHovered ? 'translateY(-1px)' : 'none'
                }}
              >
                + Dodaj wpis
              </button>
            </>
          )}
        </div>
      </div>

      {/* WIDOK GŁÓWNEGO MENU (3 Kafelki z Drag & Drop - Same tytuły) */}
      {currentView === 'MENU' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '20px' }}>
          {tilesOrder.map((tile, index) => (
            <div
              key={tile.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleTileClick(tile.id)}
              style={{
                backgroundColor: '#111622',
                border: draggedTileIndex === index ? '2px dashed #00f2ff' : '1px solid #1c2b3d',
                borderRadius: '16px',
                padding: '50px 20px',
                cursor: 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                transition: 'transform 0.15s ease, border-color 0.2s ease',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                opacity: draggedTileIndex === index ? 0.5 : 1,
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (draggedTileIndex === null) e.currentTarget.style.borderColor = '#00f2ff';
              }}
              onMouseLeave={(e) => {
                if (draggedTileIndex === null) e.currentTarget.style.borderColor = '#1c2b3d';
              }}
            >
              <span style={{ fontSize: '4rem', marginBottom: '16px', pointerEvents: 'none' }}>{tile.icon}</span>
              <h2 style={{ color: '#00f2ff', margin: 0, fontSize: '1.6rem', pointerEvents: 'none' }}>{tile.title}</h2>
            </div>
          ))}
        </div>
      )}

      {/* WIDOK: NOTATKI & WPISY */}
      {currentView === 'NOTATKI' && (
        <>
          {!selectedArticleId ? (
            <div>
              {/* Filtry i Wyszukiwarka */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Szukaj (np. objawy, AO, leczenie)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: '1px solid #1c2b3d',
                    backgroundColor: '#111622',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: '1px solid #1c2b3d',
                    backgroundColor: '#111622',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">Wszystkie kategorie</option>
                  <option value="Uraz">Uraz / Złamanie</option>
                  <option value="Zwyrodnienie">Choroba zwyrodnieniowa</option>
                  <option value="Pediatria">Ortopedia dziecięca</option>
                  <option value="Wytyczne">Wytyczne</option>
                  <option value="Inne">Inne</option>
                </select>
              </div>

              {/* SZYBKI NOTATNIK (SYNCHRONIZOWANY) */}
              <div style={{ backgroundColor: '#111622', border: '1px solid #1c2b3d', borderRadius: '12px', padding: '16px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#00f2ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📝 Szybkie Notatki (Zsynchronizowane z AO)
                  </span>
                </div>
                <textarea
                  rows="3"
                  placeholder="Wpisz szybkie uwagi, przypomnienia ortopedyczne..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0e14',
                    border: '1px solid #1c2b3d',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Grid z Kartami */}
              {filteredArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#111622', borderRadius: '12px', border: '1px solid #1c2b3d', color: '#52677d' }}>
                  Baza jest pusta lub brak wyników spełniających kryteria.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredArticles.map(art => {
                    const badge = getCategoryBadgeStyle(art.category);
                    return (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticleId(art.id)}
                        className="tile"
                        style={{
                          backgroundColor: '#111622',
                          border: '1px solid #1c2b3d',
                          borderRadius: '12px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}>
                              {art.category}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={(e) => openEditModal(art, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} title="Edytuj">✏️</button>
                              <button onClick={(e) => handleDelete(art.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#ff4d4f' }} title="Usuń">&times;</button>
                            </div>
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: art.summary ? '8px' : '16px', lineHeight: '1.4' }}>
                            {art.title}
                          </h3>
                          {art.summary && (
                            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '15px' }}>
                              {art.summary}
                            </p>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#00f2ff', paddingTop: '12px', borderTop: '1px solid #1c2b3d' }}>
                          Otwórz →
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* WIDOK 2: SZCZEGÓŁY WPISU */
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button
                  onClick={() => setSelectedArticleId(null)}
                  style={{ background: 'none', border: 'none', color: '#00f2ff', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  ← Powrót do listy
                </button>
                <button
                  onClick={(e) => openEditModal(selectedArticle, e)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1c2b3d',
                    color: '#fff',
                    border: '1px solid #2c3e55',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✏️ Edytuj
                </button>
              </div>

              <article style={{ backgroundColor: '#111622', border: '1px solid #1c2b3d', borderRadius: '16px', padding: '35px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ borderBottom: '1px solid #1c2b3d', paddingBottom: '20px', marginBottom: '25px' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    ...getCategoryBadgeStyle(selectedArticle.category)
                  }}>
                    {selectedArticle.category}
                  </span>
                  <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: selectedArticle.summary ? '10px' : '0' }}>
                    {selectedArticle.title}
                  </h1>
                  {selectedArticle.summary && (
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                      {selectedArticle.summary}
                    </p>
                  )}
                </div>

                <div
                  style={{ fontSize: '1rem', lineHeight: '1.7', color: '#e2e8f0' }}
                  dangerouslySetInnerHTML={{ __html: parseContentExact(selectedArticle.content) }}
                />
              </article>
            </div>
          )}
        </>
      )}

      {/* MODAL DOKUMENTY I ZAŚWIADCZENIA DO DRUKU Z EDYTOREM WORDA */}
      {isDocsModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 14, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#111622',
            border: '1px solid #00f2ff',
            borderRadius: '16px',
            maxWidth: '1200px',
            width: '100%',
            height: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0, 242, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1c2b3d', backgroundColor: '#0b0e14' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>Moje Dokumenty i Zaświadczenia</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setEditingDocId(null);
                    setDocFormTitle('');
                    setDocFormHtml('');
                    setIsDocFormOpen(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#00f2ff',
                    color: '#0b0e14',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  + Nowy Dokument / Zaświadczenie
                </button>
                <button
                  onClick={() => setIsDocsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#52677d', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <input
                type="text"
                placeholder="Szukaj dokumentu po nazwie lub treści..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #1c2b3d',
                  backgroundColor: '#0b0e14',
                  color: '#fff',
                  outline: 'none',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}
              />

              {isDocFormOpen && (
                <form onSubmit={handleSaveDoc} style={{ backgroundColor: '#0b0e14', padding: '20px', borderRadius: '12px', border: '1px solid #00f2ff', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4 style={{ margin: 0, color: '#00f2ff' }}>{editingDocId ? 'Edytuj dokument' : 'Stwórz nowy dokument / zaświadczenie'}</h4>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#52677d', marginBottom: '6px' }}>
                      Nazwa dokumentu / zaświadczenia
                    </label>
                    <input
                      type="text"
                      placeholder="np. Zaświadczenie lekarskie - Jan Kowalski"
                      value={docFormTitle}
                      onChange={(e) => setDocFormTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #1c2b3d',
                        backgroundColor: '#111622',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px', backgroundColor: '#111622', borderRadius: '8px', border: '1px solid #1c2b3d' }}>
                    <button type="button" onClick={() => executeCommand('bold')} style={toolbarButtonStyle} title="Pogrubienie"><b>B</b></button>
                    <button type="button" onClick={() => executeCommand('italic')} style={toolbarButtonStyle} title="Kursywa"><i>I</i></button>
                    <button type="button" onClick={() => executeCommand('underline')} style={toolbarButtonStyle} title="Podkreślenie"><u>U</u></button>
                    <button type="button" onClick={() => executeCommand('strikeThrough')} style={toolbarButtonStyle} title="Przekreślenie"><s>S</s></button>
                    
                    <div style={{ width: '1px', backgroundColor: '#1c2b3d', margin: '0 4px' }} />

                    <button type="button" onClick={() => executeCommand('justifyLeft')} style={toolbarButtonStyle} title="Wyrównaj do lewej">⬅️ Do lewej</button>
                    <button type="button" onClick={() => executeCommand('justifyCenter')} style={toolbarButtonStyle} title="Wyśrodkuj">↔️ Do środka</button>
                    <button type="button" onClick={() => executeCommand('justifyRight')} style={toolbarButtonStyle} title="Wyrównaj do prawej">➡️ Do prawej</button>
                    <button type="button" onClick={() => executeCommand('justifyFull')} style={toolbarButtonStyle} title="Wyjustuj">↕️ Wyjustuj</button>

                    <div style={{ width: '1px', backgroundColor: '#1c2b3d', margin: '0 4px' }} />

                    <button type="button" onClick={() => executeCommand('insertUnorderedList')} style={toolbarButtonStyle} title="Lista punktowana">• Lista</button>
                    <button type="button" onClick={() => executeCommand('insertOrderedList')} style={toolbarButtonStyle} title="Lista numerowana">1. Lista</button>
                    <button type="button" onClick={() => executeCommand('removeFormat')} style={toolbarButtonStyle} title="Usuń formatowanie">🧹 Czysty</button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    onKeyDown={handleEditorKeyDown}
                    onInput={(e) => setDocFormHtml(e.currentTarget.innerHTML)}
                    style={{
                      width: '100%',
                      minHeight: '320px',
                      maxHeight: '450px',
                      overflowY: 'auto',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      padding: '25px',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: '12pt',
                      lineHeight: '1.6',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsDocFormOpen(false)}
                      style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #1c2b3d', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 20px', backgroundColor: '#00f2ff', color: '#0b0e14', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Zapisz Dokument
                    </button>
                  </div>
                </form>
              )}

              {filteredDocs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#52677d', padding: '50px 20px', border: '1px dashed #1c2b3d', borderRadius: '12px' }}>
                  Brak stworzonych dokumentów. Kliknij <b>"+ Nowy Dokument / Zaświadczenie"</b> powyżej, aby napisać pierwsze pismo.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                  {filteredDocs.map(doc => (
                    <div key={doc.id} style={{ backgroundColor: '#0b0e14', border: '1px solid #1c2b3d', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: '700' }}>{doc.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: '#52677d' }}>Utworzono: {doc.date}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditDoc(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} title="Edytuj">✏️</button>
                            <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#ff4d4f' }} title="Usuń">&times;</button>
                          </div>
                        </div>

                        <div 
                          dangerouslySetInnerHTML={{ __html: doc.content }}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            borderRadius: '8px',
                            padding: '14px',
                            fontSize: '0.85rem',
                            fontFamily: "'Times New Roman', Times, serif",
                            maxHeight: '180px',
                            overflowY: 'auto',
                            marginBottom: '15px'
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handlePrintDoc(doc)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#1c2b3d',
                          color: '#00f2ff',
                          border: '1px solid #00f2ff',
                          borderRadius: '8px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        🖨️ Drukuj / Zapisz jako PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AO SURGERY REFERENCE Z NOTATNIKIEM */}
      {isAoModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 14, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#111622',
            border: '1px solid #00f2ff',
            borderRadius: '16px',
            maxWidth: '1600px',
            width: '100%',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0, 242, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1c2b3d', backgroundColor: '#0b0e14' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>AO Surgery Reference & Notatnik</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <a
                  href="https://surgeryreference.aofoundation.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#00f2ff', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}
                >
                  Otwórz w nowej karcie ↗
                </a>
                <button
                  onClick={() => setIsAoModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#52677d', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, backgroundColor: '#fff' }}>
                <iframe
                  src="https://surgeryreference.aofoundation.org/"
                  title="AO Surgery Reference"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              <div style={{ width: '340px', backgroundColor: '#0b0e14', borderLeft: '1px solid #1c2b3d', display: 'flex', flexDirection: 'column', padding: '16px' }}>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>📝</span>
                  <h4 style={{ margin: 0, color: '#00f2ff', fontSize: '0.95rem', fontWeight: '700' }}>Notatki</h4>
                </div>
                <textarea
                  placeholder="Rób notatki podczas przeglądania AO..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    backgroundColor: '#111622',
                    border: '1px solid #1c2b3d',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#52677d', marginTop: '8px', textAlign: 'center' }}>
                  Zapisano automatycznie w OrtoBazie
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYTORA / NOWEGO WPISU */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 14, 20, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#111622',
            border: '1px solid #1c2b3d',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c2b3d', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#00f2ff', fontWeight: '700' }}>
                {editingId ? 'Edytuj wpis' : 'Dodaj nową jednostkę'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#52677d', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ backgroundColor: '#09202a', border: '1px solid #00f2ff', color: '#a5f3fc', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
              <strong>💡 Podpowiedź formatowania:</strong><br />
              • <b>Pogrubienie:</b> otocz tekst dwiema gwiazdkami np. <code style={{ backgroundColor: '#111622', padding: '2px 6px', borderRadius: '4px' }}>**tekst**</code> lub zaznacz i wciśnij <code style={{ backgroundColor: '#111622', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+B</code><br />
              • <b>Grafika:</b> wklej <code style={{ backgroundColor: '#111622', padding: '2px 6px', borderRadius: '4px' }}>[IMG:link_do_zdjecia]</code>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#52677d', marginBottom: '6px' }}>Tytuł / Nazwa jednostki</label>
                  <input
                    type="text"
                    required
                    placeholder="np. Złamanie szyjki kości udowej"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1c2b3d', backgroundColor: '#0b0e14', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#52677d', marginBottom: '6px' }}>Kategoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1c2b3d', backgroundColor: '#0b0e14', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="Uraz">Uraz / Złamanie</option>
                    <option value="Zwyrodnienie">Choroba zwyrodnieniowa</option>
                    <option value="Pediatria">Ortopedia dziecięca</option>
                    <option value="Wytyczne">Wytyczne</option>
                    <option value="Inne">Inne</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#52677d', marginBottom: '6px' }}>Krótkie podsumowanie (opcjonalnie)</label>
                <input
                  type="text"
                  placeholder="np. Klasyfikacja Garden, wskazania operacyjne..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1c2b3d', backgroundColor: '#0b0e14', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#52677d', marginBottom: '6px' }}>Treść wpisu</label>
                <textarea
                  rows="12"
                  required
                  placeholder="Wpisz treść..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #1c2b3d', backgroundColor: '#0b0e14', color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.6', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #1c2b3d' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #1c2b3d', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', background: 'linear-gradient(90deg, #00d2ff 0%, #00f2ff 100%)', border: 'none', color: '#0b0e14', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styl pomocniczy dla przycisków edytora Word
const toolbarButtonStyle = {
  padding: '6px 10px',
  backgroundColor: '#1c2b3d',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
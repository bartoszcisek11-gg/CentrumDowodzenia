import React, { useState, useEffect } from 'react';

const initialArticles = [
  {
    id: 1,
    title: "Uszkodzenie więzadła krzyżowego przedniego (ACL)",
    category: "Uraz",
    summary: "Mechanizm skrętny, diagnostyka MR, rekonstrukcja.",
    content: "**Mechanizm urazu:**\nNajczęściej mechanizm skrętny, np. lądowanie z rotacją w stawie kolanowym.\n\nPoniżej schemat anatomii kolana z widocznym ACL:\n[IMG:https://upload.wikimedia.org/wikipedia/commons/e/e1/Knee_diagram.svg]\n\n**Diagnostyka:**\n1. Testy fizykalne: Lachman (najczulszy), szuflada przednia, Pivot-shift.\n2. MR: Standard potwierdzający.\n\n**Leczenie:**\n- Operacyjne: Rekonstrukcja (autograft z ST/G lub BTB).\n- Zachowawcze: Fizjoterapia u osób mniej aktywnych."
  }
];

export default function OrtoBazaView() {
  const [articles, setArticles] = useState(() => {
    return JSON.parse(localStorage.getItem('ortho_articles_pro')) || initialArticles;
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  // Stan Modala Edytora
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Uraz');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');

  // Stan Modala AO Surgery Reference
  const [isAoModalOpen, setIsAoModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ortho_articles_pro', JSON.stringify(articles));
  }, [articles]);

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

  const filteredArticles = articles.filter(a => {
    const textToSearch = (a.title + (a.summary || '') + (a.content || '')).toLowerCase();
    const matchesSearch = textToSearch.includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  return (
    <div style={{ color: '#f5f6fa' }}>
      {/* Pasek Tytułowy Modułu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setSelectedArticleId(null)}>
          <span style={{ fontSize: '2rem' }}>🦴</span>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', fontWeight: '800' }}>
            Orto<span style={{ color: '#00f2ff' }}>Baza</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Przycisk AO Surgery Reference */}
          <button
            onClick={() => setIsAoModalOpen(true)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#111622',
              color: '#00f2ff',
              border: '1px solid #00f2ff',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            🌐 AO Reference
          </button>

          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(90deg, #00d2ff 0%, #00f2ff 100%)',
              color: '#0b0e14',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 242, 255, 0.3)'
            }}
          >
            + Dodaj wpis
          </button>
        </div>
      </div>

      {/* WIDOK 1: LISTA WPISÓW */}
      {!selectedArticleId ? (
        <div>
          {/* Filtry i Wyszukiwarka */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
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
              ← Powrót do bazy
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

      {/* MODAL AO SURGERY REFERENCE */}
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
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>AO Surgery Reference</h3>
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

            <div style={{ flex: 1, backgroundColor: '#fff' }}>
              <iframe
                src="https://surgeryreference.aofoundation.org/"
                title="AO Surgery Reference"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
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
import React, { useState, useEffect } from 'react';
import { dodajDniRobocze, policzDniRoboczeMiedzy, formatujDate } from '../../utils/dateUtils';

export default function StazView({ onOpenModal }) {
  const [daneStaz, setDaneStaz] = useState(() => {
    return JSON.parse(localStorage.getItem('stazData')) || {
      startDate: new Date().toISOString().split('T')[0],
      staze: [],
      notatki: ''
    };
  });

  const [nazwaStazu, setNazwaStazu] = useState('');
  const [tygodnieStazu, setTygodnieStazu] = useState(1);
  const [dniStazu, setDniStazu] = useState(0);

  const [evInputs, setEvInputs] = useState({});

  useEffect(() => {
    localStorage.setItem('stazData', JSON.stringify(daneStaz));
  }, [daneStaz]);

  const handleDateChange = (e) => {
    setDaneStaz(prev => ({ ...prev, startDate: e.target.value }));
  };

  const handleNotesChange = (e) => {
    setDaneStaz(prev => ({ ...prev, notatki: e.target.value }));
  };

  const dodajStaz = () => {
    if (!nazwaStazu.trim()) { alert('Wpisz nazwę stażu.'); return; }
    if (tygodnieStazu === 0 && dniStazu === 0) { alert('Staż musi trwać przynajmniej 1 dzień lub 1 tydzień.'); return; }

    setDaneStaz(prev => ({
      ...prev,
      staze: [
        ...prev.staze,
        { id: Date.now(), nazwa: nazwaStazu.trim(), tygodnie: Number(tygodnieStazu), dni: Number(dniStazu), zdarzenia: [] }
      ]
    }));

    setNazwaStazu('');
    setTygodnieStazu(1);
    setDniStazu(0);
  };

  const usunStaz = (id) => {
    setDaneStaz(prev => ({ ...prev, staze: prev.staze.filter(s => s.id !== id) }));
  };

  const dodajZdarzenie = (stazId) => {
    const input = evInputs[stazId] || { nazwa: '', dni: 1, typ: 'urlop' };
    if (!input.nazwa?.trim() || input.dni < 1) {
      alert('Wpisz opis i podaj prawidłową liczbę dni.');
      return;
    }

    setDaneStaz(prev => ({
      ...prev,
      staze: prev.staze.map(s => {
        if (s.id === stazId) {
          return {
            ...s,
            zdarzenia: [...s.zdarzenia, { id: Date.now(), nazwa: input.nazwa.trim(), dni: Number(input.dni), typ: input.typ }]
          };
        }
        return s;
      })
    }));

    setEvInputs(prev => ({ ...prev, [stazId]: { nazwa: '', dni: 1, typ: 'urlop' } }));
  };

  const usunZdarzenie = (stazId, zdarzenieId) => {
    setDaneStaz(prev => ({
      ...prev,
      staze: prev.staze.map(s => {
        if (s.id === stazId) {
          return { ...s, zdarzenia: s.zdarzenia.filter(z => z.id !== zdarzenieId) };
        }
        return s;
      })
    }));
  };

  const handleEvInputChange = (stazId, field, val) => {
    setEvInputs(prev => ({
      ...prev,
      [stazId]: { ...(prev[stazId] || { nazwa: '', dni: 1, typ: 'urlop' }), [field]: val }
    }));
  };

  const formatujCzasStazu = (tygodnie, dni) => {
    let czesci = [];
    if (tygodnie > 0) czesci.push(`${tygodnie} tyg.`);
    if (dni > 0) czesci.push(`${dni} dni rob.`);
    return czesci.join(' ');
  };

  let aktualnyKoniec = new Date(daneStaz.startDate || new Date());
  let lacznyCzasRoboczyKalkulacja = 0;
  const dzis = new Date();
  dzis.setHours(0,0,0,0);
  let aktywnyStazInfo = null;

  const renderedStaze = daneStaz.staze.map((staz, index) => {
    const poczatekStazu = new Date(aktualnyKoniec);
    poczatekStazu.setHours(0,0,0,0);

    const dniBase = (staz.tygodnie * 5) + (staz.dni || 0);
    const dniWydluzenie = staz.zdarzenia.reduce((sum, z) => sum + z.dni, 0);
    const lacznieDniRobocze = dniBase + dniWydluzenie;

    lacznyCzasRoboczyKalkulacja += lacznieDniRobocze;

    let koniecStazu;
    if (lacznieDniRobocze > 0) {
      koniecStazu = dodajDniRobocze(poczatekStazu, lacznieDniRobocze - 1);
      koniecStazu.setHours(0,0,0,0);
      aktualnyKoniec = dodajDniRobocze(koniecStazu, 1);
    } else {
      koniecStazu = new Date(poczatekStazu);
    }

    const jestAktywny = (dzis >= poczatekStazu && dzis <= koniecStazu);

    if (jestAktywny) {
      const mineloDniRob = policzDniRoboczeMiedzy(poczatekStazu, dzis);
      const pozostaloDniRob = lacznieDniRobocze - mineloDniRob;
      aktywnyStazInfo = {
        nazwa: staz.nazwa,
        index: index + 1,
        poczatek: poczatekStazu,
        koniec: koniecStazu,
        lacznieDni: lacznieDniRobocze,
        mineloDni: mineloDniRob,
        pozostaloDni: Math.max(0, pozostaloDniRob)
      };
    }

    const currentEvInput = evInputs[staz.id] || { nazwa: '', dni: 1, typ: 'urlop' };

    return (
      <div key={staz.id} className={`card staz-item ${jestAktywny ? 'is-current' : ''}`}>
        <div className="staz-header">
          <div className="staz-title-zone">
            <span className="drag-handle" title="Przeciągnij, aby zmienić kolejność">⋮⋮</span>
            <h3 style={{ margin: 0 }}>
              {index + 1}. {staz.nazwa} ({formatujCzasStazu(staz.tygodnie, staz.dni)})
              {jestAktywny && <span className="badge badge-active" style={{ marginLeft: '8px' }}>W trakcie</span>}
            </h3>
          </div>
          <button className="btn-danger" onClick={() => usunStaz(staz.id)}>Usuń staż</button>
        </div>

        <div className="staz-dates">
          <div><strong>Początek:</strong> {formatujDate(poczatekStazu)}</div>
          <div><strong>Koniec:</strong> {formatujDate(koniecStazu)}</div>
          <div><strong>Dni robocze:</strong> {lacznieDniRobocze} {dniWydluzenie > 0 ? `(w tym +${dniWydluzenie} wydłużenia)` : ''}</div>
        </div>

        <h4 style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Urlopy, kursy i nieobecności (wydłużające staż):</h4>
        <ul className="events-list">
          {staz.zdarzenia.length === 0 ? (
            <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Brak wpisanych urlopów/kursów.</li>
          ) : (
            staz.zdarzenia.map(z => (
              <li key={z.id} className="event-item">
                <span>
                  <span className="badge">{z.typ}</span>
                  <strong>{z.nazwa}</strong> (+{z.dni} dni rob.)
                </span>
                <button className="btn-danger" onClick={() => usunZdarzenie(staz.id, z.id)}>Usuń</button>
              </li>
            ))
          )}
        </ul>

        <div className="add-event-form">
          <select value={currentEvInput.typ} onChange={(e) => handleEvInputChange(staz.id, 'typ', e.target.value)}>
            <option value="urlop">Urlop</option>
            <option value="kurs">Kurs</option>
            <option value="inne">Inne</option>
          </select>
          <input 
            type="text" 
            placeholder="Opis (np. Zwolnienie lekarskie / Kurs)" 
            style={{ flex: 2 }}
            value={currentEvInput.nazwa} 
            onChange={(e) => handleEvInputChange(staz.id, 'nazwa', e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Dni rob." 
            min="1" 
            style={{ width: '90px' }}
            value={currentEvInput.dni} 
            onChange={(e) => handleEvInputChange(staz.id, 'dni', e.target.value)}
          />
          <button onClick={() => dodajZdarzenie(staz.id)} style={{ padding: '6px 12px', fontSize: '0.875rem' }}>+ Dodaj wydłużenie</button>
        </div>
      </div>
    );
  });

  const renderActiveSummaryText = () => {
    if (aktywnyStazInfo) {
      return (
        <>
          <div className="current-title">{aktywnyStazInfo.index}. {aktywnyStazInfo.nazwa}</div>
          <div className="current-stats">
            <div><strong>Koniec:</strong> {formatujDate(aktywnyStazInfo.koniec)}</div>
            <div><strong>Ukończono:</strong> {aktywnyStazInfo.mineloDni} z {aktywnyStazInfo.lacznieDni} dni rob.</div>
            <div><strong>Pozostało:</strong> {aktywnyStazInfo.pozostaloDni} dni rob.</div>
          </div>
        </>
      );
    }
    const startStazow = new Date(daneStaz.startDate);
    startStazow.setHours(0,0,0,0);
    let statusText = 'Brak aktywnego stażu w dniu dzisiejszym.';
    if (dzis < startStazow) {
      statusText = `Staż podyplomowy jeszcze się nie rozpoczął (start: ${formatujDate(startStazow)}).`;
    } else if (daneStaz.staze.length > 0 && lacznyCzasRoboczyKalkulacja > 0) {
      const koniecCalkowity = dodajDniRobocze(startStazow, lacznyCzasRoboczyKalkulacja - 1);
      koniecCalkowity.setHours(0,0,0,0);
      if (dzis > koniecCalkowity) {
        statusText = 'Wszystkie zaplanowane staże zostały zakończone!';
      } else if (dzis.getDay() === 0 || dzis.getDay() === 6) {
        statusText = 'Dzisiaj jest weekend – trwa przerwa w zajęciach.';
      }
    }
    return <div className="current-title" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{statusText}</div>;
  };

  const ostatecznyKoniec = lacznyCzasRoboczyKalkulacja > 0 ? dodajDniRobocze(daneStaz.startDate, lacznyCzasRoboczyKalkulacja - 1) : null;

  return (
    <div id="app-2">
      <div className="header-bar">
        <h2>Kalkulator Stażu Podyplomowego</h2>
        <div className="header-actions">
          <button className="btn-print" onClick={() => window.print()}>
            <span>🖨️ Drukuj zestawienie</span>
          </button>
          <button className="btn-help" onClick={onOpenModal}>
            <span>❓ Zasady obliczania</span>
          </button>
        </div>
      </div>

      <div className="layout-grid">
        <div className="main-column">
          <div className="card summary-card">
            <div className="summary-item">
              <span className="summary-label">Start Stażu</span>
              <span className="summary-value">{daneStaz.staze.length > 0 ? formatujDate(daneStaz.startDate) : '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Planowany Koniec</span>
              <span className="summary-value">{ostatecznyKoniec ? formatujDate(ostatecznyKoniec) : '-'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Łącznie Dni Roboczych</span>
              <span className="summary-value">{daneStaz.staze.length > 0 ? lacznyCzasRoboczyKalkulacja : '-'}</span>
            </div>
          </div>

          <div className="card current-card">
            <div className="current-card-header">
              <span className="pulse-dot"></span>
              <span>Aktualnie trwający staż</span>
            </div>
            <div>{renderActiveSummaryText()}</div>
          </div>

          <div className="card">
            <div className="form-group">
              <div className="field">
                <label htmlFor="startDate">Data rozpoczęcia całego stażu:</label>
                <input type="date" id="startDate" value={daneStaz.startDate} onChange={handleDateChange} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Dodaj staż cząstkowy</h3>
            <div className="form-group">
              <div className="field" style={{ flex: 2 }}>
                <label>Nazwa stażu (np. Bioetyka / Pediatria):</label>
                <input type="text" placeholder="Wpisz nazwę..." value={nazwaStazu} onChange={(e) => setNazwaStazu(e.target.value)} />
              </div>
              <div className="field">
                <label>Tygodnie:</label>
                <input type="number" min="0" value={tygodnieStazu} onChange={(e) => setTygodnieStazu(e.target.value)} />
              </div>
              <div className="field">
                <label>Dodatkowe dni robocze:</label>
                <input type="number" min="0" max="4" value={dniStazu} onChange={(e) => setDniStazu(e.target.value)} />
              </div>
              <button onClick={dodajStaz}>Dodaj staż</button>
            </div>
          </div>

          <div>{renderedStaze}</div>
        </div>

        <div className="side-column">
          <div className="card notes-card">
            <h3>📝 Notatnik</h3>
            <textarea 
              className="notes-textarea" 
              placeholder="Miejsce na Twoje notatki, kontakty do opiekunów stażu, ważne terminy..."
              value={daneStaz.notatki}
              onChange={handleNotesChange}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
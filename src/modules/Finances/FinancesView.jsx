import React, { useState, useEffect } from 'react';
import { PieChart, LineChart } from './FinanceCharts';

export default function FinancesView() {
  const [baza, setBaza] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('finanse_baza_v4'));
    return saved || { transakcje: [], stany_konta: [], wydatki_domowe: [] };
  });

  const [activeTab, setActiveTab] = useState('przychody');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aktywnyMiesiac, setAktywnyMiesiac] = useState(null);

  const [inputData, setInputData] = useState(new Date().toISOString().split('T')[0]);
  const [inputOpis, setInputOpis] = useState('');
  const [inputKwota, setInputKwota] = useState('');
  const [inputTyp, setInputTyp] = useState('Przychód');

  const [inputStanData, setInputStanData] = useState(new Date().toISOString().split('T')[0]);
  const [inputStanKwota, setInputStanKwota] = useState('');

  const [inputDomNazwa, setInputDomNazwa] = useState('');
  const [inputDomKwota, setInputDomKwota] = useState('');

  useEffect(() => {
    localStorage.setItem('finanse_baza_v4', JSON.stringify(baza));
  }, [baza]);

  const dodajTransakcje = () => {
    const kwotaRaw = parseFloat(inputKwota);
    if (!inputData || !inputOpis.trim() || isNaN(kwotaRaw) || kwotaRaw <= 0) {
      alert('Wypełnij poprawnie wszystkie pola!');
      return;
    }
    const kwota = inputTyp === 'Wydatek' ? -kwotaRaw : kwotaRaw;
    const newTransakcje = [...baza.transakcje, { data: inputData, opis: inputOpis.trim(), kwota, typ: inputTyp }];
    newTransakcje.sort((a, b) => a.data.localeCompare(b.data));

    setBaza(prev => ({ ...prev, transakcje: newTransakcje }));
    setInputOpis('');
    setInputKwota('');
    setIsFormOpen(false);
    setAktywnyMiesiac(inputData.substring(0, 7));
  };

  const usunTransakcje = (idx) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      setBaza(prev => ({ ...prev, transakcje: prev.transakcje.filter((_, i) => i !== idx) }));
    }
  };

  const dodajStanKonta = () => {
    const kwota = parseFloat(inputStanKwota);
    if (!inputStanData || isNaN(kwota)) {
      alert('Wprowadź poprawną kwotę!');
      return;
    }
    const newStany = [...baza.stany_konta, { data: inputStanData, kwota }];
    newStany.sort((a, b) => a.data.localeCompare(b.data));
    setBaza(prev => ({ ...prev, stany_konta: newStany }));
    setInputStanKwota('');
  };

  const usunStanKonta = (idx) => {
    if (window.confirm('Czy usunąć ten wpis stanu konta?')) {
      setBaza(prev => ({ ...prev, stany_konta: prev.stany_konta.filter((_, i) => i !== idx) }));
    }
  };

  const dodajWydatekDomowy = () => {
    const kwota = parseFloat(inputDomKwota);
    const dzisiaj = new Date().toISOString().split('T')[0];
    if (!inputDomNazwa.trim() || isNaN(kwota) || kwota <= 0) {
      alert('Wprowadź poprawną nazwę i kwotę!');
      return;
    }
    setBaza(prev => ({
      ...prev,
      wydatki_domowe: [...prev.wydatki_domowe, { data: dzisiaj, nazwa: inputDomNazwa.trim(), kwota, oplacone: false }]
    }));
    setInputDomNazwa('');
    setInputDomKwota('');
  };

  const toggleOplacenieDomowe = (idx) => {
    setBaza(prev => ({
      ...prev,
      wydatki_domowe: prev.wydatki_domowe.map((w, i) => i === idx ? { ...w, oplacone: !w.oplacone } : w)
    }));
  };

  const usunWydatekDomowy = (idx) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wydatek domowy?')) {
      setBaza(prev => ({ ...prev, wydatki_domowe: prev.wydatki_domowe.filter((_, i) => i !== idx) }));
    }
  };

  const miesiaceSet = new Set(baza.transakcje.map(t => t.data.substring(0, 7)));
  const miesiace = Array.from(miesiaceSet).sort().reverse();
  const effMiesiac = (!aktywnyMiesiac || !miesiace.includes(aktywnyMiesiac)) ? miesiace[0] : aktywnyMiesiac;

  let sumaP = 0, sumaW = 0;
  const filtrowaneTransakcje = baza.transakcje.filter((t) => {
    if (t.data.startsWith(effMiesiac)) {
      const kwotaAbs = Math.abs(t.kwota);
      if (t.kwota > 0) sumaP += t.kwota; else sumaW += kwotaAbs;
      return true;
    }
    return false;
  });

  const pct = sumaP > 0 ? ((sumaW / sumaP) * 100).toFixed(1) : (sumaW > 0 ? 100 : 0);

  let sumaNieoplacone = 0;
  baza.wydatki_domowe.forEach(w => { if (!w.oplacone) sumaNieoplacone += w.kwota; });

  return (
    <div id="app-3">
      <div className="app-container">
        <button className="btn-toggle-panel" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? '✕ Zamknij formularz' : '✨ Dodaj nową transakcję (Przychód / Wydatek)'}
        </button>

        <div className={`form-drawer ${isFormOpen ? 'open' : ''}`}>
          <div className="form-grid">
            <label>Data:</label>
            <input type="date" value={inputData} onChange={(e) => setInputData(e.target.value)} />
            <label>Opis:</label>
            <input type="text" placeholder="np. Wynagrodzenie, Zakupy" value={inputOpis} onChange={(e) => setInputOpis(e.target.value)} />
            <label>Kwota:</label>
            <input type="number" step="0.01" placeholder="0.00" value={inputKwota} onChange={(e) => setInputKwota(e.target.value)} />
            <select value={inputTyp} onChange={(e) => setInputTyp(e.target.value)}>
              <option value="Przychód">Przychód</option>
              <option value="Wydatek">Wydatek</option>
            </select>
            <button className="btn-save" onClick={dodajTransakcje}>Zapisz</button>
          </div>
        </div>

        <div className="main-tabs">
          <button className={`tab-btn ${activeTab === 'przychody' ? 'active' : ''}`} onClick={() => setActiveTab('przychody')}>Przychody/Wydatki</button>
          <button className={`tab-btn ${activeTab === 'stan' ? 'active' : ''}`} onClick={() => setActiveTab('stan')}>Stan konta</button>
          <button className={`tab-btn ${activeTab === 'domowe' ? 'active' : ''}`} onClick={() => setActiveTab('domowe')}>Wydatki domowe</button>
        </div>

        <div className={`tab-content ${activeTab === 'przychody' ? 'active' : ''}`}>
          <div className="month-tabs">
            {miesiace.map(m => (
              <button key={m} className={`month-btn ${m === effMiesiac ? 'active' : ''}`} onClick={() => setAktywnyMiesiac(m)}>{m}</button>
            ))}
          </div>

          <div className="grid-2col">
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                HISTORIA TRANSAKCJI (Podwójne kliknięcie usuwa)
              </h3>
              <div className="history-list">
                {filtrowaneTransakcje.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Brak wpisów w tym okresie.</div>
                ) : (
                  filtrowaneTransakcje.map((t, index) => (
                    <div 
                      key={index} 
                      className="history-item" 
                      style={{ color: t.kwota < 0 ? 'var(--fin-red)' : 'var(--fin-green)' }}
                      onDoubleClick={() => usunTransakcje(baza.transakcje.indexOf(t))}
                    >
                      <span>{t.data} | {t.kwota < 0 ? '-' : '+'} {Math.abs(t.kwota).toFixed(2)} zł</span>
                      <span>{t.opis}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>
                PODSUMOWANIE MIESIĄCA
              </h3>
              <div className="tiles-container">
                <div className="tile-fin">
                  <div className="tile-title-fin">Przychody</div>
                  <div className="tile-value-fin" style={{ color: 'var(--fin-green)' }}>+{sumaP.toFixed(2)} zł</div>
                </div>
                <div className="tile-fin">
                  <div className="tile-title-fin">Wydatki</div>
                  <div className="tile-value-fin" style={{ color: 'var(--fin-red)' }}>-{sumaW.toFixed(2)} zł</div>
                </div>
                <div className="tile-fin">
                  <div className="tile-title-fin">Saldo</div>
                  <div className="tile-value-fin" style={{ color: 'var(--primary)' }}>{(sumaP - sumaW).toFixed(2)} zł</div>
                </div>
              </div>

              <div className="chart-3d-wrapper">
                <div className="chart-3d-inner">
                  <PieChart przychody={sumaP} wydatki={sumaW} />
                </div>
                <div className="chart-center-label">{(sumaP > 0 || sumaW > 0) ? `${pct}%` : ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'stan' ? 'active' : ''}`}>
          <div className="grid-2col">
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>ZAPISZ AKTUALNE SALDO KONTA</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input type="date" value={inputStanData} onChange={(e) => setInputStanData(e.target.value)} />
                <input type="number" step="0.01" placeholder="0.00 zł" value={inputStanKwota} onChange={(e) => setInputStanKwota(e.target.value)} />
                <button className="btn-save" onClick={dodajStanKonta}>Zapisz</button>
              </div>
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>HISTORIA OSZCZĘDNOŚCI</h3>
              <div className="history-list">
                {baza.stany_konta.map((s, idx) => (
                  <div key={idx} className="history-item" onDoubleClick={() => usunStanKonta(idx)}>
                    <span>{s.data}</span>
                    <span>Stan: {s.kwota.toFixed(2)} zł</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>
                TREND ZMIAN STANU OSZCZĘDNOŚCI
              </h3>
              <div style={{ height: '320px', position: 'relative' }}>
                <LineChart stanyKonta={baza.stany_konta} />
              </div>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'domowe' ? 'active' : ''}`}>
          <div className="grid-2col">
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>DODAJ WYDATEK DOMOWY</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nazwa" value={inputDomNazwa} onChange={(e) => setInputDomNazwa(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" step="0.01" placeholder="Kwota (zł)" style={{ flexGrow: 1 }} value={inputDomKwota} onChange={(e) => setInputDomKwota(e.target.value)} />
                  <button className="btn-save" onClick={dodajWydatekDomowy}>Dodaj wydatek</button>
                </div>
              </div>

              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                LISTA WYDATKÓW DOMOWYCH (Podwójne kliknięcie usuwa)
              </h3>
              <div className="history-list">
                {baza.wydatki_domowe.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Brak dodanych wydatków domowych.</div>
                ) : (
                  baza.wydatki_domowe.map((w, idx) => (
                    <div key={idx} className="history-item" onDoubleClick={() => usunWydatekDomowy(idx)}>
                      <div className="home-item">
                        <input 
                          type="checkbox" 
                          className="home-checkbox" 
                          checked={w.oplacone} 
                          onChange={() => toggleOplacenieDomowe(idx)} 
                        />
                        <div className={`home-text ${w.oplacone ? 'completed' : ''}`}>
                          <span>{w.data} | {w.nazwa}</span>
                          <span style={{ fontWeight: 'bold' }}>{w.kwota.toFixed(2)} zł</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px', textAlign: 'center', textTransform: 'uppercase' }}>
                STATUS SPŁATY RACHUNKÓW
              </h3>
              <div className="tiles-container" style={{ gridTemplateColumns: '1fr' }}>
                <div className="tile-fin">
                  <div className="tile-title-fin">Do zapłaty (Nieopłacone)</div>
                  <div className="tile-value-fin" style={{ color: 'var(--fin-red)' }}>{sumaNieoplacone.toFixed(2)} zł</div>
                </div>
              </div>

              <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '15px', marginBottom: '8px', textTransform: 'uppercase' }}>
                Nieopłacone rachunki:
              </h4>
              <div className="history-list">
                {sumaNieoplacone === 0 && baza.wydatki_domowe.length > 0 ? (
                  <div style={{ color: 'var(--fin-green)', padding: '20px', textAlign: 'center' }}>Wszystkie rachunki zostały spłacone! 🎉</div>
                ) : baza.wydatki_domowe.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Brak nieopłaconych rachunków.</div>
                ) : (
                  baza.wydatki_domowe.filter(w => !w.oplacone).map((w, idx) => (
                    <div key={idx} className="history-item" style={{ color: 'var(--fin-red)' }}>
                      <span>{w.data} | {w.nazwa}</span>
                      <span style={{ fontWeight: 'bold' }}>{w.kwota.toFixed(2)} zł</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
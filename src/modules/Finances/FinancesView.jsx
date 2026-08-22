import React, { useState, useEffect } from 'react';
import { PieChart, LineChart, InvestmentChart, PortfolioPercentageChart } from './FinanceCharts';

export default function FinancesView({ onRegisterBack }) {
  const [baza, setBaza] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('finanse_baza_v4'));
      if (saved) return { transakcje: [], stany_konta: [], wydatki_domowe: [], inwestycje: [], portfel: [], ...saved };
    } catch (e) {
      console.error('Błąd odczytu finanse_baza_v4:', e);
    }
    return { transakcje: [], stany_konta: [], wydatki_domowe: [], inwestycje: [], portfel: [] };
  });

  const [activeTab, setActiveTab] = useState('przychody');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aktywnyMiesiac, setAktywnyMiesiac] = useState(null);

  useEffect(() => {
    if (!onRegisterBack) return;
    const handleInternalBack = () => {
      if (isFormOpen) {
        setIsFormOpen(false);
        return true;
      }
      return false;
    };
    onRegisterBack(handleInternalBack);
    return () => onRegisterBack(null);
  }, [onRegisterBack, isFormOpen]);

  const [inputData, setInputData] = useState(new Date().toISOString().split('T')[0]);
  const [inputOpis, setInputOpis] = useState('');
  const [inputKwota, setInputKwota] = useState('');
  const [inputTyp, setInputTyp] = useState('Przychód');
  const [editingTxIndex, setEditingTxIndex] = useState(null);

  const [inputStanData, setInputStanData] = useState(new Date().toISOString().slice(0, 7));
  const [inputStanKwota, setInputStanKwota] = useState('');

  const formatujMiesiacRok = (dataStr) => {
    if (!dataStr) return '';
    const parts = dataStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthsPL = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
      ];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${monthsPL[monthIdx]} ${year}`;
      }
    }
    return dataStr;
  };

  const [inputDomNazwa, setInputDomNazwa] = useState('');
  const [inputDomKwota, setInputDomKwota] = useState('');

  const [inputInvNazwa, setInputInvNazwa] = useState('');
  const [inputInvMiesiac, setInputInvMiesiac] = useState(new Date().toISOString().substring(0, 7));
  const [inputInvKwota, setInputInvKwota] = useState('');
  const [inputInvTyp, setInputInvTyp] = useState('Profit');

  // Stany dla sekcji Portfel
  const [inputPortfelNazwa, setInputPortfelNazwa] = useState('');
  const [inputPortfelDataZakupu, setInputPortfelDataZakupu] = useState(new Date().toISOString().split('T')[0]);
  const [inputPortfelWartoscZakupu, setInputPortfelWartoscZakupu] = useState('');

  const [selectedPortfelAkcjaId, setSelectedPortfelAkcjaId] = useState('');
  const [inputPortfelUpdateData, setInputPortfelUpdateData] = useState(new Date().toISOString().split('T')[0]);
  const [inputPortfelUpdateWartosc, setInputPortfelUpdateWartosc] = useState('');
  const [isUpdatePanelOpen, setIsUpdatePanelOpen] = useState(false);

  const [chartSelectedStockId, setChartSelectedStockId] = useState('all');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  useEffect(() => {
    localStorage.setItem('finanse_baza_v4', JSON.stringify(baza));
  }, [baza]);

  const zapiszTransakcje = () => {
    const kwotaRaw = parseFloat(inputKwota);
    if (!inputData || !inputOpis.trim() || isNaN(kwotaRaw) || kwotaRaw <= 0) {
      alert('Wypełnij poprawnie wszystkie pola!');
      return;
    }
    const kwota = inputTyp === 'Wydatek' ? -kwotaRaw : kwotaRaw;
    const nowaTransakcja = { data: inputData, opis: inputOpis.trim(), kwota, typ: inputTyp };

    let newTransakcje = [...baza.transakcje];
    if (editingTxIndex !== null && editingTxIndex >= 0 && editingTxIndex < newTransakcje.length) {
      newTransakcje[editingTxIndex] = nowaTransakcja;
    } else {
      newTransakcje.push(nowaTransakcja);
    }
    newTransakcje.sort((a, b) => a.data.localeCompare(b.data));

    setBaza(prev => ({ ...prev, transakcje: newTransakcje }));
    setInputOpis('');
    setInputKwota('');
    setEditingTxIndex(null);
    setIsFormOpen(false);
    setAktywnyMiesiac(inputData.substring(0, 7));
  };

  const edytujTransakcje = (globalIdx) => {
    const t = baza.transakcje[globalIdx];
    if (!t) return;
    setEditingTxIndex(globalIdx);
    setInputData(t.data);
    setInputOpis(t.opis);
    setInputKwota(Math.abs(t.kwota).toString());
    setInputTyp(t.kwota < 0 ? 'Wydatek' : 'Przychód');
    setIsFormOpen(true);
  };

  const anulujEdycjeTransakcji = () => {
    setEditingTxIndex(null);
    setInputOpis('');
    setInputKwota('');
    setInputData(new Date().toISOString().split('T')[0]);
    setInputTyp('Przychód');
  };

  const usunTransakcje = (idx) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      setBaza(prev => ({ ...prev, transakcje: prev.transakcje.filter((_, i) => i !== idx) }));
      if (editingTxIndex === idx) {
        anulujEdycjeTransakcji();
      }
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

  const oplacWszystkieDomowe = () => {
    const czyWszystkieOplacone = baza.wydatki_domowe.every(w => w.oplacone);
    setBaza(prev => ({
      ...prev,
      wydatki_domowe: prev.wydatki_domowe.map(w => ({ ...w, oplacone: !czyWszystkieOplacone }))
    }));
  };

  const usunWszystkieDomowe = () => {
    if (window.confirm('⚠️ OSTRZEŻENIE:\nCzy na pewno chcesz usunąć WSZYSTKIE wydatki domowe z listy?')) {
      setBaza(prev => ({ ...prev, wydatki_domowe: [] }));
    }
  };

  const usunWydatekDomowy = (idx) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wydatek domowy?')) {
      setBaza(prev => ({ ...prev, wydatki_domowe: prev.wydatki_domowe.filter((_, i) => i !== idx) }));
    }
  };

  const dodajInwestycje = () => {
    const kwotaRaw = parseFloat(inputInvKwota);
    if (!inputInvNazwa.trim() || !inputInvMiesiac || isNaN(kwotaRaw) || kwotaRaw <= 0) {
      alert('Wypełnij poprawnie nazwę, miesiąc/rok oraz kwotę!');
      return;
    }
    const floatKwota = inputInvTyp === 'Strata' ? -kwotaRaw : kwotaRaw;
    const newInv = {
      id: Date.now().toString(),
      nazwa: inputInvNazwa.trim(),
      miesiac: inputInvMiesiac,
      kwota: floatKwota,
      typ: inputInvTyp,
    };
    const list = [...(baza.inwestycje || []), newInv];
    list.sort((a, b) => b.miesiac.localeCompare(a.miesiac));

    setBaza(prev => ({ ...prev, inwestycje: list }));
    setInputInvNazwa('');
    setInputInvKwota('');
  };

  const usunInwestycje = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis inwestycyjny?')) {
      setBaza(prev => ({
        ...prev,
        inwestycje: (prev.inwestycje || []).filter(item => item.id !== id)
      }));
    }
  };

  const dodajAkcjeDoPortfela = () => {
    const wartosc = parseFloat(inputPortfelWartoscZakupu);
    if (!inputPortfelNazwa.trim() || !inputPortfelDataZakupu || isNaN(wartosc) || wartosc <= 0) {
      alert('Wprowadź poprawną nazwę, datę zakupu oraz wartość w dniu zakupu!');
      return;
    }
    const nowaAkcja = {
      id: Date.now().toString(),
      nazwa: inputPortfelNazwa.trim(),
      dataZakupu: inputPortfelDataZakupu,
      wartoscZakupu: wartosc,
      historia: []
    };

    setBaza(prev => ({
      ...prev,
      portfel: [...(prev.portfel || []), nowaAkcja]
    }));

    setInputPortfelNazwa('');
    setInputPortfelWartoscZakupu('');
  };

  const usunAkcjeZPortfela = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę akcję z portfela?')) {
      setBaza(prev => ({
        ...prev,
        portfel: (prev.portfel || []).filter(a => a.id !== id)
      }));
      if (selectedPortfelAkcjaId === id) setSelectedPortfelAkcjaId('');
      if (chartSelectedStockId === id) setChartSelectedStockId('all');
    }
  };

  const dodajAktualizacjeWartosci = () => {
    const wartosc = parseFloat(inputPortfelUpdateWartosc);
    if (!selectedPortfelAkcjaId || !inputPortfelUpdateData || isNaN(wartosc) || wartosc < 0) {
      alert('Wybierz akcję, wprowadź poprawną datę i nową wartość!');
      return;
    }

    setBaza(prev => {
      const list = (prev.portfel || []).map(akcja => {
        if (akcja.id === selectedPortfelAkcjaId) {
          const nowaHistoria = [
            ...(akcja.historia || []),
            { id: Date.now().toString(), data: inputPortfelUpdateData, wartosc }
          ];
          nowaHistoria.sort((a, b) => a.data.localeCompare(b.data));
          return { ...akcja, historia: nowaHistoria };
        }
        return akcja;
      });
      return { ...prev, portfel: list };
    });

    setInputPortfelUpdateWartosc('');
  };

  const usunWpisHistorii = (akcjaId, wpisId) => {
    if (window.confirm('Czy usunąć ten wpis wyceny z historii?')) {
      setBaza(prev => {
        const list = (prev.portfel || []).map(akcja => {
          if (akcja.id === akcjaId) {
            return {
              ...akcja,
              historia: (akcja.historia || []).filter(h => h.id !== wpisId)
            };
          }
          return akcja;
        });
        return { ...prev, portfel: list };
      });
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

  const wszystkieDomoweOplacone = baza.wydatki_domowe.length > 0 && baza.wydatki_domowe.every(w => w.oplacone);

  let sumaInvProfit = 0;
  let sumaInvStrata = 0;
  (baza.inwestycje || []).forEach(inv => {
    const val = Math.abs(parseFloat(inv.kwota) || 0);
    if (inv.typ === 'Profit' || inv.kwota > 0) {
      sumaInvProfit += val;
    } else {
      sumaInvStrata += val;
    }
  });
  const bilansInv = sumaInvProfit - sumaInvStrata;

  // Wyliczenia dla Portfela
  let sumaWkladPortfela = 0;
  let sumaAktualnaPortfela = 0;

  (baza.portfel || []).forEach(akcja => {
    const wklad = parseFloat(akcja.wartoscZakupu) || 0;
    sumaWkladPortfela += wklad;

    let aktVal = wklad;
    if (Array.isArray(akcja.historia) && akcja.historia.length > 0) {
      const sorted = [...akcja.historia].sort((a, b) => a.data.localeCompare(b.data));
      aktVal = parseFloat(sorted[sorted.length - 1].wartosc) || 0;
    }
    sumaAktualnaPortfela += aktVal;
  });

  const bilansPortfela = sumaAktualnaPortfela - sumaWkladPortfela;
  const pctPortfela = sumaWkladPortfela > 0 ? (bilansPortfela / sumaWkladPortfela) * 100 : 0;

  return (
    <div id="app-3">
      <div className="app-container">
        <div className="main-tabs">
          <button className={`tab-btn ${activeTab === 'przychody' ? 'active' : ''}`} onClick={() => setActiveTab('przychody')}>Przychody/Wydatki</button>
          <button className={`tab-btn ${activeTab === 'stan' ? 'active' : ''}`} onClick={() => setActiveTab('stan')}>Stan konta</button>
          <button className={`tab-btn ${activeTab === 'inwestycje' ? 'active' : ''}`} onClick={() => setActiveTab('inwestycje')}>Inwestycje</button>
          <button className={`tab-btn ${activeTab === 'portfel' ? 'active' : ''}`} onClick={() => setActiveTab('portfel')}>Portfel</button>
          <button className={`tab-btn ${activeTab === 'domowe' ? 'active' : ''}`} onClick={() => setActiveTab('domowe')}>Wydatki domowe</button>
        </div>

        <div className={`tab-content ${activeTab === 'przychody' ? 'active' : ''}`}>
          <button className="btn-toggle-panel" onClick={() => {
            if (isFormOpen && editingTxIndex !== null) {
              anulujEdycjeTransakcji();
            }
            setIsFormOpen(!isFormOpen);
          }}>
            {isFormOpen 
              ? '✕ Zamknij formularz' 
              : (editingTxIndex !== null 
                  ? '✏️ Edytujesz transakcję (Otwórz formularz)' 
                  : '✨ Dodaj nową transakcję (Przychód / Wydatek)')}
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
              <div style={{ display: 'flex', gap: '8px', gridColumn: 'span 2' }}>
                <button className="btn-save" onClick={zapiszTransakcje} style={{ flex: 1 }}>
                  {editingTxIndex !== null ? 'Zapisz zmiany' : 'Zapisz'}
                </button>
                {editingTxIndex !== null && (
                  <button type="button" className="btn-orto-cancel" onClick={anulujEdycjeTransakcji}>
                    Anuluj
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="month-tabs">
            {miesiace.map(m => (
              <button key={m} className={`month-btn ${m === effMiesiac ? 'active' : ''}`} onClick={() => setAktywnyMiesiac(m)}>{m}</button>
            ))}
          </div>

          <div className="grid-2col">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>
                  HISTORIA TRANSAKCJI (PODWÓJNE KLIKNIĘCIE USUWA)
                </h3>
                <button 
                  type="button" 
                  className={`btn-history-edit ${editingTxIndex !== null ? 'active' : ''}`}
                  onClick={() => {
                    if (editingTxIndex !== null) {
                      anulujEdycjeTransakcji();
                    } else if (filtrowaneTransakcje.length > 0) {
                      const firstIdx = baza.transakcje.indexOf(filtrowaneTransakcje[0]);
                      edytujTransakcje(firstIdx);
                    } else {
                      setIsFormOpen(true);
                    }
                  }}
                  title="Edytuj wpis z historii"
                >
                  Edytuj
                </button>
              </div>
              <div className="history-list">
                {filtrowaneTransakcje.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Brak wpisów w tym okresie.</div>
                ) : (
                  filtrowaneTransakcje.map((t, index) => {
                    const globalIdx = baza.transakcje.indexOf(t);
                    const isEditing = editingTxIndex === globalIdx;
                    return (
                      <div 
                        key={index} 
                        className={`history-item ${isEditing ? 'editing' : ''}`}
                        style={{ 
                          color: t.kwota < 0 ? 'var(--fin-red)' : 'var(--fin-green)',
                          borderColor: isEditing ? '#00f2ff' : undefined,
                          backgroundColor: isEditing ? 'rgba(0, 242, 255, 0.08)' : undefined,
                          cursor: 'pointer'
                        }}
                        onClick={() => edytujTransakcje(globalIdx)}
                        onDoubleClick={() => usunTransakcje(globalIdx)}
                        title="Kliknij, aby edytować. Podwójne kliknięcie usuwa."
                      >
                        <span>{t.data} | {t.kwota < 0 ? '-' : '+'} {Math.abs(t.kwota).toFixed(2)} zł</span>
                        <span>{t.opis}</span>
                      </div>
                    );
                  })
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

        <div className={`tab-content ${activeTab === 'inwestycje' ? 'active' : ''}`}>
          <div className="grid-2col">
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                DODAJ PROFIT / STRATĘ Z INWESTYCJI
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Nazwa inwestycji (np. Krypto, Akcje, ETF, Nieruchomość)"
                  value={inputInvNazwa}
                  onChange={(e) => setInputInvNazwa(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Miesiąc i Rok:</label>
                    <input
                      type="month"
                      value={inputInvMiesiac}
                      onChange={(e) => setInputInvMiesiac(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Typ wpisu:</label>
                    <select
                      value={inputInvTyp}
                      onChange={(e) => setInputInvTyp(e.target.value)}
                    >
                      <option value="Profit">🟢 Profit / Zysk (+)</option>
                      <option value="Strata">🔴 Strata (-)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Kwota (zł)"
                    style={{ flexGrow: 1 }}
                    value={inputInvKwota}
                    onChange={(e) => setInputInvKwota(e.target.value)}
                  />
                  <button className="btn-save" onClick={dodajInwestycje}>
                    Zapisz
                  </button>
                </div>
              </div>

              <div className="tiles-container" style={{ marginBottom: '15px' }}>
                <div className="tile-fin">
                  <div className="tile-title-fin">Łączny Zysk</div>
                  <div className="tile-value-fin" style={{ color: 'var(--fin-green)' }}>
                    +{sumaInvProfit.toFixed(2)} zł
                  </div>
                </div>
                <div className="tile-fin">
                  <div className="tile-title-fin">Łączna Strata</div>
                  <div className="tile-value-fin" style={{ color: 'var(--fin-red)' }}>
                    -{sumaInvStrata.toFixed(2)} zł
                  </div>
                </div>
                <div className="tile-fin">
                  <div className="tile-title-fin">Bilans Netto</div>
                  <div className="tile-value-fin" style={{ color: bilansInv >= 0 ? 'var(--fin-green)' : 'var(--fin-red)' }}>
                    {bilansInv >= 0 ? '+' : ''}{bilansInv.toFixed(2)} zł
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                HISTORIA INWESTYCJI (Podwójne kliknięcie usuwa)
              </h3>
              <div className="history-list">
                {(baza.inwestycje || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Brak wpisów o inwestycjach.</div>
                ) : (
                  (baza.inwestycje || []).map((inv) => {
                    const isProfit = inv.typ === 'Profit' || inv.kwota > 0;
                    return (
                      <div
                        key={inv.id || inv.nazwa + inv.miesiac}
                        className="history-item"
                        style={{ color: isProfit ? 'var(--fin-green)' : 'var(--fin-red)' }}
                        onDoubleClick={() => usunInwestycje(inv.id)}
                      >
                        <span>{inv.miesiac} | {inv.nazwa}</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {isProfit ? '+' : '-'}{Math.abs(inv.kwota).toFixed(2)} zł
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>
                ZYSK I STRATA ŁĄCZNIE NA PRZESTRZENI MIESIĘCY
              </h3>
              <div style={{ height: '340px', position: 'relative' }}>
                {(baza.inwestycje || []).length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Dodaj pierwsze wpisy inwestycyjne, aby wyświetlić wykres.
                  </div>
                ) : (
                  <InvestmentChart inwestycje={baza.inwestycje || []} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'portfel' ? 'active' : ''}`}>
          <div className="grid-2col">
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                ➕ DODAJ AKCJĘ / AKTYWO DO PORTFELA
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Nazwa / Symbol (np. Apple, PKO BP, Orlen)"
                  value={inputPortfelNazwa}
                  onChange={(e) => setInputPortfelNazwa(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Data zakupu:</label>
                    <input
                      type="date"
                      value={inputPortfelDataZakupu}
                      onChange={(e) => setInputPortfelDataZakupu(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Wartość zakupu (zł):</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={inputPortfelWartoscZakupu}
                      onChange={(e) => setInputPortfelWartoscZakupu(e.target.value)}
                    />
                  </div>
                </div>
                <button className="btn-save" onClick={dodajAkcjeDoPortfela}>
                  ➕ Dodaj do portfela
                </button>
              </div>

              {(baza.portfel || []).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setIsUpdatePanelOpen(prev => !prev)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>📈 Wprowadź dzienną wartość pozycji</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                      {isUpdatePanelOpen ? '▲ Zamknij' : '▼ Rozwiń panel'}
                    </span>
                  </button>

                  {isUpdatePanelOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <select
                        value={selectedPortfelAkcjaId}
                        onChange={(e) => setSelectedPortfelAkcjaId(e.target.value)}
                      >
                        <option value="">-- Wybierz akcję / spółkę --</option>
                        {(baza.portfel || []).map(akcja => (
                          <option key={akcja.id} value={akcja.id}>
                            {akcja.nazwa} (Kupiono: {akcja.dataZakupu})
                          </option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Data wpisu:</label>
                          <input
                            type="date"
                            value={inputPortfelUpdateData}
                            onChange={(e) => setInputPortfelUpdateData(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Wartość w tym dniu (zł):</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={inputPortfelUpdateWartosc}
                            onChange={(e) => setInputPortfelUpdateWartosc(e.target.value)}
                          />
                        </div>
                      </div>
                      <button className="btn-save" onClick={dodajAktualizacjeWartosci}>
                        Zapisz zmianę wartości
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Kafelki podsumowania */}
              <div className="tiles-container" style={{ marginBottom: '20px' }}>
                <div className="tile-fin">
                  <div className="tile-title-fin">Wkład (Koszt)</div>
                  <div className="tile-value-fin" style={{ color: 'var(--primary)' }}>
                    {sumaWkladPortfela.toFixed(2)} zł
                  </div>
                </div>
                <div className="tile-fin">
                  <div className="tile-title-fin">Wartość Obecna</div>
                  <div className="tile-value-fin" style={{ color: '#ffffff' }}>
                    {sumaAktualnaPortfela.toFixed(2)} zł
                  </div>
                </div>
                <div className="tile-fin">
                  <div className="tile-title-fin">Wynik Portfela</div>
                  <div className="tile-value-fin" style={{ color: bilansPortfela >= 0 ? '#2ecc71' : 'var(--fin-red)' }}>
                    {bilansPortfela >= 0 ? '+' : ''}{bilansPortfela.toFixed(2)} zł ({pctPortfela >= 0 ? '+' : ''}{pctPortfela.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                POSIADANE AKCJE W PORTFELU
              </h3>
              <div className="history-list">
                {(baza.portfel || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                    Brak akcji w portfelu. Dodaj pierwsze akcje powyżej!
                  </div>
                ) : (
                  (baza.portfel || []).map(akcja => {
                    const wklad = parseFloat(akcja.wartoscZakupu) || 0;
                    const historia = Array.isArray(akcja.historia) ? akcja.historia : [];
                    const sortedHist = [...historia].sort((a, b) => a.data.localeCompare(b.data));
                    const lastVal = sortedHist.length > 0 ? parseFloat(sortedHist[sortedHist.length - 1].wartosc) : wklad;
                    const diff = lastVal - wklad;
                    const diffPct = wklad > 0 ? (diff / wklad) * 100 : 0;
                    const isProfit = diff >= 0;
                    const isExpanded = expandedHistoryId === akcja.id;

                    return (
                      <div
                        key={akcja.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#ffffff' }}>{akcja.nazwa}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Kupiono: {akcja.dataZakupu} | Wartość zakupu: {wklad.toFixed(2)} zł
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isProfit ? '#2ecc71' : 'var(--fin-red)' }}>
                              {lastVal.toFixed(2)} zł
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isProfit ? '#2ecc71' : 'var(--fin-red)' }}>
                              {isProfit ? '+' : ''}{diff.toFixed(2)} zł ({isProfit ? '+' : ''}{diffPct.toFixed(2)}%)
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-save"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#1e293b' }}
                            onClick={() => {
                              setSelectedPortfelAkcjaId(akcja.id);
                              setInputPortfelUpdateWartosc('');
                              setIsUpdatePanelOpen(true);
                            }}
                          >
                            📈 Zaktualizuj wartość
                          </button>

                          <button
                            type="button"
                            className="btn-save"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--border)' }}
                            onClick={() => setExpandedHistoryId(isExpanded ? null : akcja.id)}
                          >
                            📜 Historia wpisów ({sortedHist.length + 1}) {isExpanded ? '▲' : '▼'}
                          </button>

                          <button
                            type="button"
                            className="btn-delete-action"
                            onClick={() => usunAkcjeZPortfela(akcja.id)}
                          >
                            🗑️ Usuń akcję
                          </button>
                        </div>

                        {/* Rozwijana historia wpisów */}
                        {isExpanded && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              Historia wartości dla {akcja.nazwa}:
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <span>📅 {akcja.dataZakupu} (Zakup)</span>
                              <span style={{ fontWeight: 'bold' }}>{wklad.toFixed(2)} zł</span>
                            </div>
                            {sortedHist.map(item => (
                              <div
                                key={item.id}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <span>📅 {item.data}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 'bold' }}>{parseFloat(item.wartosc).toFixed(2)} zł</span>
                                  <button
                                    type="button"
                                    className="btn-delete-history-item"
                                    onClick={() => usunWpisHistorii(akcja.id, item.id)}
                                    title="Usuń ten wpis"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card">
              {(() => {
                const selectedStockForChart = chartSelectedStockId !== 'all'
                  ? (baza.portfel || []).find(s => s.id === chartSelectedStockId)
                  : null;

                return (
                  <>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>
                      {chartSelectedStockId === 'all' || !selectedStockForChart
                        ? 'WYKRES ZMIAN PROCENTOWYCH CAŁEGO PORTFELA'
                        : `WYKRES ZMIAN PROCENTOWYCH: ${selectedStockForChart.nazwa.toUpperCase()}`}
                    </h3>
                    <div style={{ height: '340px', position: 'relative' }}>
                      {(baza.portfel || []).length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                          Dodaj pierwsze akcje i ich wyceny, aby wyświetlić wykres zmian procentowych portfela.
                        </div>
                      ) : (
                        <PortfolioPercentageChart portfel={baza.portfel || []} selectedStockId={chartSelectedStockId} />
                      )}
                    </div>

                    {(baza.portfel || []).length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: '600' }}>
                          Pokaż na wykresie:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setChartSelectedStockId('all')}
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: chartSelectedStockId === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)',
                              background: chartSelectedStockId === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                              color: chartSelectedStockId === 'all' ? '#000000' : 'var(--text)',
                              fontWeight: chartSelectedStockId === 'all' ? 'bold' : 'normal',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>💼 Cały portfel</span>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: chartSelectedStockId === 'all' ? '#000000' : (pctPortfela >= 0 ? '#2ecc71' : 'var(--fin-red)') }}>
                              ({pctPortfela >= 0 ? '+' : ''}{pctPortfela.toFixed(2)}%)
                            </span>
                          </button>

                          {(baza.portfel || []).map(akcja => {
                            const wklad = parseFloat(akcja.wartoscZakupu) || 0;
                            const historia = Array.isArray(akcja.historia) ? akcja.historia : [];
                            const sortedHist = [...historia].sort((a, b) => a.data.localeCompare(b.data));
                            const lastVal = sortedHist.length > 0 ? parseFloat(sortedHist[sortedHist.length - 1].wartosc) : wklad;
                            const diff = lastVal - wklad;
                            const diffPct = wklad > 0 ? (diff / wklad) * 100 : 0;
                            const isSelected = chartSelectedStockId === akcja.id;

                            return (
                              <button
                                key={akcja.id}
                                type="button"
                                onClick={() => setChartSelectedStockId(akcja.id)}
                                style={{
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                  background: isSelected ? 'rgba(0, 242, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                                  color: isSelected ? '#00f2ff' : 'var(--text)',
                                  fontWeight: isSelected ? 'bold' : 'normal',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>{akcja.nazwa}</span>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: diffPct >= 0 ? '#2ecc71' : 'var(--fin-red)' }}>
                                  ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}%)
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'stan' ? 'active' : ''}`}>
          <div className="grid-2col">
            <div className="card">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>ZAPISZ AKTUALNE SALDO KONTA</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input type="month" value={inputStanData} onChange={(e) => setInputStanData(e.target.value)} />
                <input type="number" step="0.01" placeholder="0.00 zł" value={inputStanKwota} onChange={(e) => setInputStanKwota(e.target.value)} />
                <button className="btn-save" onClick={dodajStanKonta}>Zapisz</button>
              </div>
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>HISTORIA OSZCZĘDNOŚCI</h3>
              <div className="history-list">
                {baza.stany_konta.map((s, idx) => (
                  <div key={idx} className="history-item" onDoubleClick={() => usunStanKonta(idx)}>
                    <span>{formatujMiesiacRok(s.data)}</span>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>
                  LISTA WYDATKÓW DOMOWYCH (Podwójne kliknięcie usuwa)
                </h3>
                
                {baza.wydatki_domowe.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={oplacWszystkieDomowe}
                      className="btn-save"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        backgroundColor: wszystkieDomoweOplacone ? '#21262d' : 'var(--fin-green)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {wszystkieDomoweOplacone ? '↩️ Odznacz wszystkie' : '✅ Opłać wszystkie'}
                    </button>

                    <button 
                      onClick={usunWszystkieDomowe}
                      className="btn-save"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        backgroundColor: '#b3261e',
                        color: '#000000', /* ZMIENIONO: Kolor napisu na czarny */
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ Usuń wszystkie
                    </button>
                  </div>
                )}
              </div>

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
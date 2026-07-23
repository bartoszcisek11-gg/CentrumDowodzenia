import React, { useState, useEffect } from 'react';
import TabEwidencja from './TabEwidencja';
import TabDyzury from './TabDyzury';
import TabSzkoleniowy from './TabSzkoleniowy';
import TabWypoczynkowy from './TabWypoczynkowy';

export default function WorkView() {
  const [activeTab, setActiveTab] = useState('ewidencja');
  const d = new Date();

  const [meta, setMeta] = useState(() => {
    return JSON.parse(localStorage.getItem('praca_meta')) || {
      imie: '',
      oddzial: '',
      stanowisko: '',
      norma: '7:25-15:00',
      nrKarty: ''
    };
  });

  const [selectRok, setSelectRok] = useState(d.getFullYear());
  const [selectMiesiac, setSelectMiesiac] = useState(d.getMonth());

  const kluczData = `praca_data_${selectRok}_${selectMiesiac}`;

  const [monthData, setMonthData] = useState(() => {
    return JSON.parse(localStorage.getItem(kluczData)) || { ewidencja: [], dyzury: [] };
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(kluczData));
    setMonthData(saved || { ewidencja: [], dyzury: [] });
  }, [kluczData]);

  useEffect(() => {
    localStorage.setItem('praca_meta', JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem(kluczData, JSON.stringify(monthData));
  }, [monthData, kluczData]);

  const [szkWniosek, setSzkWniosek] = useState(() => {
    return JSON.parse(localStorage.getItem('praca_szkoleniowy_v4')) || {
      wniosekNr: '', stanowisko: '', komorka: '', miejscowosc: '', tytul: '', termin: '',
      cel: '', kwotaPrzejazd: '', kwotaSzkolenie: '', kwotaRazem: '', innePowody: '',
      planTak: false, potrzebTak: true
    };
  });

  useEffect(() => {
    localStorage.setItem('praca_szkoleniowy_v4', JSON.stringify(szkWniosek));
  }, [szkWniosek]);

  const [wypData, setWypData] = useState(() => {
    const pad = num => String(num).padStart(2, '0');
    return JSON.parse(localStorage.getItem('praca_wypoczynkowy_v2')) || {
      miejscowoscData: `dnia ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
      stanowisko: '', oddzial: '', adresatOrg: '', rokUrlopu: d.getFullYear(), okresUrlopu: '', dniIlosc: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('praca_wypoczynkowy_v2', JSON.stringify(wypData));
  }, [wypData]);

  const handleCellChangeEwidencja = (rowIdx, colIdx, val, isWeekend) => {
    const newEwidencja = [...(monthData.ewidencja || [])];
    if (!newEwidencja[rowIdx]) {
      newEwidencja[rowIdx] = Array(21).fill('');
      if (!isWeekend) {
        newEwidencja[rowIdx][0] = '7:35';
        newEwidencja[rowIdx][1] = '07:25';
        newEwidencja[rowIdx][2] = '15:00';
      }
    }
    
    newEwidencja[rowIdx][colIdx] = val;

    // Logika czyszczenia przy wpisaniu nieobecnosci (Uw=kolumna 8, Del=kolumna 14)
    const uwVal = (newEwidencja[rowIdx][8] || '').trim().toUpperCase();
    const delVal = (newEwidencja[rowIdx][14] || '').trim().toUpperCase();

    if (uwVal === 'X' || delVal === 'X') {
      newEwidencja[rowIdx][0] = '';
      newEwidencja[rowIdx][1] = '';
      newEwidencja[rowIdx][2] = '';
      newEwidencja[rowIdx][7] = ''; // dyżur
    } else {
      if (!isWeekend) {
        if (!newEwidencja[rowIdx][0]) newEwidencja[rowIdx][0] = '7:35';
        if (!newEwidencja[rowIdx][1]) newEwidencja[rowIdx][1] = '07:25';
        if (!newEwidencja[rowIdx][2]) newEwidencja[rowIdx][2] = '15:00';
      }
    }

    setMonthData(prev => ({ ...prev, ewidencja: newEwidencja }));
  };

  const handleDyzurChange = (rowIdx, colIdx, val) => {
    const newDyzury = [...(monthData.dyzury || [])];
    if (!newDyzury[rowIdx]) newDyzury[rowIdx] = [];
    newDyzury[rowIdx][colIdx] = val;
    setMonthData(prev => ({ ...prev, dyzury: newDyzury }));
  };

  const czyscMiesiac = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić wpisy dla wybranego miesiąca?')) {
      localStorage.removeItem(kluczData);
      setMonthData({ ewidencja: [], dyzury: [] });
    }
  };

  const drukujAktywny = () => {
    let styleSheet = document.getElementById('printPageOrientationStyle');
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'printPageOrientationStyle';
      document.head.appendChild(styleSheet);
    }
    if (activeTab === 'ewidencja') {
      styleSheet.innerHTML = '@media print { @page { size: A4 landscape; margin: 0; } }';
    } else {
      styleSheet.innerHTML = '@media print { @page { size: A4 portrait; margin: 0; } }';
    }
    window.print();
  };

  return (
    <div id="app-4">
      <div className="praca-container">
        <div className="praca-nav-headers">
          <button className={`praca-nav-tab ${activeTab === 'ewidencja' ? 'active' : ''}`} onClick={() => setActiveTab('ewidencja')}>Ewidencja pracy</button>
          <button className={`praca-nav-tab ${activeTab === 'dyzury' ? 'active' : ''}`} onClick={() => setActiveTab('dyzury')}>Godziny dyżurowe</button>
          <button className={`praca-nav-tab ${activeTab === 'szkoleniowy' ? 'active' : ''}`} onClick={() => setActiveTab('szkoleniowy')}>Urlop szkoleniowy</button>
          <button className={`praca-nav-tab ${activeTab === 'wypoczynkowy' ? 'active' : ''}`} onClick={() => setActiveTab('wypoczynkowy')}>Urlop wypoczynkowy</button>
        </div>

        <div id="ewidencja" className={`praca-tab-content ${activeTab === 'ewidencja' ? 'active' : ''}`}>
          <TabEwidencja 
            meta={meta} 
            setMeta={setMeta} 
            selectRok={selectRok} 
            setSelectRok={setSelectRok} 
            selectMiesiac={selectMiesiac} 
            setSelectMiesiac={setSelectMiesiac} 
            tableData={monthData.ewidencja || []} 
            onCellChange={handleCellChangeEwidencja} 
          />
        </div>

        <div id="dyzury" className={`praca-tab-content ${activeTab === 'dyzury' ? 'active' : ''}`}>
          <TabDyzury 
            meta={meta} 
            setMeta={setMeta} 
            selectRok={selectRok} 
            selectMiesiac={selectMiesiac} 
            dyzuryData={monthData.dyzury || []} 
            onDyzurChange={handleDyzurChange} 
            razemVal={(monthData.dyzury && monthData.dyzury[9]) ? monthData.dyzury[9][0] : ''} 
          />
        </div>

        <div id="szkoleniowy" className={`praca-tab-content ${activeTab === 'szkoleniowy' ? 'active' : ''}`}>
          <TabSzkoleniowy meta={meta} setMeta={setMeta} szkWniosek={szkWniosek} setSzkWniosek={setSzkWniosek} />
        </div>

        <div id="wypoczynkowy" className={`praca-tab-content ${activeTab === 'wypoczynkowy' ? 'active' : ''}`}>
          <TabWypoczynkowy meta={meta} setMeta={setMeta} wypData={wypData} setWypData={setWypData} />
        </div>

        <div className="praca-actions">
          <button type="button" className="praca-btn praca-btn-danger" onClick={czyscMiesiac}>Wyczyść ten miesiąc</button>
          <button type="button" className="praca-btn praca-btn-primary" onClick={drukujAktywny}>🖨️ Drukuj Aktywną Sekcję</button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

export default function TabSzkoleniowy({ meta, setMeta, szkWniosek, setSzkWniosek }) {
  const handleInputChange = (field, val) => {
    setSzkWniosek(prev => ({ ...prev, [field]: val }));
  };

  const handleKwotaChange = (field, val) => {
    const newWniosek = { ...szkWniosek, [field]: val };
    const pStr = (newWniosek.kwotaPrzejazd || '').replace(/[^0-9,.]/g, '').replace(',', '.');
    const sStr = (newWniosek.kwotaSzkolenie || '').replace(/[^0-9,.]/g, '').replace(',', '.');
    const p = parseFloat(pStr) || 0;
    const s = parseFloat(sStr) || 0;
    newWniosek.kwotaRazem = (p + s) > 0 ? (p + s) + ' zł' : '';
    setSzkWniosek(newWniosek);
  };

  return (
    <div className="karta-szkoleniowy">
      <div className="szkoleniowy-zalacznik">
        Załącznik nr 2 do Procedury podnoszenia kwalifikacji przez pracowników COM
      </div>

      <table className="szkoleniowy-main-table">
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '50%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td>
              Wypełnia pracownik DON:<br />
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <strong>WNIOSEK nr</strong>{' '}
                <input 
                  type="text" 
                  style={{ width: '180px', borderBottom: '1px dotted #000' }} 
                  value={szkWniosek.wniosekNr} 
                  onChange={(e) => handleInputChange('wniosekNr', e.target.value)} 
                /><br />
                <strong>na udział w szkoleniu zewnętrznym</strong>
              </div>
            </td>
            <td style={{ textAlign: 'center', fontSize: '10px' }}>
              Data i godzina złożenia wniosku w Dziala Organizacji i Nadzoru<br /><br />
              ...........................................................................<br />
              podpis pracownika DON
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="szkoleniowy-sec-header">DANE PERSONALNE PRACOWNIKA</td>
          </tr>
          <tr>
            <td><strong>Imię i nazwisko osoby wyjeżdżającej</strong></td>
            <td>
              <input 
                type="text" 
                className="input-imie" 
                value={meta.imie} 
                onChange={(e) => setMeta({ ...meta, imie: e.target.value })} 
              />
            </td>
          </tr>
          <tr>
            <td><strong>Zajmowane stanowisko</strong></td>
            <td>
              <input 
                type="text" 
                value={meta.stanowisko} 
                onChange={(e) => setMeta({ ...meta, stanowisko: e.target.value })} 
              />
            </td>
          </tr>
          <tr>
            <td><strong>Miejsce pracy (komórka organizacyjna)</strong></td>
            <td>
              <input 
                type="text" 
                value={meta.oddzial} 
                onChange={(e) => setMeta({ ...meta, oddzial: e.target.value })} 
              />
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="szkoleniowy-sec-header">DANE DOTYCZĄCE WYJAZDU</td>
          </tr>
          <tr>
            <td><strong>Miejscowość</strong></td>
            <td><input type="text" value={szkWniosek.miejscowosc} onChange={(e) => handleInputChange('miejscowosc', e.target.value)} /></td>
          </tr>
          <tr>
            <td><strong>Tytuł konferencji, zjazdu, kursu, seminarium, szkolenia i inne</strong></td>
            <td><input type="text" value={szkWniosek.tytul} onChange={(e) => handleInputChange('tytul', e.target.value)} /></td>
          </tr>
          <tr>
            <td><strong>Termin wyjazdu – termin powrotu</strong></td>
            <td><input type="text" value={szkWniosek.termin} onChange={(e) => handleInputChange('termin', e.target.value)} /></td>
          </tr>
          <tr>
            <td><strong>Cel wyjazdu (m. in. dołączyć kopie zaproszenia, oraz inne dane uzasadniające wyjazd)</strong></td>
            <td><input type="text" value={szkWniosek.cel} onChange={(e) => handleInputChange('cel', e.target.value)} /></td>
          </tr>
        </tbody>
      </table>

      <div className="szkoleniowy-punkty">
        Zgodnie z obowiązującą procedurą zwracam się z prośbą o:<br />
        <div style={{ marginLeft: '20px' }}>
          1) *zwolnienie z całości lub części dnia pracy z prawem do wynagrodzenia<br />
          2) *zwrot kosztów przejazdu w wysokości:{' '}
          <input 
            type="text" 
            style={{ width: '80px', borderBottom: '1px dotted #000', fontWeight: 'bold' }} 
            value={szkWniosek.kwotaPrzejazd} 
            onChange={(e) => handleKwotaChange('kwotaPrzejazd', e.target.value)} 
          /><br />
          3) *o dofinansowanie kosztów szkolenia w wysokości:{' '}
          <input 
            type="text" 
            style={{ width: '80px', borderBottom: '1px dotted #000', fontWeight: 'bold' }} 
            value={szkWniosek.kwotaSzkolenie} 
            onChange={(e) => handleKwotaChange('kwotaSzkolenie', e.target.value)} 
          />
        </div>
      </div>

      <div className="szkoleniowy-razem-box">
        RAZEM:{' '}
        <input 
          type="text" 
          style={{ width: '100px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }} 
          value={szkWniosek.kwotaRazem} 
          onChange={(e) => handleInputChange('kwotaRazem', e.target.value)} 
        />
      </div>

      <div className="szkoleniowy-podpis-pracownika">
        <div className="line">data i podpis pracownika</div>
      </div>

      <div className="szkoleniowy-sekcja-opinia">
        <div className="title-bar">OPINIA I ZGODA BEZPOŚREDNIEGO PRZEŁOŻONEGO</div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', background: '#fafafa', borderBottom: '1px solid #000', padding: '2px' }}>
          INFORMACJE DODATKOWE
        </div>

        <table className="szkoleniowy-opinia-table">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '60%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan="3">Skierowanie pracownika na szkolenie</td>
              <td>
                w ramach realizacji rocznego planu szkoleniowego{' '}
                <span className={`toggle-opt ${szkWniosek.planTak ? 'disabled' : ''}`} onClick={() => handleInputChange('planTak', !szkWniosek.planTak)}>TAK</span>* /{' '}
                <span className={`toggle-opt ${!szkWniosek.planTak ? 'disabled' : ''}`} onClick={() => handleInputChange('planTak', !szkWniosek.planTak)}>NIE</span>*
              </td>
            </tr>
            <tr>
              <td>
                wynikające z bieżących potrzeb{' '}
                <span className={`toggle-opt ${szkWniosek.potrzebTak ? 'disabled' : ''}`} onClick={() => handleInputChange('potrzebTak', !szkWniosek.potrzebTak)}>TAK</span>* /{' '}
                <span className={`toggle-opt ${!szkWniosek.potrzebTak ? 'disabled' : ''}`} onClick={() => handleInputChange('potrzebTak', !szkWniosek.potrzebTak)}>NIE</span>*
              </td>
            </tr>
            <tr>
              <td>
                inne (wymienić jakie):{' '}
                <input 
                  type="text" 
                  style={{ width: '70%', fontWeight: 'bold' }} 
                  value={szkWniosek.innePowody} 
                  onChange={(e) => handleInputChange('innePowody', e.target.value)} 
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="szkoleniowy-podpis-przelozonego">
          <div className="line">data, podpis, pieczątka bezpośredniego przełożonego</div>
        </div>

        <div className="szkoleniowy-akceptacja">
          <strong>AKCEPTACJA:</strong> podpis Z-cy Dyrektora ds. Lecznictwa / Naczelnej Pielęgniarki
        </div>
      </div>

      <div className="szkoleniowy-decyzja-box">
        <div className="title-bar">DECYZJA DYREKTORA</div>
        <div className="szkoleniowy-decyzja-body">
          <strong>WYRAŻAM ZGODĘ* / NIE WYRAŻAM ZGODY*:</strong>
          <br /><br /><br />
          <div style={{ textAlign: 'center' }}>
            ...........................................................................<br />
            <span style={{ fontSize: '9px' }}>data i podpis</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '9px', marginTop: '10px' }}>
        *zakreślić właściwe
      </div>
    </div>
  );
}
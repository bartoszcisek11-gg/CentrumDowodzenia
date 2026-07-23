import React from 'react';
import { PRACA_MIESIACE_NAZWY, pracaParsujCzas } from '../../utils/dateUtils';

export default function TabDyzury({ meta, setMeta, selectRok, selectMiesiac, dyzuryData, onDyzurChange, razemVal }) {
  const rows = [];
  let sumaMinut = 0;

  for (let i = 0; i < 9; i++) {
    const row = dyzuryData[i] || ['', '', '', '', ''];
    const dyzMin = pracaParsujCzas(row[3]);
    if (dyzMin !== null) sumaMinut += dyzMin;

    rows.push(
      <tr key={i}>
        <td>{i + 1}.</td>
        <td><input type="text" value={row[0] || ''} onChange={(e) => onDyzurChange(i, 0, e.target.value)} /></td>
        <td><input type="text" value={row[1] || ''} onChange={(e) => onDyzurChange(i, 1, e.target.value)} /></td>
        <td><input type="text" value={row[2] || ''} onChange={(e) => onDyzurChange(i, 2, e.target.value)} /></td>
        <td><input type="text" value={row[3] || ''} onChange={(e) => onDyzurChange(i, 3, e.target.value)} /></td>
        <td><input type="text" value={row[4] || ''} onChange={(e) => onDyzurChange(i, 4, e.target.value)} /></td>
      </tr>
    );
  }

  let calculatedSuma = '';
  if (sumaMinut > 0) {
    const h = Math.floor(sumaMinut / 60);
    const m = sumaMinut % 60;
    calculatedSuma = `${h}:${String(m).padStart(2, '0')}`;
  }

  return (
    <div className="karta-dyzury">
      <div className="dyzury-title-area">
        <h2>WYKAZ GODZIN DO NALICZENIA WYNAGRODZENIA ZA DYŻURY</h2>
        <div className="sub">/podstawa do dokonania naliczenia i wypłaty wynagrodzeń/</div>
      </div>

      <div className="dyzury-meta-grid">
        <div>
          <input 
            type="text" 
            className="input-imie" 
            style={{ fontWeight: 'bold', width: '250px' }} 
            value={meta.imie} 
            onChange={(e) => setMeta({ ...meta, imie: e.target.value })} 
          />
        </div>
        <div>{PRACA_MIESIACE_NAZWY[selectMiesiac]} {selectRok}</div>
      </div>

      <table className="dyzury-table">
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan="2">Lp.</th>
            <th rowSpan="2">Data<br />Dyżuru</th>
            <th colSpan="2">Dyżur w godzinach</th>
            <th rowSpan="2">Ilość godzin<br />dyżuru</th>
            <th rowSpan="2"></th>
          </tr>
          <tr>
            <th>Od godz.</th>
            <th>Do godz.</th>
          </tr>
        </thead>
        <tbody>
          {rows}
          <tr>
            <th colSpan="4" style={{ textAlign: 'center', fontWeight: 'bold' }}>Razem:</th>
            <td>
              <input 
                type="text" 
                style={{ fontWeight: 'bold' }} 
                value={razemVal || calculatedSuma} 
                onChange={(e) => onDyzurChange(9, 0, e.target.value)} 
              />
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="dyzury-signatures">
        <div className="dyzury-signature-item">Podpis Lekarza Dyżurującego</div>
        <div className="dyzury-signature-item">Podpis Lekarza Kierującego Oddziałem</div>
        <div className="dyzury-signature-item">Podpis Z-cy Dyrektora ds. Lecznictwa</div>
      </div>
    </div>
  );
}
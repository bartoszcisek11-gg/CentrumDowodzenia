import React from 'react';

export default function TabEwidencja({ 
  meta, 
  setMeta, 
  selectRok, 
  setSelectRok, 
  selectMiesiac, 
  setSelectMiesiac, 
  tableData, 
  onCellChange 
}) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 3; i++) years.push(i);

  const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const iloscDni = new Date(selectRok, selectMiesiac + 1, 0).getDate();
  const dniNazwy = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb'];

  const rows = [];
  for (let dzien = 1; dzien <= iloscDni; dzien++) {
    const dateObj = new Date(selectRok, selectMiesiac, dzien);
    const dayIndex = dateObj.getDay();
    const dayName = dniNazwy[dayIndex];
    const isWeekend = (dayIndex === 0 || dayIndex === 6);
    const savedRow = tableData[dzien - 1] || [];

    const getVal = (colIdx) => {
      if (savedRow[colIdx] !== undefined) return savedRow[colIdx];
      if (isWeekend) return '';
      if (colIdx === 0) return '7:35';
      if (colIdx === 1) return '07:25';
      if (colIdx === 2) return '15:00';
      return '';
    };

    rows.push(
      <tr key={dzien}>
        <td>{dzien}</td>
        <td style={{ fontWeight: isWeekend ? 'bold' : 'normal' }}>{dayName}</td>
        {Array.from({ length: 21 }).map((_, colIdx) => (
          <td key={colIdx}>
            <input 
              type="text" 
              value={getVal(colIdx)} 
              onChange={(e) => onCellChange(dzien - 1, colIdx, e.target.value, isWeekend)}
            />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="karta-ewidencji">
      <div className="header-grid-ewidencja">
        <div>
          <div style={{ height: '25px' }}></div>
          <div className="box-normatywna">
            <div className="title">NORMATYW CZASU PRACY</div>
            <div className="box-normatywna-inner">
              <div><span style={{ textDecoration: 'underline' }}>Pon-pt</span><br />w dniach</div>
              <div>
                <input type="text" value={meta.norma} style={{ width: '100%', textAlign: 'center' }} onChange={(e) => setMeta({ ...meta, norma: e.target.value })} /><br />
                w godzinach
              </div>
            </div>
          </div>
        </div>

        <div className="title-section-ewidencja">
          <h1>KARTA EWIDENCJI CZASU PRACY</h1>
          <div className="sub">
            <input type="text" className="input-oddzial" value={meta.oddzial} onChange={(e) => setMeta({ ...meta, oddzial: e.target.value })} />
          </div>
          <div style={{ marginTop: '6px' }}>
            <input type="text" className="person-info input-imie" value={meta.imie} onChange={(e) => setMeta({ ...meta, imie: e.target.value })} /><br />
            <input type="text" className="person-info" style={{ marginTop: '2px' }} value={meta.stanowisko} onChange={(e) => setMeta({ ...meta, stanowisko: e.target.value })} />
            <div className="person-label">(imię i nazwisko oraz stanowisko pracy)</div>
          </div>
        </div>

        <div>
          <div className="box-nr-karty">
            <div className="row">Nr karty <input type="text" style={{ width: '40px', textAlign: 'center' }} value={meta.nrKarty} onChange={(e) => setMeta({ ...meta, nrKarty: e.target.value })} /></div>
            <div className="row">
              <select className="select-clean" value={selectRok} onChange={(e) => setSelectRok(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select><br />Rok
            </div>
            <div className="row">
              <select className="select-clean" value={selectMiesiac} onChange={(e) => setSelectMiesiac(Number(e.target.value))}>
                {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
              </select><br />Miesiąc
            </div>
          </div>
        </div>
      </div>

      <table className="ewidencja-table">
        <colgroup>
          <col style={{ width: '2.2%' }} />
          <col style={{ width: '3.5%' }} />
          <col style={{ width: '3.5%' }} />
          <col style={{ width: '4.2%' }} />
          <col style={{ width: '4.2%' }} />
          <col style={{ width: '5.0%' }} />
          <col style={{ width: '6.0%' }} />
          <col style={{ width: '3.5%' }} />
          <col style={{ width: '5.0%' }} />
          <col style={{ width: '4.5%' }} />
          <col style={{ width: '2.7%' }} span="10" />
          <col style={{ width: '4.5%' }} />
          <col style={{ width: '4.5%' }} />
          <col style={{ width: '4.5%' }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan="2">OZNACZENIE DNIA</th>
            <th colSpan="3">FAKTYCZNY CZAS PRACY</th>
            <th colSpan="5">CZAS PRZEPRACOWANY W GODZINACH<br />-ODPOWIEDNIO</th>
            <th colSpan="10">CZAS NIEOBECNOŚCI W PRACY W GODZINACH<br /><span style={{ fontSize: '7.5px' }}>według przyczyn</span></th>
            <th colSpan="3">DODATKOWE DANE<br /><span style={{ fontSize: '7.5px' }}>według potrzeb</span></th>
          </tr>
          <tr>
            <th>dzień miesiąca</th>
            <th>dzień tygodnia</th>
            <th>nom czas prac w godz</th>
            <th colSpan="2">w godzinach<br />od do</th>
            <th>w niedziele i święta</th>
            <th>w dni wolne wynikające z 5-dniowego tyg. pracy</th>
            <th>w porze nocne</th>
            <th>w godz. nadliczbowych</th>
            <th>na dyżurze</th>
            <th>Uw</th>
            <th>Uo</th>
            <th>Ub</th>
            <th>Ch</th>
            <th>Op</th>
            <th>NU</th>
            <th>Del</th>
            <th>NN</th>
            <th>Um</th>
            <th>Uwy</th>
            <th>Godz. nadliczbowe 50%</th>
            <th>Godz. nadliczbowe 100%</th>
            <th>Czas pracy młod. ***)</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>

      <div className="legenda">
        *) bliższe oznaczenie dnia, np. święto, **) w dniach lub godzinach, ***) przy pracach wzbronionych w przygotowaniu zawodowym zawodu <strong>Uw</strong> – urlop wypoczynkowy, <strong>Uo</strong> – urlop okolicznościowy i inne zwolnienia przysługujące pracownikowi, <strong>Ub</strong> – urlop bezpłatny, <strong>Ch</strong> – choroba pracownika, <strong>Op</strong> – opieka nad chorym członkiem rodziny, <strong>NU</strong> – inna nieobecność usprawiedliwiona, <strong>Del</strong> – delegacja, <strong>NN</strong> – nieobecność nieusprawiedliwiona, <strong>Um</strong> – urlop macierzyński, <strong>Uwy</strong> – urlop wychowawczy
      </div>

      <div className="signatures-ewidencja">
        <div className="signature-line-ewidencja">Podpis pracownika</div>
        <div className="signature-line-ewidencja">Podpis Kierownika/Ordynatora</div>
      </div>
    </div>
  );
}
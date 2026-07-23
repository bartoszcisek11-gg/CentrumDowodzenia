import React from 'react';

export default function TabWypoczynkowy({ meta, setMeta, wypData, setWypData }) {
  const handleInputChange = (field, val) => {
    setWypData(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="karta-wypoczynkowy">
      <div className="wypoczynkowy-tytul">WNIOSEK URLOPOWY</div>

      <div className="wypoczynkowy-data-line">
        <input 
          type="text" 
          className="wypoczynkowy-linia-input" 
          style={{ width: '250px', textAlign: 'right' }} 
          value={wypData.miejscowoscData} 
          onChange={(e) => handleInputChange('miejscowoscData', e.target.value)} 
        />
      </div>

      <div className="wypoczynkowy-wnioskodawca-box">
        <input 
          type="text" 
          className="input-imie" 
          style={{ width: '100%' }} 
          value={meta.imie} 
          onChange={(e) => setMeta({ ...meta, imie: e.target.value })} 
        /><br />
        <input 
          type="text" 
          style={{ width: '100%' }} 
          value={meta.stanowisko} 
          onChange={(e) => setMeta({ ...meta, stanowisko: e.target.value })} 
        /><br />
        <input 
          type="text" 
          style={{ width: '100%' }} 
          value={meta.oddzial} 
          onChange={(e) => setMeta({ ...meta, oddzial: e.target.value })} 
        />
      </div>

      <div className="wypoczynkowy-adresat-box">
        <input 
          type="text" 
          style={{ width: '100%', textAlign: 'right', fontWeight: 'bold' }} 
          value={wypData.adresatOrg} 
          onChange={(e) => handleInputChange('adresatOrg', e.target.value)} 
        />
      </div>

      <div className="wypoczynkowy-tresc">
        Proszę o udzielenie urlopu wypoczynkowego za rok{' '}
        <input 
          type="text" 
          className="wypoczynkowy-linia-input" 
          style={{ width: '50px', textAlign: 'center' }} 
          value={wypData.rokUrlopu} 
          onChange={(e) => handleInputChange('rokUrlopu', e.target.value)} 
        />{' '}
        w dniu/okresie{' '}
        <input 
          type="text" 
          className="wypoczynkowy-linia-input" 
          style={{ width: '160px', textAlign: 'center' }} 
          value={wypData.okresUrlopu} 
          onChange={(e) => handleInputChange('okresUrlopu', e.target.value)} 
        />{' '}
        w ilości{' '}
        <input 
          type="text" 
          className="wypoczynkowy-linia-input" 
          style={{ width: '40px', textAlign: 'center' }} 
          value={wypData.dniIlosc} 
          onChange={(e) => handleInputChange('dniIlosc', e.target.value)} 
        />{' '}
        dnia/dni roboczych.
      </div>

      <div className="wypoczynkowy-podpisy-grid">
        <div className="wypoczynkowy-podpis-item">
          ............................................................<br />
          <span style={{ fontSize: '10px' }}>podpis bezpośredniego przełożonego</span>
        </div>
        <div className="wypoczynkowy-podpis-item">
          ............................................................<br />
          <span style={{ fontSize: '10px' }}>podpis pracownika</span>
        </div>
      </div>
    </div>
  );
}
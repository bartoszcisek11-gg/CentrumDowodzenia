import React from 'react';
import RadioIcon from './RadioIcon';
import { useRadio } from './RadioContext';

export default function RadioZet() {
  const {
    selectedStation,
    STATIONS,
    isPlaying,
    isLoading,
    errorMsg,
    togglePlay,
    handleStationChange
  } = useRadio();

  return (
    <div className="radiozet-widget-container">
      {/* Główna czarna karta */}
      <div className="radiozet-main-card">
        {/* Lewa strona: Logo stacji + Tytuł i opis */}
        <div className="radiozet-left-brand">
          <div className="radiozet-transparent-logo">
            <RadioIcon style={{ width: '44px', height: '44px' }} />
          </div>
          <div className="radiozet-text-group">
            <span className="radiozet-station-title">{selectedStation.name}</span>
            <span className="radiozet-station-tagline">{selectedStation.tagline}</span>
          </div>
        </div>

        {/* Środek: Okrągły przycisk Odtwarzaj (Play) */}
        <button
          type="button"
          className={`radiozet-circle-play-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={togglePlay}
          title={isPlaying ? 'Zatrzymaj radio' : 'Odtwórz radio na żywo'}
        >
          {isLoading ? (
            <span className="radiozet-loader-icon">⌛</span>
          ) : isPlaying ? (
            <span className="radiozet-pause-symbol">❚❚</span>
          ) : (
            <span className="radiozet-play-symbol">▶</span>
          )}
        </button>

        {/* Prawa strona: Rozwijana lista (wybór stacji) */}
        <div className="radiozet-right-selector">
          <select 
            className="radiozet-cyan-select"
            value={selectedStation.id} 
            onChange={(e) => handleStationChange(e.target.value)}
          >
            {STATIONS.map(station => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Błędy transmisji */}
      {errorMsg && (
        <div className="radiozet-subbar">
          <div className="radiozet-mini-error">
            <span>⚠️ {errorMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

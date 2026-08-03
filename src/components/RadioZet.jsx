import React, { useState, useRef, useEffect } from 'react';
import RadioIcon from './RadioIcon';

const STATIONS = [
  {
    id: 'radiozet-main',
    name: 'Radio ZET',
    badge: 'ZET',
    badgeClass: 'badge-zet',
    tagline: 'Słuchaj na żywo',
    streams: [
      'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ZET.mp3',
      'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ZETAAC.aac',
      'https://25233.live.streamtheworld.com/RADIO_ZET.mp3',
      'https://25233.live.streamtheworld.com/RADIO_ZETAAC.aac',
      'https://stream.radiozet.pl/radiozet.mp3'
    ]
  },
  {
    id: 'antyradio',
    name: 'Antyradio',
    badge: 'ANTY',
    badgeClass: 'badge-anty',
    tagline: 'Najlepszy rock na świecie',
    streams: [
      'https://playerservices.streamtheworld.com/api/livestream-redirect/ANTYRADIO.mp3',
      'https://playerservices.streamtheworld.com/api/livestream-redirect/ANTYRADIOAAC.aac',
      'https://stream.antyradio.pl/antyradio.mp3'
    ]
  }
];

export default function RadioZet() {
  const [selectedStation, setSelectedStation] = useState(STATIONS[0]);
  const [streamIndex, setStreamIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const audioRef = useRef(null);

  const currentStreamUrl = selectedStation.streams[streamIndex] || selectedStation.streams[0];

  const handleNextStreamOrFail = () => {
    setIsLoading(false);
    if (streamIndex < selectedStation.streams.length - 1) {
      setStreamIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setErrorMsg('Transmisja niedostępna bezpośrednio w przeglądarce.');
    }
  };

  const togglePlay = () => {
    setErrorMsg(null);
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      audioRef.current.src = currentStreamUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Błąd odtwarzania:', err);
            handleNextStreamOrFail();
          });
      }
    }
  };

  const handleStationChange = (e) => {
    const stationId = e.target.value;
    const found = STATIONS.find(s => s.id === stationId);
    if (found) {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setSelectedStation(found);
      setStreamIndex(0);
      setErrorMsg(null);
    }
  };

  return (
    <div className="radiozet-widget-container">
      <audio
        ref={audioRef}
        src={currentStreamUrl}
        preload="none"
        crossOrigin="anonymous"
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onError={handleNextStreamOrFail}
      />

      {/* Główna czarna karta jak na zrzucie ekranu */}
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
            onChange={handleStationChange}
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

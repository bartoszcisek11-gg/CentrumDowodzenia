import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export const STATIONS = [
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

const RadioContext = createContext(null);

export function RadioProvider({ children }) {
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

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.src = currentStreamUrl;
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.error('Błąd odtwarzania:', err);
        handleNextStreamOrFail();
      });
    }
  }, [streamIndex]);

  const togglePlay = () => {
    setErrorMsg(null);
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      if (audioRef.current.src !== currentStreamUrl) {
        audioRef.current.src = currentStreamUrl;
      }
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

  const handleStationChange = (stationId) => {
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
    <RadioContext.Provider
      value={{
        selectedStation,
        STATIONS,
        isPlaying,
        isLoading,
        errorMsg,
        togglePlay,
        handleStationChange
      }}
    >
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
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}

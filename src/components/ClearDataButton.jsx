import React, { useState } from 'react';

export default function ClearDataButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClearAll = () => {
    const confirmed = window.confirm(
      '⚠️ OSTRZEŻENIE:\nCzy na pewno chcesz usunąć wszystkie dane z aplikacji?\nTej operacji nie można cofnąć, chyba że masz plik kopii zapasowej JSON.'
    );

    if (confirmed) {
      localStorage.clear();
      sessionStorage.clear();
      alert('Wszystkie dane zostały usunięte.');
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleClearAll}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="btn-clear-all"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999,
        padding: '8px 14px',
        backgroundColor: isHovered ? '#b3261e' : '#21262d',
        color: isHovered ? '#ffffff' : '#f85149',
        border: isHovered ? '1px solid #f85149' : '1px solid #363b42',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.2s ease'
      }}
      title="Wyczyść całą bazę danych"
    >
      🗑️ Wyczyść dane
    </button>
  );
}
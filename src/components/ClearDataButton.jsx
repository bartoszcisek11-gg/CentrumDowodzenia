import React from 'react';

export default function ClearDataButton() {
  const handleClear = () => {
    const potwierdzenie = window.confirm(
      "⚠️ OSTRZEŻENIE:\nCzy na pewno chcesz bezpowrotnie usunąć WSZYSTKIE dane zapisane na tym komputerze (Finanse, Staż, Notatki itp.)?\n\nPrzed usunięciem warto pobrać kopię zapasową przyciskiem 'Eksport danych'."
    );
    if (potwierdzenie) {
      localStorage.clear();
      alert("Wszystkie dane zostały pomyślnie usunięte!");
      window.location.reload();
    }
  };

  return (
    <button 
      className="btn-clear-all" 
      onClick={handleClear} 
      title="Usuwa wszystkie zapisane dane na tym komputerze"
    >
      🗑️ Wyczyść wszystkie dane
    </button>
  );
}
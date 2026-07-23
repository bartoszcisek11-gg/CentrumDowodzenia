import React from 'react';

export default function ModalRules({ onClose }) {
  return (
    <div className="modal-overlay active" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Zasady obliczania czasu stażu</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <ul>
            <li><strong>1 tydzień stażu = 5 dni roboczych</strong> (od poniedziałku do piątku). Soboty i niedziele są automatycznie pomijane przy wyliczaniu harmonogramu.</li>
            <li><strong>Rozpoczęcie stażu cząstkowego:</strong> Staż rozpoczyna się pierwszego dnia roboczego wyznaczonego harmonogramem. Każdy kolejny staż cząstkowy rozpoczyna się płynnie w pierwszym wolnym dniu roboczym po zakończeniu poprzedniego.</li>
            <li><strong>Urlopy i kursy (Wydłużenia):</strong> Dodanie nieobecności w wymiarze X dni roboczych przesuwa przewidywaną datę zakończenia danego stażu o dokładnie X dni roboczych.</li>
            <li><strong>Kaskadowe przesuwanie terminów:</strong> Wszelkie wydłużenia automatycznie przesuwają daty początkowe i końcowe wszystkich kolejnych staży cząstkowych.</li>
            <li><strong>Dni wolne od pracy i święta:</strong> W przypadku świąt ustawowo wolnych wypadających w tygodniu, możesz dodać korektę w formie wydarzenia (+1 dzień roboczy) w danym module.</li>
          </ul>

          <div className="rules-callout">
            <strong>Wskazówka dotycząca ciągłości:</strong> Pamiętaj, że łączny czas trwania stażu podyplomowego oraz dopuszczalny wymiar nieobecności określa aktualne Rozporządzenie Ministra Zdrowia w sprawie stażu podyplomowego lekarza i lekarza dentysty.
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px' }}>Rozumiem</button>
        </div>
      </div>
    </div>
  );
}
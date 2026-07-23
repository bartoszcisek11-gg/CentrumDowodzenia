export const PRACA_DNI_NAZWY = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb'];
export const PRACA_MIESIACE_NAZWY = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export function dodajDniRobocze(dataStart, dniDoDodania) {
  let aktualnaData = new Date(dataStart);
  let dodaneDni = 0;
  while (dodaneDni < dniDoDodania) {
    aktualnaData.setDate(aktualnaData.getDate() + 1);
    const dzienTygodnia = aktualnaData.getDay();
    if (dzienTygodnia !== 0 && dzienTygodnia !== 6) dodaneDni++;
  }
  return aktualnaData;
}

export function policzDniRoboczeMiedzy(start, end) {
  let cur = new Date(start);
  const target = new Date(end);
  let count = 0;
  while (cur <= target) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function formatujDate(dataStr) {
  if (!dataStr) return '-';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function pracaParsujCzas(str) {
  if (!str || !str.includes(':')) return null;
  const parts = str.trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function pracaFormatujCzas(minuty) {
  let m = minuty % (24 * 60);
  if (m < 0) m += 24 * 60;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function pracaObliczKoniecDyzuru(startStr, czasDyzuruStr) {
  const startMin = pracaParsujCzas(startStr);
  const dyzurMin = pracaParsujCzas(czasDyzuruStr);
  if (startMin === null || dyzurMin === null) return '';
  return pracaFormatujCzas(startMin + dyzurMin);
}
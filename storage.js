// Один ключ приложения. Не трогаем весь localStorage.
const STORAGE_KEY = 'camping-bookings-v1';
const KNOWN_IDS = new Set(['p1','p2','p3','p4','p5','p6','p7','p8']);

export function loadBookings() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { bookings: [], error: 'Браузер запретил доступ к хранилищу. Брони не сохранятся.' };
  }
  if (!raw) return { bookings: [], error: null };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { bookings: [], error: 'Сохранённые брони повреждены и были сброшены.' };
  }
  if (!Array.isArray(parsed)) {
    return { bookings: [], error: 'Сохранённые брони имеют неверный формат и были сброшены.' };
  }

  const seen = new Set();
  const valid = [];
  for (const b of parsed) {
    if (!b || typeof b !== 'object') continue;
    if (!KNOWN_IDS.has(b.placeId)) continue;
    if (seen.has(b.placeId)) continue;
    const guests = Number(b.guests);
    const nights = Number(b.nights);
    const total = Number(b.total);
    if (!Number.isInteger(guests) || guests < 1) continue;
    if (!Number.isInteger(nights) || nights < 1 || nights > 30) continue;
    if (!Number.isFinite(total) || total <= 0) continue;
    seen.add(b.placeId);
    valid.push({
      id: typeof b.id === 'string' ? b.id : crypto.randomUUID(),
      placeId: b.placeId,
      placeName: String(b.placeName ?? ''),
      guests, nights, total,
      createdAt: typeof b.createdAt === 'string' ? b.createdAt : new Date().toISOString(),
    });
  }
  const hadBad = valid.length !== parsed.length;
  return {
    bookings: valid,
    error: hadBad ? 'Часть сохранённых броней была повреждена и удалена.' : null,
  };
}

export function saveBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return null;
  } catch {
    return 'Не удалось сохранить брони (хранилище недоступно или переполнено).';
  }
}

export function clearBookings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return 'Не удалось очистить сохранённые брони.';
  }
}
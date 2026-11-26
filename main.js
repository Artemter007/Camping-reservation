import { PLACES } from './data.js';
import { loadBookings, saveBookings, clearBookings } from './storage.js';

const ICONS = { 'Палатка': '⛺', 'Автодом': '🚐', 'Глэмпинг': '🏕' };

// Единое состояние приложения
const state = {
  selectedId: null,
  filterMinCapacity: 1,
  filterMaxPrice: 3000,
  bookings: [],
};

const $ = (sel) => document.querySelector(sel);
const mapEl = $('#map');
const listEl = $('#place-list');
const cardEl = $('#card');
const bookingsEl = $('#bookings');
const bookingsEmptyEl = $('#bookings-empty');
const resetBookingsBtn = $('#reset-bookings');
const mapEmptyEl = $('#map-empty');
const listEmptyEl = $('#list-empty');
const toastEl = $('#toast');

const filterCapacity = $('#filter-capacity');
const filterPrice = $('#filter-price');
const resetFiltersBtn = $('#reset-filters');

let toastTimer = null;
function toast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle('is-error', isError);
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3500);
}

// ---- Вычисляемые данные ----
function occupiedIds() {
  const set = new Set(PLACES.filter(p => p.occupiedInitially).map(p => p.id));
  for (const b of state.bookings) set.add(b.placeId);
  return set;
}

function passesFilters(place) {
  return place.capacity >= state.filterMinCapacity
      && place.pricePerNight <= state.filterMaxPrice;
}

function visiblePlaces() {
  return PLACES.filter(passesFilters);
}

function findPlace(id) {
  return PLACES.find(p => p.id === id) ?? null;
}

// ---- Рендер схемы ----
function renderMap() {
  const occupied = occupiedIds();
  const visible = visiblePlaces();
  // очищаем только кнопки, декор оставляем
  mapEl.querySelectorAll('.map-place').forEach(n => n.remove());

  for (const place of visible) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'map-place';
    btn.style.left = place.x + '%';
    btn.style.top = place.y + '%';
    const isOccupied = occupied.has(place.id);
    const isSelected = state.selectedId === place.id;
    if (isOccupied) btn.classList.add('is-occupied');
    else if (isSelected) btn.classList.add('is-selected');
    btn.setAttribute('aria-pressed', String(isSelected));
    btn.setAttribute('aria-label',
      `${place.name}, ${place.type}, до ${place.capacity} гостей, ${place.pricePerNight} ₽/сутки, ${isOccupied ? 'занято' : 'свободно'}`);
    btn.textContent = ICONS[place.type] || '⛺';
    btn.disabled = isOccupied;
    if (!isOccupied) {
      btn.addEventListener('click', () => selectPlace(place.id));
    }
    mapEl.appendChild(btn);
  }
  mapEmptyEl.hidden = visible.length !== 0;
}

// ---- Рендер списка ----
function renderList() {
  const occupied = occupiedIds();
  const visible = visiblePlaces();
  listEl.innerHTML = '';
  for (const place of visible) {
    const isOccupied = occupied.has(place.id);
    const isSelected = state.selectedId === place.id;
    const li = document.createElement('li');
    li.className = 'place-item';
    if (isOccupied) li.classList.add('is-occupied');
    if (isSelected) li.classList.add('is-selected');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(isSelected));
    btn.disabled = isOccupied;
    btn.innerHTML = `
      <span>
        <strong>${ICONS[place.type] || ''} ${place.name}</strong><br>
        <span class="muted">${place.type} · до ${place.capacity} гостей · ${place.pricePerNight} ₽/сутки</span>
      </span>
      <span class="tag">${isOccupied ? 'Занято' : isSelected ? 'Выбрано' : 'Свободно'}</span>
    `;
    if (!isOccupied) {
      btn.addEventListener('click', () => selectPlace(place.id));
    }
    li.appendChild(btn);
    listEl.appendChild(li);
  }
  listEmptyEl.hidden = visible.length !== 0;
}

// ---- Карточка выбранного ----
function renderCard() {
  const place = state.selectedId ? findPlace(state.selectedId) : null;
  if (!place) {
    cardEl.innerHTML = '<p class="muted">Выберите свободное место на схеме или в списке.</p>';
    return;
  }
  const maxGuests = place.capacity;
  cardEl.innerHTML = `
    <h3>${ICONS[place.type] || ''} ${place.name}</h3>
    <p>${place.description}</p>
    <p class="muted">${place.type} · до ${maxGuests} гостей</p>
    <p class="price">${place.pricePerNight} ₽ / сутки</p>
    <form id="booking-form" novalidate>
      <label>
        Гостей (1–${maxGuests})
        <input type="number" id="input-guests" min="1" max="${maxGuests}" value="1" required />
        <span class="field-error" id="err-guests"></span>
      </label>
      <label>
        Суток (1–30)
        <input type="number" id="input-nights" min="1" max="30" value="1" required />
        <span class="field-error" id="err-nights"></span>
      </label>
      <p class="total">Итого: <strong id="total-amount">${place.pricePerNight} ₽</strong></p>
      <button type="submit" class="btn btn-primary">Подтвердить бронь</button>
    </form>
  `;

  const form = cardEl.querySelector('#booking-form');
  const guestsInput = cardEl.querySelector('#input-guests');
  const nightsInput = cardEl.querySelector('#input-nights');
  const totalEl = cardEl.querySelector('#total-amount');
  const errGuests = cardEl.querySelector('#err-guests');
  const errNights = cardEl.querySelector('#err-nights');

  function recalc() {
    const nights = parseInt(nightsInput.value, 10);
    if (Number.isInteger(nights) && nights >= 1 && nights <= 30) {
      totalEl.textContent = (place.pricePerNight * nights) + ' ₽';
    } else {
      totalEl.textContent = '—';
    }
  }
  guestsInput.addEventListener('input', recalc);
  nightsInput.addEventListener('input', recalc);
  recalc();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errGuests.textContent = '';
    errNights.textContent = '';

    const guests = parseInt(guestsInput.value, 10);
    const nights = parseInt(nightsInput.value, 10);
    let ok = true;

    if (!Number.isInteger(guests) || guests < 1 || guests > maxGuests) {
      errGuests.textContent = `Гостей должно быть от 1 до ${maxGuests}.`;
      ok = false;
    }
    if (!Number.isInteger(nights) || nights < 1 || nights > 30) {
      errNights.textContent = 'Суток должно быть целое число от 1 до 30.';
      ok = false;
    }
    if (!ok) return;

    if (occupiedIds().has(place.id)) {
      toast('Это место уже занято.', true);
      return;
    }

    const booking = {
      id: crypto.randomUUID(),
      placeId: place.id,
      placeName: place.name,
      guests,
      nights,
      total: place.pricePerNight * nights,
      createdAt: new Date().toISOString(),
    };
    state.bookings.push(booking);
    const saveErr = saveBookings(state.bookings);
    if (saveErr) toast(saveErr, true);

    state.selectedId = null;
    renderAll();
    toast(`Бронь оформлена: ${place.name}, ${nights} сут.`);
  });
}

// ---- Мои брони ----
function renderBookings() {
  bookingsEl.innerHTML = '';
  if (state.bookings.length === 0) {
    bookingsEmptyEl.hidden = false;
    resetBookingsBtn.hidden = true;
    return;
  }
  bookingsEmptyEl.hidden = true;
  resetBookingsBtn.hidden = false;

  for (const b of state.bookings) {
    const li = document.createElement('li');
    li.className = 'booking-item';
    li.innerHTML = `
      <div>
        <strong>${b.placeName}</strong>
        <div class="meta">Гостей: ${b.guests} · Суток: ${b.nights} · Итого: ${b.total} ₽</div>
      </div>
      <button type="button" class="btn btn-danger" data-cancel="${b.id}">Отменить</button>
    `;
    li.querySelector('button').addEventListener('click', () => cancelBooking(b.id));
    bookingsEl.appendChild(li);
  }
}

function cancelBooking(id) {
  const idx = state.bookings.findIndex(b => b.id === id);
  if (idx === -1) return;
  const [removed] = state.bookings.splice(idx, 1);
  const saveErr = saveBookings(state.bookings);
  if (saveErr) toast(saveErr, true);
  if (state.selectedId === removed.placeId) state.selectedId = null;
  renderAll();
  toast(`Бронь отменена: ${removed.placeName}`);
}

// ---- Выбор места ----
function selectPlace(id) {
  if (occupiedIds().has(id)) return;
  state.selectedId = (state.selectedId === id) ? null : id;
  renderAll();
  if (state.selectedId) {
    const submit = cardEl.querySelector('button[type="submit"]');
    if (submit) submit.focus();
  }
}

// ---- Фильтры ----
function applyFilters() {
  const cap = parseInt(filterCapacity.value, 10);
  const price = parseInt(filterPrice.value, 10);
  state.filterMinCapacity = Number.isInteger(cap) && cap > 0 ? cap : 1;
  state.filterMaxPrice = Number.isInteger(price) && price >= 0 ? price : Infinity;

  if (state.selectedId) {
    const place = findPlace(state.selectedId);
    if (!place || !passesFilters(place)) {
      state.selectedId = null;
      toast('Выбранное место скрыто фильтром — выбор снят.');
    }
  }
  renderAll();
}

filterCapacity.addEventListener('input', applyFilters);
filterPrice.addEventListener('input', applyFilters);
resetFiltersBtn.addEventListener('click', () => {
  filterCapacity.value = 1;
  filterPrice.value = 3000;
  applyFilters();
});

// ---- Сброс своих броней ----
resetBookingsBtn.addEventListener('click', () => {
  if (!confirm('Удалить все ваши брони? Исходно занятые места останутся занятыми.')) return;
  const err = clearBookings();
  if (err) toast(err, true);
  state.bookings = [];
  state.selectedId = null;
  renderAll();
  toast('Все ваши брони удалены.');
});

// ---- Общий рендер ----
function renderAll() {
  renderMap();
  renderList();
  renderCard();
  renderBookings();
}

// ---- Инициализация ----
function init() {
  const { bookings, error } = loadBookings();
  state.bookings = bookings;
  if (error) toast(error, true);
  renderAll();
}

init();
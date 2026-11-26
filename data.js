// 8 мест кемпинга. Два изначально заняты.
// x/y — проценты положения кнопки на схеме.
export const PLACES = [
  { id: 'p1', name: 'Палатка у озера',   type: 'Палатка',  capacity: 4, pricePerNight: 600,  x: 24, y: 30, occupiedInitially: false, description: 'Тенистое место в 20 метрах от воды.' },
  { id: 'p2', name: 'Палатка в лесу',    type: 'Палатка',  capacity: 3, pricePerNight: 450,  x: 18, y: 62, occupiedInitially: false, description: 'Тихая опушка, рядом дрова.' },
  { id: 'p3', name: 'Семейная поляна',   type: 'Палатка',  capacity: 6, pricePerNight: 800,  x: 40, y: 22, occupiedInitially: true,  description: 'Большая поляна для компании.' },
  { id: 'p4', name: 'Площадка под автодом', type: 'Автодом', capacity: 4, pricePerNight: 1200, x: 58, y: 46, occupiedInitially: false, description: 'Ровная площадка с электричеством.' },
  { id: 'p5', name: 'Автодом у ручья',   type: 'Автодом', capacity: 5, pricePerNight: 1400, x: 72, y: 66, occupiedInitially: false, description: 'Рядом ручей и мангальная зона.' },
  { id: 'p6', name: 'Глэмпинг «Сосна»',  type: 'Глэмпинг', capacity: 2, pricePerNight: 2200, x: 66, y: 24, occupiedInitially: false, description: 'Тёплый шатёр с кроватью.' },
  { id: 'p7', name: 'Глэмпинг «Закат»',  type: 'Глэмпинг', capacity: 3, pricePerNight: 2600, x: 34, y: 78, occupiedInitially: true,  description: 'Панорамный вид на закат.' },
  { id: 'p8', name: 'Палатка на холме',  type: 'Палатка',  capacity: 2, pricePerNight: 500,  x: 84, y: 38, occupiedInitially: false, description: 'Открытое место с видом на озеро.' },
];
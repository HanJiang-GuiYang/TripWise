(function () {
  'use strict';

  const paths = {
    navigation: '<path d="M4 4l16 6-7 3-3 7-6-16Z"/><path d="m10 10 3 3"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
    luggage: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11v5M15 11v5M8 20v1M16 20v1"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    'pin-check': '<path d="M19 10c0 4.6-7 10-7 10S5 14.6 5 10a7 7 0 1 1 14 0Z"/><path d="m9.5 10 1.6 1.6 3.5-3.5"/>',
    store: '<path d="M4 9v11h16V9M3 9l2-5h14l2 5"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6"/>',
    notebook: '<path d="M6 3h13v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M6 3v18M10 8h5M10 12h5"/>',
    wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12"/><path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z"/>',
    messages: '<path d="M4 5h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"/><path d="M6 10h8M6 13h5"/>',
    images: '<rect x="3" y="5" width="16" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><path d="m5 17 4-4 3 3 2-2 5 5M8 5l2-2h11v13l-2 2"/>',
    'cloud-sun': '<path d="M8 15H6a4 4 0 1 1 1-7.9A6 6 0 0 1 18 10a3 3 0 0 1 0 6H8Z"/><path d="M15 2v2M20 4l-1.5 1.5M10 4l1.5 1.5"/>',
    sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.7 1.8 1.8.7-1.8.7L19 18l-.7-1.8-1.8-.7 1.8-.7L19 13Z"/>',
    moon: '<path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    'arrow-right': '<path d="M5 12h14M14 7l5 5-5 5"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    send: '<path d="m3 3 18 9-18 9 3-9-3-9Z"/><path d="M6 12h15"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    loader: '<path d="M12 3a9 9 0 1 1-8.5 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4M12 17h.01"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M7.5 9C5 9 4 7.5 4.5 6S8 4 12 9M16.5 9C19 9 20 7.5 19.5 6S16 4 12 9"/>',
    ticket: '<path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z"/><path d="M13 8h4M13 12h4M13 16h4"/>',
    train: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M8 7h8M8 11h8M8 21l2-3M16 18l2 3M9 15h.01M15 15h.01"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4M11 18h2"/>',
    droplet: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/>',
    battery: '<rect x="3" y="7" width="17" height="10" rx="2"/><path d="M20 10h2v4h-2M7 12h4M9 10v4"/>',
    umbrella: '<path d="M3 12a9 9 0 0 1 18 0H3ZM12 3v15a3 3 0 0 0 6 0"/>',
    mountain: '<path d="m3 20 6-11 3 5 3-7 6 13H3Z"/><path d="m7 13 2-4 2 3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',
    camera: '<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    shirt: '<path d="m8 4-5 3 3 5 2-1v9h8v-9l2 1 3-5-5-3a4 4 0 0 1-8 0Z"/>',
    toiletries: '<path d="M9 3h6M12 3v4M8 7h8l1 14H7L8 7Z"/><path d="M9 12h6"/>',
    plug: '<path d="M8 3v5M16 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4"/>',
    landmark: '<path d="M3 9h18M5 9v8M9 9v8M15 9v8M19 9v8M3 20h18M12 3l9 4H3l9-4Z"/>',
    buildings: '<path d="M4 21V6l8-3v18M12 9h8v12M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/>',
    tree: '<path d="M12 22v-6M9 18h6M12 3l-5 8h3l-4 6h12l-4-6h3l-5-8Z"/>',
    food: '<path d="M7 3v7a3 3 0 0 0 3 3V3M4 3v5a2 2 0 0 0 2 2M7 13v8M17 3v18M17 3c3 2 4 6 0 10"/>',
    coffee: '<path d="M4 7h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7ZM17 9h2a3 3 0 0 1 0 6h-2M8 3v2M12 3v2"/>',
    leaf: '<path d="M20 4C10 4 4 9 4 17c6 2 13-2 16-13Z"/><path d="M5 19c3-5 7-8 12-11"/>',
    waves: '<path d="M3 8c3-2 5 2 8 0s5 2 10 0M3 13c3-2 5 2 8 0s5 2 10 0M3 18c3-2 5 2 8 0s5 2 10 0"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h8a9 9 0 0 0-9-10Z"/><circle cx="7" cy="10" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    sunset: '<path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 3v3M4.5 7.5 7 10M19.5 7.5 17 10"/>',
    city: '<path d="M3 21h18M5 21V8h6v13M11 21V3h8v18M7 11h2M7 15h2M14 7h2M14 11h2M14 15h2"/>',
    rain: '<path d="M7 15H6a4 4 0 1 1 1-7.9A6 6 0 0 1 18 10a3 3 0 0 1 0 6h-1M8 18l-1 3M13 18l-1 3M18 18l-1 3"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a2 2 0 1 1-2 2M3 16h8"/>',
    plane: '<path d="m2 16 20-8-7 7-1 6-3-4-4 2 1-5-6 2Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    share: '<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
    idea: '<path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 8a7 7 0 0 1 12-2l2 2M18 16a7 7 0 0 1-12 2l-2-2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bot: '<rect x="4" y="6" width="16" height="14" rx="3"/><path d="M12 2v4M8 11h.01M16 11h.01M8 16h8"/>',
    thermometer: '<path d="M10 4a2 2 0 0 1 4 0v10a5 5 0 1 1-4 0V4Z"/><path d="M12 8v8"/>',
    cloud: '<path d="M7 18H6a4 4 0 1 1 1-7.9A6 6 0 0 1 18 13a3 3 0 0 1 0 6H7Z"/>',
    trash: '<path d="M4 7h16M9 3h6l1 4M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    happy: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8 14c2 3 6 3 8 0"/>',
    excited: '<circle cx="12" cy="12" r="9"/><path d="m7 9 2-1-1-2M17 9l-2-1 1-2M8 14h8a4 4 0 0 1-8 0Z"/>',
    peaceful: '<circle cx="12" cy="12" r="9"/><path d="m7 10 2 1M17 10l-2 1M9 15h6"/>',
    touched: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M9 15c2-1 4-1 6 0M17 12c1 1 1 2 0 3"/>',
    surprised: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01"/><circle cx="12" cy="16" r="1.5"/>',
    place: '<circle cx="12" cy="12" r="9"/><path d="M8 16c1.5-4 3-6.5 8-8M9 8h.01M15 16h.01"/>'
  };

  const aliases = {
    'navigation-2': 'navigation', house: 'home', 'map-pin-check': 'pin-check', 'notebook-pen': 'notebook',
    'wallet-cards': 'wallet', 'messages-square': 'messages', 'message-circle-more': 'messages',
    'circle-dollar-sign': 'wallet', 'check-circle-2': 'check-circle', 'circle-alert': 'alert', copy: 'notebook',
    nature: 'leaf', photo: 'camera', shopping: 'store'
  };

  const emojiMap = {
    '🏯': 'landmark', '🏛️': 'landmark', '🏟️': 'landmark', '🏰': 'landmark', '🗼': 'landmark', '🎓': 'landmark',
    '🏘️': 'buildings', '🏙️': 'city', '🌃': 'city', '🛍️': 'store', '🎢': 'sparkles', '🧱': 'landmark', '🏮': 'landmark',
    '⛰️': 'mountain', '🏔️': 'mountain', '🏞️': 'mountain', '🏝️': 'waves', '🏖️': 'umbrella', '🌊': 'waves',
    '🌿': 'leaf', '🍃': 'leaf', '🌱': 'leaf', '🌳': 'tree', '🌸': 'leaf', '🌾': 'leaf',
    '🍜': 'food', '🥟': 'food', '🦆': 'food', '🦞': 'food', '🥗': 'food', '🍢': 'food', '🌶️': 'food', '🦐': 'food',
    '☕': 'coffee', '🍷': 'coffee', '🍺': 'coffee', '📸': 'camera', '📷': 'camera', '🎨': 'palette', '🌅': 'sunset',
    '🐼': 'place', '🐫': 'place', '📍': 'pin', '🎫': 'ticket', '🚇': 'train', '🚄': 'train', '📱': 'phone',
    '💧': 'droplet', '🔋': 'battery', '🧴': 'toiletries', '🌬️': 'wind', '🌧️': 'rain', '☀️': 'sun', '🌞': 'sun',
    '✈️': 'plane', '🏡': 'home', '📅': 'calendar', '🏨': 'buildings', '💼': 'briefcase', '📋': 'list', '👕': 'shirt',
    '🔌': 'plug', '🗺️': 'map', '🧭': 'compass', '⏹': 'stop', '💡': 'idea', '🎯': 'target', '🔄': 'refresh',
    '📥': 'download', '📤': 'share', '🎁': 'gift', '🤖': 'bot', '🙋': 'user', '🌡️': 'thermometer', '☁️': 'cloud'
  };

  function resolve(name) {
    const normalized = aliases[name] || emojiMap[name] || name;
    return paths[normalized] ? normalized : 'place';
  }

  function svg(name, className = 'ui-icon') {
    const resolved = resolve(name);
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-icon-name="${resolved}">${paths[resolved]}</svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]:not([data-icon-ready])').forEach((element) => {
      element.innerHTML = svg(element.dataset.icon, element.dataset.iconClass || 'ui-icon');
      element.dataset.iconReady = 'true';
    });
  }

  window.TripWiseIcons = { svg, fromEmoji: svg, hydrate, resolve };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate());
  else hydrate();
}());

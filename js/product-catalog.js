const COLORS = [
  { id: 'black', name: 'Negro', hex: '#17191d', image: 'case-black.svg', magsafeImage: 'magsafe-black.svg', price: 4.99 },
  { id: 'white', name: 'Blanco', hex: '#fafafa', image: 'case-white.svg', magsafeImage: 'magsafe-white.svg', price: 4.99 },
  { id: 'navy', name: 'Azul marino', hex: '#142a48', image: 'case-navy.svg', magsafeImage: 'magsafe-navy.svg', price: 4.99 },
  { id: 'dusty-rose', name: 'Rosa empolvado', hex: '#bd8590', image: 'case-dusty-rose.svg', magsafeImage: 'magsafe-dusty-rose.svg', price: 5.99 },
  { id: 'lavender', name: 'Lavanda', hex: '#9a8bc4', image: 'case-lavender.svg', magsafeImage: 'magsafe-lavender.svg', price: 5.99 },
  { id: 'light-green', name: 'Verde claro', hex: '#a8c9ae', image: 'case-light-green.svg', magsafeImage: 'magsafe-light-green.svg', price: 5.99 },
  { id: 'red', name: 'Rojo', hex: '#c94f50', image: 'case-red.svg', magsafeImage: 'magsafe-red.svg', price: 5.99 },
  { id: 'yellow', name: 'Amarillo', hex: '#e5c95d', image: 'case-yellow.svg', magsafeImage: 'magsafe-yellow.svg', price: 5.99 },
  { id: 'khaki', name: 'Caqui', hex: '#77765a', image: 'case-khaki.svg', magsafeImage: 'magsafe-khaki.svg', price: 4.99 },
  { id: 'gray', name: 'Gris', hex: '#858b94', image: 'case-gray.svg', magsafeImage: 'magsafe-gray.svg', price: 4.99 }
];

const IPHONE_MODELS = [
  ['11', 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max'],
  ['12', 'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max'],
  ['13', 'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max'],
  ['14', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max'],
  ['15', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'],
  ['16', 'iPhone 16', 'iPhone 16e', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max'],
  ['17', 'iPhone 17', 'iPhone 17 Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'],
  ['18', 'iPhone 18', 'iPhone 18 Pro', 'iPhone 18 Pro Max']
];

const DEVICES = [
  ...IPHONE_MODELS.flatMap(([generation, ...models]) => models.map((name, index) => ({
    id: `iphone-${generation}-${index}`,
    name,
    brand: 'apple',
    flagship: true,
    family: 'iPhone'
  }))),
  { id: 'samsung-s25-ultra', name: 'Samsung Galaxy S25 Ultra', brand: 'samsung', flagship: true, family: 'Galaxy S' },
  { id: 'samsung-s25', name: 'Samsung Galaxy S25', brand: 'samsung', flagship: true, family: 'Galaxy S' },
  { id: 'samsung-s24-ultra', name: 'Samsung Galaxy S24 Ultra', brand: 'samsung', flagship: true, family: 'Galaxy S' },
  { id: 'samsung-s24', name: 'Samsung Galaxy S24', brand: 'samsung', flagship: true, family: 'Galaxy S' },
  { id: 'samsung-s23-ultra', name: 'Samsung Galaxy S23 Ultra', brand: 'samsung', flagship: true, family: 'Galaxy S' },
  { id: 'samsung-s23', name: 'Samsung Galaxy S23', brand: 'samsung', flagship: true, family: 'Galaxy S' },
  { id: 'samsung-a55', name: 'Samsung Galaxy A55', brand: 'samsung', flagship: false, family: 'Galaxy A' },
  { id: 'samsung-a54', name: 'Samsung Galaxy A54', brand: 'samsung', flagship: false, family: 'Galaxy A' },
  { id: 'samsung-a35', name: 'Samsung Galaxy A35', brand: 'samsung', flagship: false, family: 'Galaxy A' },
  { id: 'xiaomi-15-ultra', name: 'Xiaomi 15 Ultra', brand: 'xiaomi', flagship: true, family: 'Xiaomi' },
  { id: 'xiaomi-15', name: 'Xiaomi 15', brand: 'xiaomi', flagship: true, family: 'Xiaomi' },
  { id: 'xiaomi-14-ultra', name: 'Xiaomi 14 Ultra', brand: 'xiaomi', flagship: true, family: 'Xiaomi' },
  { id: 'xiaomi-14', name: 'Xiaomi 14', brand: 'xiaomi', flagship: true, family: 'Xiaomi' },
  { id: 'redmi-note-14', name: 'Redmi Note 14', brand: 'xiaomi', flagship: false, family: 'Redmi' },
  { id: 'redmi-note-13', name: 'Redmi Note 13', brand: 'xiaomi', flagship: false, family: 'Redmi' },
  { id: 'redmi-note-12', name: 'Redmi Note 12', brand: 'xiaomi', flagship: false, family: 'Redmi' },
  { id: 'poco-x7', name: 'POCO X7', brand: 'xiaomi', flagship: false, family: 'POCO' },
  { id: 'poco-f7', name: 'POCO F7', brand: 'xiaomi', flagship: false, family: 'POCO' },
  { id: 'poco-f6', name: 'POCO F6', brand: 'xiaomi', flagship: false, family: 'POCO' }
];

const PRODUCTS = [
  {
    id: 'basic-case',
    name: 'Funda básica de silicona / TPU',
    description: 'Protección ligera para el uso diario. Diez colores disponibles.',
    image: 'case-black.svg',
    range: [4.99, 5.99],
    compatibility: 'iPhone 11–18 · Samsung S/A · Xiaomi, Redmi y POCO',
    compatible: device => Boolean(device),
    colorPicker: true
  },
  {
    id: 'magsafe-replica',
    name: 'Silicone Case con MagSafe · réplica',
    description: 'Acabado suave al tacto con anillo magnético integrado.',
    image: 'case-magsafe-replica.svg',
    range: [11.99, 12.99],
    compatibility: 'Todas las generaciones iPhone 11–18',
    compatible: device => device.brand === 'apple',
    colorPicker: true,
    colorImageField: 'magsafeImage',
    priceForColor: color => ['dusty-rose', 'lavender', 'light-green', 'red', 'yellow'].includes(color.id) ? 12.99 : 11.99
  },
  {
    id: 'pitaka-replica',
    name: 'PITAKA · estilo aramida · réplica',
    description: 'Perfil fino con textura técnica inspirada en fibra de aramida.',
    image: 'case-pitaka-replica.svg',
    range: [12.99, 14.99],
    compatibility: 'iPhone 11–18 · Samsung Galaxy S · Xiaomi insignia',
    compatible: device => device.brand === 'apple' || (device.brand === 'samsung' && device.family === 'Galaxy S') || (device.brand === 'xiaomi' && device.flagship)
  },
  {
    id: 'pitaka-original',
    name: 'PITAKA Original · última colección',
    description: 'Ilustración propia de textura premium de aramida; fotografía oficial no proporcionada.',
    image: 'case-pitaka-original.svg',
    range: [59.99, 69.99],
    compatibility: 'Solo iPhone 11–18, Samsung S insignia y Xiaomi insignia',
    compatible: device => device.brand === 'apple' || (device.flagship && (device.brand === 'samsung' || device.brand === 'xiaomi'))
  }
];

const SERVICES = [
  { id: 'glass-standard', name: 'Cristal protector · Estándar', description: 'Cristal templado 9H. Material y colocación del técnico incluidos.', price: 3.99, image: 'glass-standard.svg' },
  { id: 'glass-premium', name: 'Cristal protector · Premium', description: 'Cobertura 3D/5D de borde a borde con capa oleofóbica.', price: 7.99, image: 'glass-premium.svg' },
  { id: 'hydrogel-standard', name: 'Película de hidrogel · Estándar', description: 'Película flexible con propiedades de autorrecuperación.', price: 3.49, image: 'hydrogel-standard.svg' },
  { id: 'hydrogel-premium', name: 'Película de hidrogel · Premium', description: 'Película reforzada de alta resistencia a impactos.', price: 5.99, image: 'hydrogel-premium.svg' }
];

const IMAGE_PATH = './images/products/';
const deviceSelect = document.getElementById('catalogDevice');
const caseCatalog = document.getElementById('caseCatalog');
const protectionCatalog = document.getElementById('protectionCatalog');
const selectedColors = new Map(PRODUCTS.filter(product => product.colorPicker).map(product => [product.id, COLORS[0]]));

function colorFor(productId) {
  return selectedColors.get(productId) || COLORS[0];
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function addOptions() {
  const groups = [
    ['Apple · iPhone 11–18', DEVICES.filter(device => device.brand === 'apple')],
    ['Samsung · Galaxy S (insignia)', DEVICES.filter(device => device.family === 'Galaxy S')],
    ['Samsung · Galaxy A', DEVICES.filter(device => device.family === 'Galaxy A')],
    ['Xiaomi · insignia', DEVICES.filter(device => device.brand === 'xiaomi' && device.flagship)],
    ['Redmi / POCO', DEVICES.filter(device => !device.flagship && device.brand === 'xiaomi')]
  ];
  groups.forEach(([label, devices]) => {
    const group = document.createElement('optgroup');
    group.label = label;
    devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = device.name;
      group.append(option);
    });
    deviceSelect.append(group);
  });
  deviceSelect.value = 'iphone-17-0';
}

function selectedDevice() {
  return DEVICES.find(device => device.id === deviceSelect.value) || null;
}

function displayPrice(range, device) {
  const premiumVariant = /ultra|pro max/i.test(device?.name || '');
  return premiumVariant ? range[1] : range[0];
}

function compatibilityText(product, device) {
  if (!device) return 'Elige un dispositivo para comprobar compatibilidad.';
  if (product.id === 'pitaka-original' && !product.compatible(device)) {
    return 'No disponible para esta serie. PITAKA Original se ofrece solo para modelos insignia.';
  }
  return product.compatible(device) ? `${device.name} · compatible` : `${device.name} · no disponible`;
}

function makeColorPicker(productCard, image, price, priceForColor, ariaLabel, imageField, productId) {
  let selectedColor = colorFor(productId);
  const picker = element('div', 'case-color-picker');
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', ariaLabel);
  COLORS.forEach(color => {
    const swatch = element('button', 'case-swatch');
    swatch.type = 'button';
    swatch.style.setProperty('--swatch', color.hex);
    swatch.title = `${color.name} · ${color.hex}`;
    swatch.setAttribute('aria-label', `Color ${color.name}, ${color.hex}`);
    swatch.setAttribute('aria-pressed', String(color.id === selectedColor.id));
    swatch.dataset.color = color.id;
    picker.append(swatch);
  });
  const colorLabel = element('p', 'case-color-label', `${selectedColor.name} · ${selectedColor.hex}`);
  picker.addEventListener('click', event => {
    const swatch = event.target.closest('[data-color]');
    if (!swatch) return;
    selectedColor = COLORS.find(color => color.id === swatch.dataset.color) || COLORS[0];
    selectedColors.set(productId, selectedColor);
    image.src = IMAGE_PATH + selectedColor[imageField];
    image.alt = `Funda básica de TPU en color ${selectedColor.name}`;
    image.dataset.color = selectedColor.id;
    colorLabel.textContent = `${selectedColor.name} · ${selectedColor.hex}`;
    price.textContent = `€${priceForColor(selectedColor).toFixed(2)}`;
    picker.querySelectorAll('.case-swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === selectedColor.id)));
  });
  productCard.append(picker, colorLabel);
}

function requestItem(name, price, device, detail = '') {
  const modal = document.getElementById('bookingModal');
  const notes = document.getElementById('modalNotesText');
  modal.dataset.overrideBrand = device.brand === 'apple' ? 'Apple' : device.brand === 'samsung' ? 'Samsung' : 'Xiaomi';
  modal.dataset.overrideModel = device.name;
  modal.dataset.overrideIssue = `Catálogo: ${name}`;
  modal.dataset.overridePrice = String(price);
  notes.value = `Solicitud de catálogo: ${name}. ${detail}`.trim();
  document.getElementById('modalTotal').textContent = `€${price.toFixed(2)}`;
  if (typeof window.openBookingModal === 'function') window.openBookingModal();
  else modal.classList.remove('hidden');
}

function renderProduct(product, device) {
  const available = product.compatible(device);
  const selectedColor = product.colorPicker ? colorFor(product.id) : null;
  const card = element('article', 'catalog-product');
  card.dataset.product = product.id;
  const media = element('div', 'product-image-wrap');
  const image = document.createElement('img');
  image.className = 'product-image';
  image.src = IMAGE_PATH + (product.colorPicker ? selectedColor[product.colorImageField || 'image'] : product.image);
  image.alt = product.colorPicker ? `Funda básica de TPU en color ${selectedColor.name}` : product.name;
  image.loading = 'lazy';
  media.append(image);
  media.append(element('span', 'product-badge', product.colorPicker ? '10 COLORES' : product.id === 'pitaka-original' ? 'INSIGNIA' : 'FUNDA'));
  const body = element('div', 'product-body');
  body.append(element('h4', '', product.name));
  body.append(element('p', 'product-description', product.description));
  const compatibility = element('p', 'product-compatibility', compatibilityText(product, device));
  compatibility.classList.toggle('is-unavailable', !available);
  body.append(compatibility);
  const price = element('strong', 'product-price');
  const range = element('span', 'product-price-range');
  const priceRow = element('div', 'product-price-row');
  if (product.colorPicker) {
    const colorPrice = product.priceForColor || (color => color.price);
    price.textContent = `€${colorPrice(selectedColor).toFixed(2)}`;
    range.textContent = 'Según color';
  } else {
    const value = displayPrice(product.range, device);
    price.textContent = `€${value.toFixed(2)}`;
    range.textContent = `€${product.range[0].toFixed(2)}–€${product.range[1].toFixed(2)}`;
  }
  priceRow.append(price, range);
  body.append(priceRow);
  if (product.colorPicker) makeColorPicker(body, image, price, product.priceForColor || (color => color.price), product.id === 'magsafe-replica' ? 'Elige uno de los 10 colores de funda MagSafe' : 'Elige uno de los 10 colores de funda', product.colorImageField || 'image', product.id);
  body.append(element('p', `product-availability${available ? '' : ' is-unavailable'}`, available ? 'Disponible para solicitud' : product.id === 'pitaka-original' ? 'No disponible para este dispositivo' : 'No compatible con este modelo'));
  const button = element('button', 'product-request', available ? 'Solicitar en tienda' : 'No disponible');
  button.type = 'button';
  button.disabled = !available;
  button.addEventListener('click', () => {
    const color = product.colorPicker ? colorFor(product.id) : null;
    const priceValue = product.colorPicker ? (product.priceForColor || (item => item.price))(color) : displayPrice(product.range, device);
    const detail = color ? `Color: ${color.name} (${color.hex}).` : '';
    requestItem(product.name, priceValue, device, detail);
  });
  body.append(button);
  card.append(media, body);
  return card;
}

function renderService(service, device) {
  const card = element('article', 'protection-service');
  const media = element('div', 'service-material');
  const image = document.createElement('img');
  image.src = IMAGE_PATH + service.image;
  image.alt = service.name;
  image.loading = 'lazy';
  media.append(image);
  card.append(media, element('h4', '', service.name), element('p', '', service.description), element('strong', 'service-price', `€${service.price.toFixed(2)}`));
  const button = element('button', 'product-request', 'Solicitar colocación');
  button.disabled = !device;
  button.type = 'button';
  button.addEventListener('click', () => requestItem(service.name, service.price, device, 'Material y colocación incluidos.'));
  card.append(button);
  return card;
}

function renderCatalog() {
  const device = selectedDevice();
  caseCatalog.replaceChildren(...PRODUCTS.map(product => renderProduct(product, device)));
  protectionCatalog.replaceChildren(...SERVICES.map(service => renderService(service, device)));
}

addOptions();
deviceSelect.addEventListener('change', renderCatalog);
renderCatalog();

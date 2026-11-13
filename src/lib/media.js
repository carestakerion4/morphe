// Загрузка и подготовка изображений. compressImage работает только в браузере.

export const MEDIA_BUCKET = 'media';
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PIXELS = 100_000_000; // защита от «бомб»-картинок

/** Текст ошибки или '' если файл годится. */
export function validateImageFile(file) {
  if (!file) return 'No file selected';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, WebP or GIF image';
  if (file.size > MAX_UPLOAD_BYTES) return 'Image is larger than 8 MB';
  return '';
}

/** Вписывает (w,h) в рамку maxW×maxH без увеличения. */
export function fitSize(w, h, maxW, maxH) {
  const scale = Math.min(1, maxW / w, maxH / h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** Центральный квадратный кроп. */
export function squareCrop(w, h) {
  const size = Math.min(w, h);
  return { sx: Math.floor((w - size) / 2), sy: Math.floor((h - size) / 2), size };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image could not be read. Try a JPG or PNG.'));
    };
    img.src = url;
  });
}

/**
 * Сжимает картинку в JPEG-блоб.
 *  square: true — центральный квадрат (для аватаров)
 * Всегда реджектит Error (а не Event), чтобы err.message был осмысленным.
 */
export async function compressImage(
  file,
  { maxWidth = 1200, maxHeight = 1200, square = false, quality = 0.85, background = '#09090b' } = {}
) {
  const img = await loadImage(file);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) throw new Error('This image could not be read.');
  if (iw * ih > MAX_PIXELS) throw new Error('Image dimensions are too large.');

  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;
  if (square) {
    const c = squareCrop(iw, ih);
    sx = c.sx;
    sy = c.sy;
    sw = sh = c.size;
  }
  const { width, height } = fitSize(sw, sh, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // JPEG без альфа-канала: прозрачность иначе превращается в чёрный непредсказуемо.
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image processing failed.'))),
      'image/jpeg',
      quality
    );
  });
}

/**
 * Достаёт путь объекта внутри бакета из публичного URL Supabase Storage.
 * Возвращает null, если URL чужой или файл не из папки этого пользователя —
 * удалять мы имеем право только своё.
 */
export function mediaPathFromUrl(url, userId, bucket = MEDIA_BUCKET) {
  if (typeof url !== 'string' || !userId) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  let path;
  try {
    path = decodeURIComponent(url.slice(i + marker.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (!path.startsWith(`${userId}/`) || path.includes('..')) return null;
  return path;
}

/**
 * Какие файлы Storage больше не нужны после сохранения профиля.
 *  saved   — что лежало в БД до сохранения  { avatar, banner }
 *  pending — загрузки этой сессии, ещё не сохранённые  { avatar: {path,url}, banner: {...} }
 *  now     — что сохраняется сейчас  { avatar, banner }
 * Возвращает пути только из папки пользователя.
 */
export function staleMediaPaths({ saved, pending, now, userId }) {
  const urls = [];
  for (const target of ['avatar', 'banner']) {
    const current = now?.[target] || '';
    if (saved?.[target] && saved[target] !== current) urls.push(saved[target]);
    const p = pending?.[target];
    if (p && p.url !== current) urls.push(p.url);
  }
  return [...new Set(urls.map((u) => mediaPathFromUrl(u, userId)).filter(Boolean))];
}

// Нормализация и вспомогательная логика данных профиля. Без React и без Supabase.

import { sanitizeUsername, validateUsername, fallbackUsername } from './username.js';

export const DEFAULT_THEME_CONFIG = {
  themeKey: 'obsidian',
  bgEffect: 'eidos',
  font: 'Manrope',
  cardRadius: 12,
  badge: '',
  status: 'online',
  socials: []
};

export const LIMITS = {
  displayName: 50,
  bio: 280,
  badge: 24,
  linkTitle: 60,
  linkSubtitle: 100,
  linkUrl: 2048,
  socialValue: 200,
  maxLinks: 60,
  maxSocials: 12
};

/** Безопасно достаёт массив ссылок из jsonb. */
export function asLinks(profile) {
  return Array.isArray(profile?.links) ? profile.links.filter((l) => l && typeof l === 'object') : [];
}

/** Безопасно достаёт соцсети: только записи со строковым value. */
export function asSocials(profile) {
  const s = profile?.theme_config?.socials;
  return Array.isArray(s) ? s.filter((x) => x && typeof x.value === 'string' && x.value.length > 0) : [];
}

/**
 * Клики по ссылке. Новая схема: profile.link_clicks[linkId].
 * Старая схема (до миграции): link.clicks внутри links.
 */
export function getClicks(profile, link) {
  const map = profile?.link_clicks;
  if (map && typeof map === 'object' && !Array.isArray(map)) {
    const n = Number(map[link?.id]);
    return Number.isFinite(n) ? n : 0;
  }
  const legacy = Number(link?.clicks);
  return Number.isFinite(legacy) ? legacy : 0;
}

export function sumClicks(profile) {
  return asLinks(profile)
    .filter((l) => l.type !== 'header')
    .reduce((acc, l) => acc + getClicks(profile, l), 0);
}

/** Переехала ли БД на отдельное хранилище кликов (колонка link_clicks есть в строке)? */
export function usesSeparateClicks(profile) {
  return !!profile && Object.prototype.hasOwnProperty.call(profile, 'link_clicks');
}

/** Ссылки без поля clicks — то, что отправляется в БД после миграции. */
export function stripClicks(links) {
  return links.map((l) => {
    // eslint-disable-next-line no-unused-vars
    const { clicks, ...rest } = l;
    return rest;
  });
}

/** Новый идентификатор блока. */
export function newBlockId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().slice(0, 12);
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Начальный профиль для нового пользователя. Ник берём из user_metadata
 * (его кладёт форма регистрации); если он невалиден или занят — запасной.
 * Стартовый контент (Discord-иконка и Telegram-карточка) добавляется только когда
 * пользователь сам выбрал ник при регистрации — как и раньше.
 */
export function buildInitialProfile(user, { taken = false } = {}) {
  const meta = user?.user_metadata || {};
  const wanted = sanitizeUsername(meta.username);
  const usable = !taken && wanted && !validateUsername(wanted);
  const username = usable ? wanted : fallbackUsername(user.id);
  const display = String(meta.display_name || username).slice(0, LIMITS.displayName);

  const theme_config = { ...DEFAULT_THEME_CONFIG, socials: [] };
  const links = [];
  if (usable) {
    theme_config.socials = [{ id: '1', platform: 'Discord', value: username }];
    links.push({
      id: newBlockId(),
      type: 'link',
      platform: 'Telegram',
      title: 'Telegram',
      subtitle: '@' + username,
      url: 'https://t.me/',
      visible: true,
      color: '#38bdf8',
      featured: false
    });
  }

  return {
    id: user.id,
    username,
    display_name: display,
    bio: '',
    avatar_url: '',
    theme_config,
    links
  };
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { USERNAME_MAX, sanitizeUsername, validateUsername } from './lib/username.js';
import { normalizeLinkUrl, toSafeHttpUrl, toSafeImageUrl } from './lib/urls.js';
import {
  LIMITS, asLinks, asSocials, getClicks, sumClicks,
  stripClicks, usesSeparateClicks, newBlockId
} from './lib/profile.js';
import { MEDIA_BUCKET, validateImageFile, compressImage, staleMediaPaths } from './lib/media.js';
import { loadOrCreateProfile } from './lib/profileService.js';
import { copyText } from './lib/clipboard.js';
import plusSvg from 'iconoir/icons/regular/plus.svg?raw';
import trashSvg from 'iconoir/icons/regular/trash.svg?raw';
import arrowUpSvg from 'iconoir/icons/regular/arrow-up.svg?raw';
import arrowDownSvg from 'iconoir/icons/regular/arrow-down.svg?raw';
import arrowUpRightSvg from 'iconoir/icons/regular/arrow-up-right.svg?raw';
import copySvg from 'iconoir/icons/regular/copy.svg?raw';
import checkSvg from 'iconoir/icons/regular/check.svg?raw';
import eyeSvg from 'iconoir/icons/regular/eye.svg?raw';
import eyeClosedSvg from 'iconoir/icons/regular/eye-closed.svg?raw';
import colorFilterSvg from 'iconoir/icons/regular/color-filter.svg?raw';
import userSvg from 'iconoir/icons/regular/user.svg?raw';
import linkSvg from 'iconoir/icons/regular/link.svg?raw';
import logOutSvg from 'iconoir/icons/regular/log-out.svg?raw';
import logInSvg from 'iconoir/icons/regular/log-in.svg?raw';
import floppyDiskSvg from 'iconoir/icons/regular/floppy-disk.svg?raw';
import globeSvg from 'iconoir/icons/regular/globe.svg?raw';
import refreshSvg from 'iconoir/icons/regular/refresh.svg?raw';
import uploadSvg from 'iconoir/icons/regular/upload.svg?raw';
import editPencilSvg from 'iconoir/icons/regular/edit-pencil.svg?raw';
import pinSvg from 'iconoir/icons/regular/pin.svg?raw';
import compassSvg from 'iconoir/icons/regular/compass.svg?raw';
import searchSvg from 'iconoir/icons/regular/search.svg?raw';
import smartphoneDeviceSvg from 'iconoir/icons/regular/smartphone-device.svg?raw';
import computerSvg from 'iconoir/icons/regular/computer.svg?raw';
import xmarkSvg from 'iconoir/icons/regular/xmark.svg?raw';
import checkCircleSvg from 'iconoir/icons/regular/check-circle.svg?raw';
import hashtagSvg from 'iconoir/icons/regular/hashtag.svg?raw';
import navArrowDownSvg from 'iconoir/icons/regular/nav-arrow-down.svg?raw';
import colorPickerSvg from 'iconoir/icons/regular/color-picker.svg?raw';
import shieldSvg from 'iconoir/icons/regular/shield.svg?raw';
import prohibitionSvg from 'iconoir/icons/regular/prohibition.svg?raw';
import undoSvg from 'iconoir/icons/regular/undo.svg?raw';
import groupSvg from 'iconoir/icons/regular/group.svg?raw';
import statsUpSquareSvg from 'iconoir/icons/regular/stats-up-square.svg?raw';
import telegramBrandSvg from './assets/platform-icons/telegram.svg?raw';
import discordBrandSvg from './assets/platform-icons/discord.svg?raw';
import vkBrandSvg from './assets/platform-icons/vk.svg?raw';
import youtubeBrandSvg from './assets/platform-icons/youtube.svg?raw';
import twitchBrandSvg from './assets/platform-icons/twitch.svg?raw';
import tiktokBrandSvg from './assets/platform-icons/tiktok.svg?raw';
import githubBrandSvg from './assets/platform-icons/github.svg?raw';
import steamBrandSvg from './assets/platform-icons/steam.svg?raw';
import funpayBrandSvg from './assets/platform-icons/funpay.svg?raw';
import boostyBrandSvg from './assets/platform-icons/boosty.svg?raw';
import donationAlertsBrandSvg from './assets/platform-icons/donationalerts.svg?raw';
import spotifyBrandSvg from './assets/platform-icons/spotify.svg?raw';
import instagramBrandSvg from './assets/platform-icons/instagram.svg?raw';
import xBrandSvg from './assets/platform-icons/x.svg?raw';

function createIcon(svg) {
  return function IconoirGlyph({ className = '', width, height, style, ...props }) {
    return (
      <span
        {...props}
        className={`iconoir-icon ${className}`}
        style={{ ...(width != null ? { width } : {}), ...(height != null ? { height } : {}), ...style }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  };
}

function createBrandIcon(svg) {
  return createIcon(svg.replace('<svg ', '<svg fill="currentColor" '));
}

const Plus = createIcon(plusSvg);
const Trash2 = createIcon(trashSvg);
const ArrowUp = createIcon(arrowUpSvg);
const ArrowDown = createIcon(arrowDownSvg);
const ArrowUpRight = createIcon(arrowUpRightSvg);
const Copy = createIcon(copySvg);
const Check = createIcon(checkSvg);
const Eye = createIcon(eyeSvg);
const EyeOff = createIcon(eyeClosedSvg);
const Palette = createIcon(colorFilterSvg);
const User = createIcon(userSvg);
const Link2 = createIcon(linkSvg);
const LogOut = createIcon(logOutSvg);
const LogIn = createIcon(logInSvg);
const Save = createIcon(floppyDiskSvg);
const Globe = createIcon(globeSvg);
const Loader2 = createIcon(refreshSvg);
const Upload = createIcon(uploadSvg);
const Edit3 = createIcon(editPencilSvg);
const Pin = createIcon(pinSvg);
const Compass = createIcon(compassSvg);
const Search = createIcon(searchSvg);
const Smartphone = createIcon(smartphoneDeviceSvg);
const Monitor = createIcon(computerSvg);
const X = createIcon(xmarkSvg);
const CheckCircle2 = createIcon(checkCircleSvg);
const Hash = createIcon(hashtagSvg);
const ChevronDown = createIcon(navArrowDownSvg);
const Pipette = createIcon(colorPickerSvg);
const Shield = createIcon(shieldSvg);
const Ban = createIcon(prohibitionSvg);
const RotateCcw = createIcon(undoSvg);
const Users = createIcon(groupSvg);
const BarChart2 = createIcon(statsUpSquareSvg);
const PLATFORM_ICONS = {
  Telegram: createBrandIcon(telegramBrandSvg),
  Discord: createBrandIcon(discordBrandSvg),
  VK: createBrandIcon(vkBrandSvg),
  YouTube: createBrandIcon(youtubeBrandSvg),
  Twitch: createBrandIcon(twitchBrandSvg),
  TikTok: createBrandIcon(tiktokBrandSvg),
  GitHub: createBrandIcon(githubBrandSvg),
  Steam: createBrandIcon(steamBrandSvg),
  FunPay: createBrandIcon(funpayBrandSvg),
  Boosty: createBrandIcon(boostyBrandSvg),
  DonationAlerts: createBrandIcon(donationAlertsBrandSvg),
  Spotify: createBrandIcon(spotifyBrandSvg),
  Instagram: createBrandIcon(instagramBrandSvg),
  X: createBrandIcon(xBrandSvg),
  Website: Globe
};

// --- MORPHE MARK ---
function MorpheMark({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M24.1 11.4c-1.6-2.9-4.6-4.8-8.1-4.8-5.3 0-9.6 4.2-9.6 9.4s4.3 9.4 9.6 9.4c4.5 0 8-3.1 8-7 0-3.1-2.3-5.3-5.3-5.3-2.4 0-4.2 1.6-4.2 3.8 0 1.4.9 2.4 2.2 2.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24.1 11.4c-1.6-2.9-4.6-4.8-8.1-4.8" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function SlidingSegments({
  activeIndex,
  count,
  children,
  className = '',
  ariaLabel,
  gap = 4,
  padding = 4
}) {
  const [movement, setMovement] = useState(null);
  const indicatorStyle = {
    width: `calc((100% - ${padding * 2 + gap * (count - 1)}px) / ${count})`,
    top: `${padding}px`,
    bottom: `${padding}px`,
    left: `${padding}px`,
    transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * gap}px))`
  };

  const handleClickCapture = (event) => {
    const buttons = Array.from(event.currentTarget.children).filter((child) => child.tagName === 'BUTTON');
    const clickedIndex = buttons.indexOf(event.target.closest('button'));

    if (clickedIndex >= 0 && clickedIndex !== activeIndex) {
      setMovement(clickedIndex > activeIndex ? 'right' : 'left');
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`sliding-segments ${className}`}
      onClickCapture={handleClickCapture}
    >
      <span className="sliding-segment-indicator" aria-hidden="true" style={indicatorStyle}>
        <span
          key={activeIndex}
          className="sliding-segment-shape"
          data-direction={movement || undefined}
          onAnimationEnd={() => setMovement(null)}
        />
      </span>
      {children}
    </div>
  );
}

// --- PLATFORM AUTO-DETECTION ---
function detectPlatformFromUrl(url = '') {
  const u = url.toLowerCase();
  if (!u) return null;
  if (u.includes('t.me') || u.includes('telegram.')) return 'Telegram';
  if (u.includes('discord.gg') || u.includes('discord.com') || u.includes('discordapp.')) return 'Discord';
  if (u.includes('vk.com') || u.includes('vk.ru')) return 'VK';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('twitch.tv')) return 'Twitch';
  if (u.includes('tiktok.com')) return 'TikTok';
  if (u.includes('github.com')) return 'GitHub';
  if (u.includes('steamcommunity.com') || u.includes('steampowered.com')) return 'Steam';
  if (u.includes('funpay.com')) return 'FunPay';
  if (u.includes('boosty.to')) return 'Boosty';
  if (u.includes('donationalerts.com')) return 'DonationAlerts';
  if (u.includes('spotify.com')) return 'Spotify';
  if (u.includes('instagram.com')) return 'Instagram';
  if (u.includes('x.com') || u.includes('twitter.com')) return 'X';
  return null;
}

function resolvePlatform(platform, url = '', title = '') {
  const byUrl = detectPlatformFromUrl(url);
  if (byUrl && (!platform || platform === 'Website' || platform === 'Сайт / Другое')) {
    return byUrl;
  }
  if (platform && platform !== 'Website' && platform !== 'Сайт / Другое') {
    return platform;
  }
  const byTitle = detectPlatformFromUrl(title.toLowerCase().replace(/\s+/g, '') + '.com');
  if (byTitle) return byTitle;
  const t = title.toLowerCase();
  if (t.includes('funpay')) return 'FunPay';
  if (t.includes('boosty')) return 'Boosty';
  if (t.includes('telegram') || t.includes('tg')) return 'Telegram';
  if (t.includes('discord') || t.includes('ds')) return 'Discord';
  return byUrl || platform || 'Website';
}

// --- COLOR CONVERSION (HEX <-> HSV / RGB) ---
function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '#ffffff';
  let clean = hex.trim().replace(/[^0-9A-Fa-f]/g, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return '#ffffff';
  return '#' + clean.toLowerCase();
}

function hexToRgbString(hex) {
  const clean = normalizeHex(hex).slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function hexToHsv(hex) {
  const clean = normalizeHex(hex).slice(1);
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToHex(h, s, v) {
  const sNorm = s / 100;
  const vNorm = v / 100;
  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vNorm - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// --- CUSTOM COLOR PICKER ---
const COLOR_PRESETS = [
  '#ffffff', '#a1a1aa', '#38bdf8', '#818cf8',
  '#a855f7', '#f43f5e', '#f59e0b', '#10b981'
];

const BG_PRESETS = [
  '#000000', '#070709', '#0c0d10', '#0a0608',
  '#050a08', '#08060d', '#111114', '#090d12'
];

function ColorControl({ label, value, onChange, presets = COLOR_PRESETS, compact = false }) {
  const [open, setOpen] = useState(false);
  const currentHex = normalizeHex(value || presets[0]);
  const [hexDraft, setHexDraft] = useState(currentHex);
  const [hsv, setHsv] = useState(() => hexToHsv(currentHex));

  const containerRef = useRef(null);
  const svBoxRef = useRef(null);
  const hueBarRef = useRef(null);

  useEffect(() => {
    const norm = normalizeHex(value || presets[0]);
    setHexDraft(norm);
    setHsv(hexToHsv(norm));
  }, [value, presets]);

  useEffect(() => {
    const onOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const applyHsv = useCallback((nextHsv) => {
    setHsv(nextHsv);
    const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
    setHexDraft(nextHex);
    onChange(nextHex);
  }, [onChange]);

  const handleSvPointer = (e) => {
    const box = svBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round(100 - (y / rect.height) * 100);
    applyHsv({ ...hsv, s, v });
  };

  const startSvDrag = (e) => {
    e.preventDefault();
    handleSvPointer(e);
    const onMove = (ev) => handleSvPointer(ev);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleHuePointer = (e) => {
    const bar = hueBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const h = Math.round((x / rect.width) * 360);
    applyHsv({ ...hsv, h });
  };

  const startHueDrag = (e) => {
    e.preventDefault();
    handleHuePointer(e);
    const onMove = (ev) => handleHuePointer(ev);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleDraftChange = (raw) => {
    let val = raw.trim();
    if (!val.startsWith('#')) val = '#' + val;
    setHexDraft(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHsv(hexToHsv(val));
      onChange(val.toLowerCase());
    }
  };

  const pickFromScreen = async () => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const res = await eyeDropper.open();
      if (res?.sRGBHex) {
        const clean = normalizeHex(res.sRGBHex);
        setHexDraft(clean);
        setHsv(hexToHsv(clean));
        onChange(clean);
      }
    } catch {
      // Cancelled
    }
  };

  const pureHueColor = `hsl(${hsv.h}, 100%, 50%)`;

  const popoverPanel = open && (
    <div className="absolute right-0 mt-2 w-64 bg-[#111115] border border-white/[0.12] rounded-xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 space-y-3 animate-panel-in">
      <div
        ref={svBoxRef}
        onPointerDown={startSvDrag}
        style={{ backgroundColor: pureHueColor }}
        className="w-full h-36 rounded-lg relative cursor-crosshair overflow-hidden border border-white/10 select-none"
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))' }}
        />
        <div
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: currentHex
          }}
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.9)] -translate-x-1/2 -translate-y-1/2 pointer-events-none absolute"
        />
      </div>

      <div
        ref={hueBarRef}
        onPointerDown={startHueDrag}
        style={{
          background:
            'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
        }}
        className="w-full h-3 rounded-full relative cursor-pointer border border-white/15 select-none"
      >
        <div
          style={{ left: `${(hsv.h / 360) * 100}%` }}
          className="w-4 h-4 rounded-full bg-white border-2 border-[#111115] shadow -translate-x-1/2 -translate-y-1/2 top-1/2 pointer-events-none absolute"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[#18181d] border border-white/[0.08] rounded-lg px-3 h-9">
          <span
            className="w-3.5 h-3.5 rounded-sm border border-white/25 shrink-0"
            style={{ backgroundColor: currentHex }}
          />
          <input
            type="text"
            maxLength={7}
            value={hexDraft}
            onChange={(e) => handleDraftChange(e.target.value)}
            className="w-full bg-transparent text-xs font-mono tabular-nums text-zinc-200 focus:outline-none uppercase leading-none"
          />
        </div>

        {typeof window !== 'undefined' && 'EyeDropper' in window && (
          <button
            type="button"
            onClick={pickFromScreen}
            className="w-9 h-9 rounded-lg bg-[#18181d] hover:bg-[#222229] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <Pipette className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-8 gap-1.5 pt-2.5 border-t border-white/[0.06]">
        {presets.map((hex) => {
          const active = currentHex === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => {
                setHexDraft(hex);
                setHsv(hexToHsv(hex));
                onChange(hex);
              }}
              style={{ backgroundColor: hex }}
              className={`w-full aspect-square rounded-md border transition cursor-pointer ${
                active ? 'border-white scale-105 ring-1 ring-white/40' : 'border-white/15 hover:border-white/40'
              }`}
            />
          );
        })}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center gap-2 bg-[#111115] hover:bg-[#17171c] border border-white/[0.08] hover:border-white/[0.16] rounded-xl px-3 h-10 transition cursor-pointer leading-none"
        >
          <span
            className="w-4 h-4 rounded-sm border border-white/25 shrink-0"
            style={{ backgroundColor: currentHex }}
          />
          <span className="text-xs font-mono tabular-nums text-zinc-200 uppercase">{currentHex}</span>
        </button>
        {popoverPanel}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-200 leading-none">{label}</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center gap-2 bg-[#141419] hover:bg-[#1b1b22] border border-white/[0.08] rounded-lg px-2.5 h-8 transition cursor-pointer leading-none"
        >
          <span
            className="w-3.5 h-3.5 rounded-sm border border-white/25 shrink-0"
            style={{ backgroundColor: currentHex }}
          />
          <span className="text-xs font-mono tabular-nums text-zinc-200 uppercase">{currentHex}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {presets.map((hex) => {
          const active = currentHex === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => {
                setHexDraft(hex);
                setHsv(hexToHsv(hex));
                onChange(hex);
              }}
              style={{ backgroundColor: hex }}
              className={`w-6 h-6 rounded-md border transition cursor-pointer ${
                active
                  ? 'border-white ring-1 ring-white/40'
                  : 'border-white/15 hover:border-white/40 opacity-85 hover:opacity-100'
              }`}
            />
          );
        })}
      </div>

      {popoverPanel}
    </div>
  );
}

// --- CUSTOM SELECT ---
function CustomSelect({ value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3.5 bg-[#111115] hover:bg-[#17171c] border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-sm text-zinc-200 flex items-center justify-between gap-2 transition cursor-pointer leading-none"
      >
        <span className="flex items-center gap-2.5 truncate">
          {selected?.icon}
          <span className="truncate">{selected?.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 bg-[#121216] border border-white/[0.12] rounded-xl shadow-2xl py-1 z-50 max-h-60 overflow-y-auto dark-scroll animate-panel-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 text-sm leading-none text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                opt.value === value
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                {opt.icon}
                <span className="truncate">{opt.label}</span>
              </span>
              {opt.value === value && <Check className="w-4 h-4 text-white shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- THEMES & CONSTANTS ---
const THEMES = {
  obsidian: {
    name: 'Obsidian',
    bg: '#000000',
    cardBg: 'rgba(15, 15, 18, 0.84)',
    border: 'rgba(255, 255, 255, 0.09)',
    text: '#ffffff',
    subtext: '#a1a1aa',
    accent: '#ef4444',
    particleColor: '239, 68, 68'
  },
  graphite: {
    name: 'Graphite',
    bg: '#090a0d',
    cardBg: 'rgba(20, 22, 27, 0.86)',
    border: 'rgba(148, 163, 184, 0.14)',
    text: '#f8fafc',
    subtext: '#94a3b8',
    accent: '#38bdf8',
    particleColor: '56, 189, 248'
  },
  silver: {
    name: 'Monolith',
    bg: '#08080a',
    cardBg: 'rgba(22, 22, 25, 0.86)',
    border: 'rgba(212, 212, 216, 0.15)',
    text: '#fafafa',
    subtext: '#a1a1aa',
    accent: '#d4d4d8',
    particleColor: '212, 212, 216'
  },
  crimson: {
    name: 'Crimson',
    bg: '#080406',
    cardBg: 'rgba(22, 10, 14, 0.85)',
    border: 'rgba(244, 63, 94, 0.2)',
    text: '#fff1f2',
    subtext: '#fda4af',
    accent: '#f43f5e',
    particleColor: '244, 63, 94'
  },
  emerald: {
    name: 'Forest',
    bg: '#040806',
    cardBg: 'rgba(10, 22, 17, 0.85)',
    border: 'rgba(16, 185, 129, 0.2)',
    text: '#ecfdf5',
    subtext: '#6ee7b7',
    accent: '#10b981',
    particleColor: '16, 185, 129'
  },
  amethyst: {
    name: 'Dusk',
    bg: '#07050b',
    cardBg: 'rgba(18, 13, 28, 0.85)',
    border: 'rgba(168, 85, 247, 0.2)',
    text: '#faf5ff',
    subtext: '#d8b4fe',
    accent: '#a855f7',
    particleColor: '168, 85, 247'
  }
};

const FONTS = [
  { value: 'Manrope', label: 'Manrope' },
  { value: 'Inter', label: 'Inter' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Cinzel', label: 'Cinzel' }
];

const PLATFORMS = [
  { id: 'Telegram', placeholder: 'https://t.me/username' },
  { id: 'Discord', placeholder: 'https://discord.gg/... or tag' },
  { id: 'VK', placeholder: 'https://vk.com/username' },
  { id: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { id: 'Twitch', placeholder: 'https://twitch.tv/username' },
  { id: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { id: 'GitHub', placeholder: 'https://github.com/username' },
  { id: 'Steam', placeholder: 'https://steamcommunity.com/id/...' },
  { id: 'FunPay', placeholder: 'https://funpay.com/users/...' },
  { id: 'Boosty', placeholder: 'https://boosty.to/username' },
  { id: 'DonationAlerts', placeholder: 'https://donationalerts.com/r/...' },
  { id: 'Spotify', placeholder: 'https://open.spotify.com/user/...' },
  { id: 'Instagram', placeholder: 'https://instagram.com/username' },
  { id: 'X', placeholder: 'https://x.com/username' },
  { id: 'Website', placeholder: 'https://example.com' }
];

const STATUS_OPTIONS = [
  { value: 'none', label: 'Hidden', color: 'transparent' },
  { value: 'online', label: 'Online', color: '#10b981' },
  { value: 'idle', label: 'Idle', color: '#f59e0b' },
  { value: 'dnd', label: 'Do Not Disturb', color: '#f43f5e' },
  { value: 'streaming', label: 'Streaming', color: '#a855f7' }
];

// --- PLATFORM ICONS ---
function PlatformIcon({ platform, className = 'w-4 h-4' }) {
  const Icon = PLATFORM_ICONS[platform] || Globe;
  return <Icon className={`${className} shrink-0`} />;
}

// --- MORPHE FLOW BACKGROUND ---
function AnimatedBackground({ effect, accentColor, bgColor, embedded = false }) {
  if (effect === 'none') return null;

  const ribbonPath =
    'M -180 824 C 48 684 142 347 350 260 C 550 180 700 300 636 478 C 564 680 636 820 848 755 C 1085 682 1076 430 1240 314 C 1390 208 1540 250 1760 95';
  const lowerFoldPath =
    'M -160 972 C 88 850 250 642 462 570 C 650 506 790 610 745 750 C 710 856 812 920 1008 832 C 1190 750 1264 560 1416 498 C 1510 460 1600 474 1740 414';

  return (
    <div
      aria-hidden="true"
      className={`eidos-flow-background ${embedded ? 'eidos-flow-embedded' : 'eidos-flow-viewport'}`}
      style={{ color: `rgb(${accentColor || '239, 68, 68'})`, backgroundColor: bgColor || '#070709' }}
    >
      <svg className="eidos-flow-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <path className="eidos-flow-line eidos-flow-halo" d={ribbonPath} />
        <path className="eidos-flow-line eidos-flow-body" d={ribbonPath} />
        <path className="eidos-flow-line eidos-flow-edge" d={ribbonPath} />
        <path className="eidos-flow-line eidos-flow-fold" d={lowerFoldPath} />
      </svg>
    </div>
  );
}

// --- SAFE IMAGE ---
// Только http(s), без реферера (чужой хостинг не узнаёт, с какой страницы пришли),
// ленивая загрузка и запасной контент, если картинка не загрузилась.
function SafeImage({ src, alt = '', className, fallback = null, eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  const safe = toSafeImageUrl(src);
  if (!safe || failed) return fallback;
  return (
    <img
      src={safe}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      decoding="async"
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}

function ProfileAvatarFallback() {
  return <span className="profile-default-avatar" aria-hidden="true" />;
}

function ProfileBannerFallback() {
  return (
    <div className="auth-preview-cover profile-default-banner" aria-hidden="true">
      <span />
    </div>
  );
}

// --- PROFILE CARD ---
function BioCard({ profile, isPreview = false, isOwner = false }) {
  const [copiedText, setCopiedText] = useState('');

  const cfg = profile.theme_config || {};
  const baseTheme = THEMES[cfg.themeKey] || THEMES.obsidian;
  const accent = cfg.customAccent || baseTheme.accent;
  const font = FONTS.some((f) => f.value === cfg.font) ? cfg.font : 'Manrope';
  const radius = cfg.cardRadius != null && Number.isFinite(Number(cfg.cardRadius)) ? Number(cfg.cardRadius) : 12;
  const cardStyle = cfg.cardStyle || 'glass';
  const statusInfo = STATUS_OPTIONS.find((s) => s.value === (cfg.status || 'none'));
  const socials = asSocials(profile);

  const items = asLinks(profile).filter((l) => isPreview || l.visible !== false);

  const triggerCopy = async (text, label) => {
    if (!(await copyText(text))) return;
    setCopiedText(label || text);
    setTimeout(() => setCopiedText(''), 1800);
  };

  const handleLinkClick = (link) => {
    if (isPreview || isOwner) return;
    // Билдеры postgrest-js ленивые: запрос уходит только на .then().
    // Без этого вызова (как было раньше) клик вообще не отправлялся.
    supabase
      .rpc('increment_link_click', {
        profile_username: profile.username,
        target_link_id: String(link.id)
      })
      .then(
        () => {},
        () => {}
      );
  };

  const getCardInlineStyle = (featured) => {
    const base = {
      borderRadius: `${radius}px`,
      borderColor: featured ? `${accent}66` : baseTheme.border
    };
    if (cardStyle === 'solid') {
      return {
        ...base,
        backgroundColor: featured ? '#16161b' : '#111114',
        borderWidth: '1px'
      };
    }
    if (cardStyle === 'outline') {
      return {
        ...base,
        backgroundColor: featured ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderWidth: '1px'
      };
    }
    return {
      ...base,
      backgroundColor: baseTheme.cardBg,
      borderWidth: '1px',
      backdropFilter: 'blur(12px)'
    };
  };

  return (
    <div
      style={{ fontFamily: `'${font}', sans-serif`, color: baseTheme.text }}
      className="w-full max-w-[420px] mx-auto px-5 pt-7 pb-12 flex flex-col items-center text-center relative z-10 animate-panel-in"
    >
      {copiedText && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#141418] border border-white/15 text-white text-xs px-3.5 py-2 rounded-lg shadow-xl inline-flex items-center justify-center gap-2 leading-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-200">{copiedText}</span>
        </div>
      )}

      {/* Banner */}
      <div className="w-full h-32 rounded-xl overflow-hidden mb-[-44px] border border-white/10 relative">
        <SafeImage
          src={cfg.bannerUrl}
          className="w-full h-full object-cover"
          eager
          fallback={<ProfileBannerFallback />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      </div>

      {/* Avatar */}
      <div className="mb-3.5">
        <div
          style={{ borderColor: `${accent}66` }}
          className="w-[88px] h-[88px] rounded-full border overflow-hidden bg-zinc-900 flex items-center justify-center relative"
        >
          <SafeImage
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            className="w-full h-full object-cover"
            eager
            fallback={<ProfileAvatarFallback />}
          />
        </div>
      </div>

      {/* Name */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-snug">
          {profile.display_name || profile.username}
        </h1>
        {statusInfo && statusInfo.value !== 'none' && (
          <span
            aria-label={`Status: ${statusInfo.label}`}
            style={{
              color: statusInfo.color,
              borderColor: `${statusInfo.color}55`,
              backgroundColor: `${statusInfo.color}18`
            }}
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-[11px] font-medium leading-none"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
            {statusInfo.label}
          </span>
        )}
      </div>

      <button
        onClick={() => triggerCopy(`${window.location.origin}/${profile.username}`, `@${profile.username}`)}
        aria-label="Copy profile link"
        className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-sm opacity-55 hover:opacity-95 transition cursor-pointer leading-none"
      >
        <span>@{profile.username}</span>
        <Copy className="w-3.5 h-3.5 shrink-0" />
      </button>

      {/* Badge */}
      {cfg.badge && (
        <span
          style={{ borderColor: `${accent}33`, color: accent, backgroundColor: `${accent}0f` }}
          className="mt-3 inline-flex items-center justify-center px-3 py-1 text-xs leading-none rounded-lg border font-medium"
        >
          {cfg.badge}
        </span>
      )}

      {/* Bio */}
      {profile.bio && (
        <p style={{ color: baseTheme.subtext }} className="mt-3.5 text-sm leading-relaxed max-w-sm whitespace-pre-line">
          {profile.bio}
        </p>
      )}

      {/* Social Icons */}
      {socials.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {socials.map((s, idx) => {
            const resolved = resolvePlatform(s.platform, s.value, s.platform);
            const socialHref = toSafeHttpUrl(s.value);
            const isCopy = !socialHref;
            return isCopy ? (
              <button
                key={`${s.id ?? 's'}-${idx}`}
                onClick={() => triggerCopy(s.value, s.value)}
                style={{ backgroundColor: baseTheme.cardBg, borderColor: baseTheme.border }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:border-white/35 transition cursor-pointer"
                title={s.value}
              >
                <PlatformIcon platform={resolved} className="w-4 h-4" />
              </button>
            ) : (
              <a
                key={`${s.id ?? 's'}-${idx}`}
                href={isPreview ? undefined : socialHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isPreview && e.preventDefault()}
                style={{ backgroundColor: baseTheme.cardBg, borderColor: baseTheme.border }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:border-white/35 transition"
                title={resolved}
              >
                <PlatformIcon platform={resolved} className="w-4 h-4" />
              </a>
            );
          })}
        </div>
      )}

      {/* Link Cards */}
      <div className="w-full mt-6 space-y-2.5">
        {items.map((item, idx) => {
          const itemKey = `${item.id ?? 'i'}-${idx}`;
          if (item.type === 'header') {
            return (
              <div key={itemKey} className="pt-3.5 pb-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.16em] opacity-50 font-semibold leading-none">
                  {item.title}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            );
          }

          const resolved = resolvePlatform(item.platform, item.url, item.title);
          const itemColor = item.color || accent;
          const itemHref = toSafeHttpUrl(item.url);
          // Ссылку с недопустимой схемой на публичной странице не показываем вовсе.
          if (!itemHref && !isPreview) return null;
          return (
            <a
              key={itemKey}
              href={isPreview ? undefined : itemHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isPreview) e.preventDefault();
                else handleLinkClick(item);
              }}
              style={getCardInlineStyle(item.featured)}
              className="group relative flex items-center justify-between w-full px-3.5 py-3 transition-colors duration-150 hover:border-white/30 cursor-pointer"
            >
              {item.featured && (
                <span
                  style={{ backgroundColor: itemColor }}
                  className="w-0.5 h-5 rounded-full mr-3 shrink-0"
                />
              )}

              <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                <div
                  style={{ backgroundColor: `${itemColor}18`, color: itemColor }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                >
                  <PlatformIcon platform={resolved} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs opacity-55 leading-snug truncate mt-0.5">{item.subtitle}</div>
                  )}
                </div>
              </div>

              <ArrowUpRight className="w-4 h-4 opacity-35 group-hover:opacity-90 transition-opacity shrink-0 ml-2" />
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-xs opacity-40 hover:opacity-75 transition inline-flex items-center justify-center leading-none">
        <Link to="/" className="brand-wordmark font-semibold uppercase text-xs leading-none">
          MORPHE
        </Link>
      </div>
    </div>
  );
}

// --- EXPLORE (/explore) ---
function ExplorePage() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = 'Explore — MORPHE';
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Поиск идёт по всей базе, а не по уже загруженным 40 профилям.
    // В запрос попадают только буквы/цифры/_/пробел/дефис: запятые, скобки и точки
    // ломают синтаксис or=(…) в PostgREST.
    const term = search.trim().replace(/[^\p{L}\p{N}_ -]/gu, '').slice(0, 40);
    const timer = setTimeout(
      async () => {
        let query = supabase
          .from('profiles')
          .select('username, display_name, bio, avatar_url, theme_config, is_banned')
          .eq('is_banned', false)
          .order('views', { ascending: false })
          .limit(40);
        if (term) query = query.or(`username.ilike.*${term}*,display_name.ilike.*${term}*`);
        const { data, error } = await query;
        if (cancelled) return;
        setFailed(Boolean(error));
        setProfiles(error ? [] : data || []);
        setLoading(false);
      },
      term ? 250 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, reloadKey]);

  return (
    <div className="explore-page min-h-screen bg-[#070709] text-zinc-200">
      <AnimatedBackground effect="eidos" accentColor="239, 68, 68" bgColor="#070709" />
      <header className="explore-header border-b border-white/[0.08] bg-[#0a0a0d] px-5 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="inline-flex items-center gap-2.5 text-white leading-none">
          <MorpheMark className="w-7 h-7 text-white shrink-0" />
          <span className="brand-wordmark text-sm uppercase">MORPHE</span>
        </Link>

        <div className="relative w-56 sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search profiles"
            maxLength={40}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl pl-9 pr-3 text-sm text-white focus:outline-none focus:border-white/25 transition"
          />
        </div>
      </header>

      <div className="explore-content max-w-5xl mx-auto px-4 py-9">
        <div className="explore-heading">
          <h1>Profiles</h1>
        </div>
        {loading ? (
          <div className="py-20 flex justify-center text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : failed ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center text-zinc-400 text-sm">
            <span>Couldn't load profiles.</span>
            <button
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
              className="h-9 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm">No profiles found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <Link
                key={p.username}
                to={`/${p.username}`}
                className="explore-profile"
              >
                <div className="explore-card-banner">
                  <SafeImage
                    src={p.theme_config?.bannerUrl}
                    className="w-full h-full object-cover"
                    fallback={<ProfileBannerFallback />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101013] via-black/10 to-transparent" />
                </div>

                <div className="explore-card-content">
                  <div className="explore-card-identity">
                    <div className="explore-card-avatar">
                      <SafeImage
                        src={p.avatar_url}
                        className="w-full h-full object-cover"
                        fallback={<ProfileAvatarFallback />}
                      />
                    </div>
                    <div className="min-w-0 pb-1">
                      <div className="font-semibold text-[15px] text-white truncate">
                        {p.display_name || p.username}
                      </div>
                      <div className="text-xs text-zinc-400 truncate mt-0.5">@{p.username}</div>
                    </div>
                    <span className="explore-card-arrow" aria-hidden="true">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>

                  {p.bio && (
                    <p className="text-sm text-zinc-400 mt-3 line-clamp-2 leading-relaxed">{p.bio}</p>
                  )}

                  {typeof p.theme_config?.badge === 'string' && p.theme_config.badge.trim() && (
                    <div className="explore-card-badge">{p.theme_config.badge.trim()}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- PUBLIC PROFILE (/:username) ---
// Публичной странице не нужны is_admin и прочие служебные колонки.
const PUBLIC_PROFILE_COLUMNS = 'id, username, display_name, bio, avatar_url, theme_config, links, is_banned';

// sessionStorage может бросать (Safari private mode, отключённое хранилище).
function viewAlreadyCounted(name) {
  try {
    return Boolean(sessionStorage.getItem(`eidos_viewed_${name}`));
  } catch {
    return false;
  }
}
function markViewCounted(name) {
  try {
    sessionStorage.setItem(`eidos_viewed_${name}`, '1');
  } catch {
    /* не критично */
  }
}

function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setLoadError(false);
      const cleanName = String(username || '').toLowerCase().trim();

      // Мусорные пути (/favicon.ico, /a.b) не заслуживают запроса к базе.
      if (!/^[a-z0-9_]{1,64}$/.test(cleanName)) {
        setProfile(null);
        document.title = '404 — MORPHE';
        setLoading(false);
        return;
      }

      try {
        const [{ data, error }, { data: sessionData }] = await Promise.all([
          supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).eq('username', cleanName).maybeSingle(),
          supabase.auth.getSession()
        ]);
        if (cancelled) return;

        if (error) {
          // Сетевая/серверная ошибка — это не «ника не существует».
          setProfile(null);
          setLoadError(true);
          document.title = 'MORPHE';
        } else if (!data) {
          setProfile(null);
          document.title = '404 — MORPHE';
        } else {
          const session = sessionData?.session;
          const ownerMatch = Boolean(session?.user?.id && session.user.id === data.id);
          setIsOwner(ownerMatch);
          setProfile(data);
          document.title = `${data.display_name || data.username} — MORPHE`;

          // Просмотр считаем в фоне — страница не ждёт ответа RPC.
          if (!ownerMatch && !data.is_banned && !viewAlreadyCounted(cleanName)) {
            markViewCounted(cleanName);
            supabase.rpc('increment_views', { profile_username: cleanName }).then(
              () => {},
              () => {}
            );
          }
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setLoadError(true);
        }
      }
      if (!cancelled) setLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [username, reloadKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4 gap-3">
        <div className="text-sm text-zinc-400">Couldn't load this page.</div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="h-10 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition inline-flex items-center justify-center leading-none cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
        <div className="text-sm text-zinc-400">@{username}</div>
        <Link
          to="/"
          className="mt-4 h-10 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition inline-flex items-center justify-center leading-none"
        >
          Claim handle
        </Link>
      </div>
    );
  }

  if (profile.is_banned) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
        <Ban className="w-6 h-6 text-zinc-600 mb-2" />
        <div className="text-xs text-zinc-400">@{profile.username}</div>
      </div>
    );
  }

  const cfg = profile.theme_config || {};
  const baseTheme = THEMES[cfg.themeKey] || THEMES.obsidian;
  const activeBg = cfg.customBg || baseTheme.bg;
  const activeParticleRgb = cfg.customAccent
    ? hexToRgbString(cfg.customAccent)
    : baseTheme.particleColor;

  return (
    <div
      style={{ backgroundColor: activeBg }}
      className="public-profile-page min-h-screen flex items-center justify-center relative"
    >
      <AnimatedBackground
        effect={cfg.bgEffect || 'eidos'}
        accentColor={activeParticleRgb}
        bgColor={activeBg}
      />
      <div className="profile-card-shell">
        <BioCard profile={profile} isOwner={isOwner} />
      </div>
    </div>
  );
}

// Человекочитаемые тексты вместо сырых ошибок Postgres/PostgREST.
function describeDbError(error) {
  if (!error) return '';
  const msg = error.message || '';
  if (error.code === 'PGRST202' || /could not find the function/i.test(msg)) {
    return 'Server function missing — apply supabase/001_eidos_hardening.sql';
  }
  if (error.code === '42501' || /permission denied|row-level security/i.test(msg)) return 'Not allowed';
  if (error.code === '23505') return 'This handle is already taken';
  if (error.code === '23514') return 'This value is not allowed';
  return msg || 'Something went wrong';
}

const ADMIN_LIST_LIMIT = 1000; // лимит PostgREST по умолчанию

// --- ADMIN PANEL (/admin) ---
function AdminPanel() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  useEffect(() => {
    document.title = 'Admin — MORPHE';
    async function verifyAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckingAuth(false);
        return;
      }
      setCurrentUserId(session.user.id);

      const { data: me } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      // Это только решает, что показать в UI. Реальная защита — проверки
      // is_admin() внутри RPC и права на колонки в БД (см. supabase/001_*.sql).
      if (me?.is_admin) {
        setIsAdmin(true);
        await fetchAllProfiles();
      }
      setCheckingAuth(false);
    }
    verifyAndLoad();
  }, []);

  async function fetchAllProfiles() {
    setLoadingUsers(true);
    const { data, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('views', { ascending: false })
      .limit(ADMIN_LIST_LIMIT);
    if (error) showToast(describeDbError(error));
    setUsers(data || []);
    setTotalUsers(count ?? (data || []).length);
    setLoadingUsers(false);
  }

  async function toggleFlag(user, field) {
    if (user.id === currentUserId) return;
    if (field !== 'is_admin' && field !== 'is_banned') return;
    const nextVal = !user[field];
    const { error } = await supabase.rpc('admin_set_flag', {
      target: user.id,
      flag: field,
      val: nextVal
    });

    if (error) {
      showToast(describeDbError(error));
    } else {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, [field]: nextVal } : u)));
      showToast('Updated');
    }
  }

  async function saveUserOverride(e) {
    e.preventDefault();
    if (!editingUser) return;
    const cleanUser = sanitizeUsername(editingUser.username);
    const problem = validateUsername(cleanUser, { min: 2 });
    if (problem) {
      showToast(problem);
      return;
    }
    const nextViews = Math.max(0, Math.floor(Number(editingUser.views)) || 0);

    const { error } = await supabase.rpc('admin_update_profile', {
      target: editingUser.id,
      new_username: cleanUser,
      new_views: nextViews
    });

    if (error) {
      showToast(describeDbError(error));
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, username: cleanUser, views: nextViews } : u))
      );
      setEditingUser(null);
      showToast('Saved');
    }
  }

  async function deleteProfile(user) {
    if (user.id === currentUserId) return;
    if (!window.confirm(`Delete @${user.username}?`)) return;

    const { error } = await supabase.rpc('admin_delete_profile', { target: user.id });
    if (error) {
      showToast(describeDbError(error));
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotalUsers((n) => (n == null ? n : Math.max(0, n - 1)));
      showToast('Deleted');
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const totalViews = users.reduce((sum, u) => sum + (u.views || 0), 0);
  const totalClicks = users.reduce((sum, u) => sum + sumClicks(u), 0);
  const adminCount = users.filter((u) => u.is_admin).length;

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-shell min-h-screen bg-[#070709] text-zinc-200 flex flex-col">
      <AnimatedBackground effect="eidos" accentColor="239, 68, 68" bgColor="#070709" />
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#141418] border border-white/15 text-white text-xs px-3.5 py-2 rounded-lg shadow-xl inline-flex items-center justify-center gap-2 leading-none animate-panel-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {toast}
        </div>
      )}

      <header className="border-b border-white/[0.08] bg-[#0a0a0d] px-5 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 leading-none">
          <MorpheMark className="w-7 h-7 text-white shrink-0" />
          <span className="brand-wordmark text-white text-sm uppercase">MORPHE</span>
          <span className="text-zinc-600">/</span>
          <span className="text-sm text-zinc-400 font-medium">Admin</span>
        </div>

        <Link
          to="/"
          className="h-9 px-3.5 bg-[#121216] hover:bg-[#18181d] border border-white/[0.08] rounded-xl text-sm text-zinc-200 transition inline-flex items-center justify-center font-medium leading-none"
        >
          Editor
        </Link>
      </header>

      <div className="max-w-5xl w-full mx-auto px-4 lg:px-8 py-6 space-y-5 animate-panel-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 leading-none">
              <span>Accounts</span>
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-xl font-semibold text-white mt-2 tabular-nums leading-none">{totalUsers ?? users.length}</div>
          </div>

          <div className="bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 leading-none">
              <span>Views</span>
              <Eye className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-xl font-semibold text-white mt-2 tabular-nums leading-none">{totalViews}</div>
          </div>

          <div className="bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 leading-none">
              <span>Clicks</span>
              <BarChart2 className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-xl font-semibold text-white mt-2 tabular-nums leading-none">{totalClicks}</div>
          </div>

          <div className="bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 leading-none">
              <span>Admins</span>
              <Shield className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-xl font-semibold text-white mt-2 tabular-nums leading-none">{adminCount}</div>
          </div>
        </div>

        <div className="bg-[#0c0c0f] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.07] flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white leading-none">
              Users
              {totalUsers != null && totalUsers > users.length && (
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  showing top {users.length} of {totalUsers}
                </span>
              )}
            </span>

            <div className="relative w-52 sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 bg-[#121216] border border-white/[0.08] rounded-xl pl-9 pr-3 text-sm text-white focus:outline-none focus:border-white/25"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 flex justify-center text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.015] transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      <SafeImage
                        src={u.avatar_url}
                        className="w-full h-full object-cover"
                        fallback={<ProfileAvatarFallback />}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/${u.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-white hover:underline truncate"
                        >
                          {u.display_name || u.username}
                        </a>
                        <span className="text-xs text-zinc-500">@{u.username}</span>

                        {u.is_admin && (
                          <span className="inline-flex items-center justify-center text-xs leading-none px-2 py-0.5 rounded-md bg-white text-black font-semibold">
                            ADMIN
                          </span>
                        )}
                        {u.is_banned && (
                          <span className="inline-flex items-center justify-center text-xs leading-none px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/25 font-medium">
                            BANNED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 tabular-nums mt-0.5">
                        {u.views || 0} views · {asLinks(u).length} links
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleFlag(u, 'is_admin')}
                      disabled={u.id === currentUserId}
                      className={`h-8 px-3 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1.5 leading-none transition cursor-pointer disabled:opacity-40 ${
                        u.is_admin
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-[#121216] border-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" /> Admin
                    </button>

                    <button
                      onClick={() => setEditingUser({ id: u.id, username: u.username, views: u.views || 0 })}
                      className="h-8 px-3 rounded-lg bg-[#121216] hover:bg-[#18181f] border border-white/[0.08] text-xs font-medium text-zinc-300 inline-flex items-center justify-center gap-1.5 leading-none transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" /> Edit
                    </button>

                    <button
                      onClick={() => toggleFlag(u, 'is_banned')}
                      disabled={u.id === currentUserId}
                      className={`h-8 w-8 rounded-lg border inline-flex items-center justify-center transition cursor-pointer disabled:opacity-40 ${
                        u.is_banned
                          ? 'bg-rose-500/20 border-rose-500/35 text-rose-300'
                          : 'bg-[#121216] border-white/[0.08] text-zinc-400 hover:text-rose-400'
                      }`}
                      title="Ban / Unban"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteProfile(u)}
                      disabled={u.id === currentUserId}
                      className="h-8 w-8 rounded-lg bg-[#121216] hover:bg-rose-500/15 border border-white/[0.08] hover:border-rose-500/25 text-zinc-500 hover:text-rose-400 inline-flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={saveUserOverride}
            className="w-full max-w-xs bg-[#101014] border border-white/[0.12] rounded-xl p-4 space-y-3.5 shadow-2xl animate-panel-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white leading-none">@{editingUser.username}</span>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.05] inline-flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Handle</label>
              <input
                type="text"
                required
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                className="w-full h-9 bg-[#16161b] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Views</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={editingUser.views}
                  onChange={(e) => setEditingUser({ ...editingUser, views: e.target.value })}
                  className="flex-1 h-9 bg-[#16161b] border border-white/[0.08] rounded-lg px-3 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setEditingUser({ ...editingUser, views: 0 })}
                  className="h-9 px-3 bg-[#16161b] hover:bg-[#1e1e24] border border-white/[0.08] rounded-lg text-xs text-zinc-300 inline-flex items-center justify-center gap-1 leading-none cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 0
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="h-9 px-3.5 bg-[#16161b] text-zinc-300 text-xs font-medium rounded-lg hover:bg-[#1e1e24] inline-flex items-center justify-center leading-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 bg-white text-black font-medium text-xs rounded-lg hover:bg-zinc-200 inline-flex items-center justify-center leading-none cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Какие ссылки отправлять в БД при сохранении.
// После миграции счётчики кликов живут в отдельной колонке link_clicks и в links не пишутся.
// До миграции они лежат внутри links и растут на сервере — подтягиваем свежие значения,
// иначе сохранение откатило бы клики назад.
async function buildLinksPayload(profile) {
  const links = asLinks(profile);
  if (usesSeparateClicks(profile)) return stripClicks(links);
  const { data } = await supabase.from('profiles').select('links').eq('id', profile.id).maybeSingle();
  const server = new Map(asLinks(data).map((l) => [l.id, Number(l.clicks) || 0]));
  return links.map((l) => (l.type === 'header' ? l : { ...l, clicks: server.get(l.id) ?? 0 }));
}

// --- EDITOR (/) ---
function Dashboard() {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('links');
  const [tabDirection, setTabDirection] = useState(1);
  const [previewMode, setPreviewMode] = useState('mobile');
  const [uploadingField, setUploadingField] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [notice, setNotice] = useState(null);

  const loadedUserRef = useRef(null); // для какого user.id уже загружен профиль
  const savedMediaRef = useRef({ avatar: '', banner: '' }); // что сейчас сохранено в БД
  const pendingUploadRef = useRef({}); // загружено в Storage, но ещё не сохранено в профиль
  const savingRef = useRef(false);
  const noticeTimerRef = useRef(0);

  const changeActiveTab = (nextTab) => {
    const tabs = ['links', 'design', 'profile'];
    if (nextTab === activeTab) return;
    setTabDirection(tabs.indexOf(nextTab) > tabs.indexOf(activeTab) ? 1 : -1);
    setActiveTab(nextTab);
  };

  const showNotice = useCallback((msg, type = 'error') => {
    clearTimeout(noticeTimerRef.current);
    setNotice({ msg, type });
    noticeTimerRef.current = setTimeout(() => setNotice(null), type === 'error' ? 4500 : 2500);
  }, []);

  // Block form
  const [blockType, setBlockType] = useState('link');
  const [newPlatform, setNewPlatform] = useState('Telegram');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newColor, setNewColor] = useState('#ffffff');
  const [newFeatured, setNewFeatured] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Social icons form
  const [socialPlatform, setSocialPlatform] = useState('Discord');
  const [socialValue, setSocialValue] = useState('');

  useEffect(() => {
    document.title = 'MORPHE';
    let active = true;

    const handleSession = (nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        loadedUserRef.current = null;
        setProfile(null);
        return;
      }
      // onAuthStateChange срабатывает не только при входе: INITIAL_SESSION, возврат на вкладку,
      // обновление токена. Профиль перезагружаем только когда сменился пользователь, иначе
      // несохранённые правки затирались бы при каждом возвращении на вкладку.
      if (loadedUserRef.current === nextSession.user.id) return;
      loadedUserRef.current = nextSession.user.id;
      // Запросы к Supabase прямо из auth-колбэка откладываем: так рекомендует документация
      // (иначе возможна взаимоблокировка внутри клиента).
      setTimeout(() => {
        if (active) fetchUserProfile(nextSession.user);
      }, 0);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (active) handleSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => handleSession(nextSession));

    return () => {
      active = false;
      clearTimeout(noticeTimerRef.current);
      subscription.unsubscribe();
    };
  }, []);

  // Предупреждение браузера при закрытии вкладки с несохранёнными правками.
  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsaved]);

  // После успешного сохранения удаляем из хранилища файлы, на которые профиль больше не ссылается:
  // прежнюю сохранённую картинку и «висячие» загрузки, которые так и не попали в профиль.
  const cleanupReplacedMedia = useCallback((userId, avatarUrl, bannerUrl) => {
    const paths = staleMediaPaths({
      saved: savedMediaRef.current,
      pending: pendingUploadRef.current,
      now: { avatar: avatarUrl || '', banner: bannerUrl || '' },
      userId
    });
    savedMediaRef.current = { avatar: avatarUrl || '', banner: bannerUrl || '' };
    pendingUploadRef.current = {};
    if (paths.length) {
      supabase.storage
        .from(MEDIA_BUCKET)
        .remove(paths)
        .then(
          () => {},
          () => {}
        );
    }
  }, []);

  const saveChanges = useCallback(async () => {
    if (!profile || !session || savingRef.current) return;
    const cleanUser = sanitizeUsername(profile.username);
    const problem = validateUsername(cleanUser);
    if (problem) {
      showNotice(problem);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const links = await buildLinksPayload(profile);
      const { error } = await supabase
        .from('profiles')
        .update({
          username: cleanUser,
          display_name: String(profile.display_name ?? '').slice(0, LIMITS.displayName),
          bio: String(profile.bio ?? '').slice(0, LIMITS.bio),
          avatar_url: profile.avatar_url,
          theme_config: profile.theme_config,
          links
        })
        .eq('id', session.user.id);

      if (error) {
        showNotice(describeDbError(error));
        return;
      }
      setProfile((prev) => ({ ...prev, username: cleanUser }));
      setHasUnsaved(false);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
      cleanupReplacedMedia(session.user.id, profile.avatar_url, profile.theme_config?.bannerUrl);
    } catch (err) {
      showNotice(err?.message || 'Could not save changes');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [profile, session, showNotice, cleanupReplacedMedia]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveChanges();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveChanges]);

  const updateProfileState = (updater) => {
    setProfile((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    setHasUnsaved(true);
  };

  const updateThemeConfig = (key, value) => {
    updateProfileState((prev) => ({
      ...prev,
      theme_config: { ...(prev.theme_config || {}), [key]: value }
    }));
  };

  function adoptProfile(data) {
    setProfile(data);
    setHasUnsaved(false);
    savedMediaRef.current = { avatar: data.avatar_url || '', banner: data.theme_config?.bannerUrl || '' };
    pendingUploadRef.current = {};
  }

  async function fetchUserProfile(user) {
    setProfileError('');
    const { profile: loaded, error } = await loadOrCreateProfile(supabase, user);
    if (error) {
      loadedUserRef.current = null; // дать возможность повторить
      setProfileError(describeDbError(error));
      return;
    }
    adoptProfile(loaded);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        const cleanUser = sanitizeUsername(regUsername);
        const problem = validateUsername(cleanUser);
        if (problem) throw new Error(problem);

        // Проверка только для удобства; настоящую гарантию уникальности даёт unique-индекс в БД.
        const { data: existing } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', cleanUser)
          .maybeSingle();
        if (existing) throw new Error('Username already taken');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Ник едет в metadata: его подхватит триггер на auth.users или fetchUserProfile.
            data: {
              username: cleanUser,
              display_name: String(regUsername).trim().slice(0, LIMITS.displayName) || cleanUser
            }
          }
        });
        if (error) throw error;

        if (!data.session) {
          // Включено подтверждение почты: сессии пока нет, профиль создастся после первого входа.
          setAuthNotice('Check your email to confirm the account, then sign in.');
          setAuthMode('login');
        }
        // Если сессия есть, onAuthStateChange подхватит её и загрузит/создаст профиль.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(describeDbError(err) || 'Authentication error');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleImageUpload(e, target) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ''; // позволяет выбрать тот же файл ещё раз
    if (!file || !session) return;

    const problem = validateImageFile(file);
    if (problem) {
      showNotice(problem);
      return;
    }

    setUploadingField(target);
    try {
      const blob = await compressImage(
        file,
        target === 'banner'
          ? { maxWidth: 1200, maxHeight: 600 }
          : { maxWidth: 512, maxHeight: 512, square: true }
      );
      const path = `${session.user.id}/${target}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' });
      // Раньше при ошибке загрузки в профиль молча писался base64 целиком. Теперь — явная ошибка.
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: pubData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      const url = pubData?.publicUrl;
      if (!url) throw new Error('Could not get the image URL');

      // Предыдущая НЕсохранённая загрузка этого поля нигде не используется — удаляем.
      const prev = pendingUploadRef.current[target];
      if (prev) {
        supabase.storage
          .from(MEDIA_BUCKET)
          .remove([prev.path])
          .then(
            () => {},
            () => {}
          );
      }
      pendingUploadRef.current[target] = { path, url };

      if (target === 'avatar') {
        updateProfileState((p) => ({ ...p, avatar_url: url }));
      } else {
        updateThemeConfig('bannerUrl', url);
      }
    } catch (err) {
      showNotice(err?.message || 'Upload failed');
    } finally {
      setUploadingField('');
    }
  }

  function handleUrlInputChange(val) {
    setNewUrl(val);
    const detected = detectPlatformFromUrl(val);
    if (detected && !editingId) {
      setNewPlatform(detected);
      if (!newTitle.trim()) setNewTitle(detected);
    }
  }

  function handleSocialInputChange(val) {
    setSocialValue(val);
    const detected = detectPlatformFromUrl(val);
    if (detected) setSocialPlatform(detected);
  }

  function handleSaveBlock(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (blockType === 'link' && !newUrl.trim()) return;
    if (!editingId && asLinks(profile).length >= LIMITS.maxLinks) {
      showNotice(`You can add up to ${LIMITS.maxLinks} blocks`);
      return;
    }

    // Раньше "httpfoo.com" считалось готовой ссылкой (startsWith('http')), а мусор сохранялся как есть.
    let formattedUrl = '';
    if (blockType === 'link') {
      formattedUrl = normalizeLinkUrl(newUrl, { maxLength: LIMITS.linkUrl });
      if (!formattedUrl) {
        showNotice('Enter a valid link, e.g. https://example.com');
        return;
      }
    }

    const finalPlatform = resolvePlatform(newPlatform, formattedUrl, newTitle);

    if (editingId) {
      updateProfileState((prev) => ({
        ...prev,
        links: prev.links.map((item) =>
          item.id === editingId
            ? {
                ...item,
                type: blockType,
                platform: finalPlatform,
                title: newTitle.trim(),
                subtitle: newSubtitle.trim(),
                url: formattedUrl,
                color: newColor,
                featured: newFeatured
              }
            : item
        )
      }));
      setEditingId(null);
    } else {
      const newBlock = {
        id: newBlockId(),
        type: blockType,
        platform: finalPlatform,
        title: newTitle.trim(),
        subtitle: newSubtitle.trim(),
        url: formattedUrl,
        visible: true,
        color: newColor,
        featured: newFeatured
      };
      updateProfileState((prev) => ({
        ...prev,
        links: [...(prev.links || []), newBlock]
      }));
    }

    setNewTitle('');
    setNewUrl('');
    setNewSubtitle('');
    setNewFeatured(false);
  }

  function startEditBlock(item) {
    setEditingId(item.id);
    setBlockType(item.type || 'link');
    setNewPlatform(resolvePlatform(item.platform, item.url, item.title));
    setNewTitle(item.title || '');
    setNewUrl(item.url || '');
    setNewSubtitle(item.subtitle || '');
    setNewColor(item.color || '#ffffff');
    setNewFeatured(Boolean(item.featured));
  }

  function removeBlock(id) {
    updateProfileState((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id)
    }));
    if (editingId === id) setEditingId(null);
  }

  function moveBlock(index, dir) {
    updateProfileState((prev) => {
      const arr = [...(prev.links || [])];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, links: arr };
    });
  }

  function toggleBlockVisibility(id) {
    updateProfileState((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.id === id ? { ...l, visible: l.visible === false } : l))
    }));
  }

  function addSocialIcon(e) {
    e.preventDefault();
    if (!socialValue.trim()) return;
    const currentSocials = asSocials(profile);
    if (currentSocials.length >= LIMITS.maxSocials) {
      showNotice(`You can add up to ${LIMITS.maxSocials} social icons`);
      return;
    }
    const finalPlatform = resolvePlatform(socialPlatform, socialValue.trim(), socialPlatform);
    updateThemeConfig('socials', [
      ...currentSocials,
      {
        id: newBlockId(),
        platform: finalPlatform,
        value: socialValue.trim().slice(0, LIMITS.socialValue)
      }
    ]);
    setSocialValue('');
  }

  function removeSocialIcon(id) {
    updateThemeConfig(
      'socials',
      asSocials(profile).filter((s) => s.id !== id)
    );
  }

  // --- AUTH SCREEN ---
  if (!session) {
    return (
      <div className="auth-screen">
        <AnimatedBackground effect="eidos" accentColor="239, 68, 68" bgColor="#070709" />
        <main className="auth-layout">
          <section className="auth-intro" aria-hidden="true">
            <div className="auth-visual">
              <div className="auth-visual-orbit auth-visual-orbit-one" />
              <div className="auth-visual-orbit auth-visual-orbit-two" />

              <div className="auth-profile-preview">
                <div className="auth-preview-cover">
                  <span />
                </div>
                <div className="auth-preview-content">
                  <div className="auth-preview-identity">
                    <div className="auth-preview-avatar" />
                    <div className="auth-preview-name">
                      <i />
                      <i />
                    </div>
                  </div>
                  <div className="auth-preview-socials">
                    <i /><i /><i /><i />
                  </div>
                  <div className="auth-preview-links">
                    <div><i /><span /><b /></div>
                    <div><i /><span /><b /></div>
                    <div><i /><span /><b /></div>
                  </div>
                </div>
              </div>

              <div className="auth-float-card auth-float-card-top">
                <i />
                <span><b /><b /></span>
              </div>
              <div className="auth-float-card auth-float-card-bottom">
                <i />
                <span><b /><b /></span>
              </div>
            </div>
          </section>

          <section className="auth-card animate-panel-in">
            <div className="auth-card-top">
              <h2>{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>
            </div>

            <SlidingSegments
              activeIndex={authMode === 'login' ? 0 : 1}
              count={2}
              ariaLabel="Authentication mode"
              className="auth-tabs grid grid-cols-2 gap-1 mb-5 p-1 border border-white/[0.07] rounded-xl bg-black/25"
            >
              <button
                onClick={() => setAuthMode('login')}
                aria-pressed={authMode === 'login'}
                className="sliding-segment h-9 text-sm font-medium rounded-lg inline-flex items-center justify-center leading-none cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => setAuthMode('register')}
                aria-pressed={authMode === 'register'}
                className="sliding-segment h-9 text-sm font-medium rounded-lg inline-flex items-center justify-center leading-none cursor-pointer"
              >
                Sign up
              </button>
            </SlidingSegments>

              <form key={authMode} onSubmit={handleAuth} className="auth-form animate-panel-in">
                {authMode === 'register' && (
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={LIMITS.displayName}
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/30 transition"
                    aria-label="Username"
                  />
                )}
              <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/30 transition"
                  aria-label="Email"
              />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/30 transition"
                  aria-label="Password"
                />

                {authNotice && (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl">
                    {authNotice}
                  </div>
                )}

                {authError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-10 mt-1 bg-white text-black font-medium text-sm rounded-xl hover:bg-zinc-200 transition inline-flex items-center justify-center gap-2 leading-none cursor-pointer"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <LogIn className="w-4 h-4 shrink-0" />}
                  <span>{authMode === 'login' ? 'Sign in' : 'Create'}</span>
                </button>
              </form>
          </section>
        </main>
      </div>
    );
  }

  if (!profile) {
    if (profileError) {
      return (
        <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center gap-3 px-4 text-center text-sm text-zinc-400">
          <span>Couldn't load your profile: {profileError}</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                loadedUserRef.current = session.user.id;
                fetchUserProfile(session.user);
              }}
              className="h-9 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="h-9 px-4 bg-[#15151a] text-zinc-200 border border-white/[0.09] rounded-xl text-sm font-medium hover:bg-[#1c1c22] transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/${profile.username}`;
  const cfg = profile.theme_config || {};
  const activeTheme = THEMES[cfg.themeKey] || THEMES.obsidian;
  const activeBg = cfg.customBg || activeTheme.bg;
  const activeParticleRgb = cfg.customAccent
    ? hexToRgbString(cfg.customAccent)
    : activeTheme.particleColor;

  const totalClicks = sumClicks(profile);
  const ctr = profile.views > 0 ? ((totalClicks / profile.views) * 100).toFixed(1) : '0.0';

  const platformSelectOptions = PLATFORMS.map((p) => ({
    value: p.id,
    label: p.id,
    icon: <PlatformIcon platform={p.id} className="w-4 h-4 text-zinc-300 shrink-0" />
  }));
  const activeTabIndex = ['links', 'design', 'profile'].indexOf(activeTab);

  return (
    <div className="studio-shell min-h-screen bg-[#070709] text-zinc-200 flex flex-col">
      <AnimatedBackground effect="eidos" accentColor="239, 68, 68" bgColor="#070709" />
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] text-xs px-3.5 py-2.5 rounded-lg shadow-xl border ${
            notice.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-[#141418] border-white/15 text-white'
          }`}
        >
          {notice.msg}
        </div>
      )}
      {/* HEADER */}
      <header className="studio-header border-b border-white/[0.08] bg-[#0a0a0d] px-5 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 leading-none">
          <MorpheMark className="w-7 h-7 text-white shrink-0" />
          <span className="brand-wordmark text-white text-sm uppercase">MORPHE</span>
        </div>

        <div className="flex items-center gap-2">
          {profile.is_admin && (
            <Link
              to="/admin"
              className="h-9 px-3.5 bg-[#131318] hover:bg-[#191920] border border-white/[0.1] rounded-xl text-sm font-medium text-zinc-200 inline-flex items-center justify-center gap-2 leading-none transition"
            >
              <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <Link
            to="/explore"
            className="h-9 px-3.5 bg-[#121216] hover:bg-[#18181e] border border-white/[0.08] rounded-xl text-sm font-medium text-zinc-300 hidden sm:inline-flex items-center justify-center gap-2 leading-none transition"
          >
            <Compass className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Explore</span>
          </Link>

          <button
            onClick={async () => {
              if (!(await copyText(publicUrl))) return;
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            aria-label={copied ? 'Profile link copied' : 'Copy profile link'}
            className="h-9 px-3.5 bg-[#121216] hover:bg-[#18181e] border border-white/[0.08] rounded-xl text-sm text-zinc-300 inline-flex items-center justify-center gap-2 leading-none transition cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>

          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3.5 bg-[#121216] hover:bg-[#18181e] border border-white/[0.08] rounded-xl text-sm text-zinc-300 inline-flex items-center justify-center gap-2 leading-none transition"
            aria-label="Open public profile"
            title="Open public profile"
          >
            <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            <span className="hidden md:inline">View page</span>
          </a>

          <button
            onClick={saveChanges}
            disabled={saving}
            className={`h-9 px-4 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 leading-none cursor-pointer transition ${
              hasUnsaved
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-[#15151a] text-zinc-200 hover:bg-[#1c1c22] border border-white/[0.09]'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
            <span>{savedToast ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => {
              if (hasUnsaved && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
              supabase.auth.signOut();
            }}
            aria-label="Sign out"
            className="h-9 w-9 rounded-xl hover:bg-white/[0.04] inline-flex items-center justify-center text-zinc-500 hover:text-rose-400 transition cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="studio-workspace flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT PANEL */}
        <div className="studio-editor lg:col-span-7 p-5 sm:p-7 overflow-y-auto dark-scroll">
          <SlidingSegments
            activeIndex={activeTabIndex}
            count={3}
            ariaLabel="Profile editor sections"
            className="studio-tabs grid grid-cols-3 gap-1.5 bg-[#0c0c0f] p-1.5 rounded-2xl border border-white/[0.07] mb-7"
          >
            {[
              { id: 'links', label: 'Links', icon: Link2 },
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'profile', label: 'Profile', icon: User }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => changeActiveTab(t.id)}
                  aria-pressed={activeTab === t.id}
                  className="studio-tab sliding-segment h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 leading-none cursor-pointer"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </SlidingSegments>

          {/* TAB 1: LINKS */}
          {activeTab === 'links' && (
            <div className="studio-tab-panel space-y-4 animate-panel-in" data-direction={tabDirection}>
              {/* Social icons */}
              <div className="studio-section-card studio-social-card bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4 space-y-3">
                <span className="block text-sm font-semibold text-zinc-200 leading-none">Socials</span>

                <form onSubmit={addSocialIcon} className="flex flex-col sm:flex-row gap-2">
                  <CustomSelect
                    value={socialPlatform}
                    onChange={setSocialPlatform}
                    options={platformSelectOptions}
                    className="sm:w-44"
                  />
                  <input
                    type="text"
                    required
                    placeholder="URL or handle"
                    maxLength={LIMITS.socialValue}
                    value={socialValue}
                    onChange={(e) => handleSocialInputChange(e.target.value)}
                    className="flex-1 h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 bg-white text-black font-medium text-sm rounded-xl hover:bg-zinc-200 transition inline-flex items-center justify-center leading-none cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </form>

                {asSocials(profile).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {asSocials(profile).map((s, idx) => {
                      const resolved = resolvePlatform(s.platform, s.value, s.platform);
                      return (
                        <div
                          key={`${s.id ?? 's'}-${idx}`}
                          className="h-8 inline-flex items-center gap-2 bg-[#131318] border border-white/[0.08] px-3 rounded-lg text-xs leading-none"
                        >
                          <PlatformIcon platform={resolved} className="w-4 h-4 text-zinc-300 shrink-0" />
                          <span className="text-zinc-200 max-w-[160px] truncate">{s.value}</span>
                          <button
                            onClick={() => removeSocialIcon(s.id)}
                            aria-label="Remove social icon"
                            className="text-zinc-500 hover:text-rose-400 inline-flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Block builder */}
              <form onSubmit={handleSaveBlock} className="studio-section-card studio-block-form bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-200 leading-none">
                    {editingId ? 'Edit block' : 'Block'}
                  </span>
                  <SlidingSegments
                    activeIndex={blockType === 'link' ? 0 : 1}
                    count={2}
                    ariaLabel="Block type"
                    padding={4}
                    className="block-type-tabs grid grid-cols-2 gap-1 bg-[#121216] p-1 rounded-2xl border border-white/[0.06]"
                  >
                    <button
                      type="button"
                      onClick={() => setBlockType('link')}
                      aria-pressed={blockType === 'link'}
                      className="sliding-segment h-7 px-3 rounded-md text-xs leading-none inline-flex items-center justify-center cursor-pointer"
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockType('header')}
                      aria-pressed={blockType === 'header'}
                      className="sliding-segment h-7 px-3 rounded-md text-xs leading-none inline-flex items-center justify-center cursor-pointer"
                    >
                      Divider
                    </button>
                  </SlidingSegments>
                </div>

                {blockType === 'link' ? (
                  <div key="link-fields" className="block-type-panel animate-panel-in space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <CustomSelect
                        value={newPlatform}
                        onChange={setNewPlatform}
                        options={platformSelectOptions}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Title"
                        maxLength={LIMITS.linkTitle}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                      />
                      <input
                        type="text"
                        required
                        placeholder={PLATFORMS.find((p) => p.id === newPlatform)?.placeholder || 'https://...'}
                        value={newUrl}
                        maxLength={LIMITS.linkUrl}
                        onChange={(e) => handleUrlInputChange(e.target.value)}
                        className="h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Subtitle"
                        maxLength={LIMITS.linkSubtitle}
                        value={newSubtitle}
                        onChange={(e) => setNewSubtitle(e.target.value)}
                        className="flex-1 min-w-[160px] h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                      />

                      <ColorControl compact value={newColor} onChange={setNewColor} />

                      <button
                        type="button"
                        onClick={() => setNewFeatured(!newFeatured)}
                        className={`h-10 px-3.5 rounded-xl border text-sm font-medium inline-flex items-center justify-center gap-2 leading-none transition cursor-pointer ${
                          newFeatured
                            ? 'bg-white/10 border-white/25 text-white'
                            : 'bg-[#111115] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Pin className="w-4 h-4 shrink-0" />
                        <span>Highlight</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key="header-fields" className="block-type-panel animate-panel-in">
                    <input
                      type="text"
                      required
                      placeholder="Section title"
                      maxLength={LIMITS.linkTitle}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-0.5">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setNewTitle('');
                        setNewUrl('');
                        setNewSubtitle('');
                      }}
                      className="h-9 px-3.5 bg-[#15151a] text-zinc-300 text-xs font-medium rounded-xl hover:bg-[#1c1c22] inline-flex items-center justify-center leading-none cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="h-9 px-4 bg-white text-black font-medium text-sm rounded-xl hover:bg-zinc-200 inline-flex items-center justify-center gap-1.5 leading-none cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{editingId ? 'Save' : 'Add'}</span>
                  </button>
                </div>
              </form>

              {/* Blocks list */}
              <div className="space-y-2">
                {(profile.links || []).map((item, idx) => {
                  const resolved = resolvePlatform(item.platform, item.url, item.title);
                  return (
                    <div
                      key={item.id}
                      className={`studio-block-item bg-[#0c0c0f] border rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 transition ${
                        editingId === item.id ? 'border-white/35' : 'border-white/[0.07] hover:border-white/[0.14]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveBlock(idx, -1)}
                            aria-label="Move up"
                            className="text-zinc-600 hover:text-white cursor-pointer p-0.5 inline-flex items-center justify-center"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveBlock(idx, 1)}
                            aria-label="Move down"
                            className="text-zinc-600 hover:text-white cursor-pointer p-0.5 inline-flex items-center justify-center"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.type === 'header' ? (
                          <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold uppercase tracking-wider leading-none">
                            <Hash className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span>{item.title}</span>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <div className="flex items-center gap-2.5">
                              <span
                                style={{ color: item.color || '#e4e4e7' }}
                                className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"
                              >
                                <PlatformIcon platform={resolved} className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-white truncate">{item.title}</span>
                                  {item.featured && <Pin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                                </div>
                                <div className="text-xs text-zinc-500 truncate mt-0.5 tabular-nums">
                                  {item.url} · <span className="text-zinc-400">{getClicks(profile, item)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditBlock(item)}
                          aria-label="Edit block"
                          className="w-8 h-8 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-white inline-flex items-center justify-center cursor-pointer transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleBlockVisibility(item.id)}
                          aria-label={item.visible === false ? 'Show block' : 'Hide block'}
                          className="w-8 h-8 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-white inline-flex items-center justify-center cursor-pointer transition"
                        >
                          {item.visible === false ? <EyeOff className="w-4 h-4 text-zinc-700" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeBlock(item.id)}
                          aria-label="Delete block"
                          className="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 inline-flex items-center justify-center cursor-pointer transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DESIGN */}
          {activeTab === 'design' && (
            <div className="studio-tab-panel space-y-4 animate-panel-in" data-direction={tabDirection}>
              <div className="studio-theme-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(THEMES).map(([key, t]) => {
                  const active = (cfg.themeKey || 'obsidian') === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        updateThemeConfig('themeKey', key);
                        updateThemeConfig('customBg', '');
                        updateThemeConfig('customAccent', '');
                      }}
                      aria-pressed={active}
                      className={`studio-theme-card p-3 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'border-white/45 bg-[#131317]'
                          : 'border-white/[0.07] bg-[#0c0c0f] hover:border-white/[0.15]'
                      }`}
                    >
                      <div
                        style={{ backgroundColor: t.bg, borderColor: t.border }}
                        className="w-full h-16 rounded-xl border p-2.5 mb-3 flex flex-col justify-between"
                      >
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.accent }} />
                        <div className="w-full h-2.5 rounded-sm" style={{ backgroundColor: t.cardBg }} />
                      </div>
                      <div className="text-sm font-medium text-white leading-none">{t.name}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ColorControl
                  label="Background"
                  value={cfg.customBg || activeTheme.bg}
                  onChange={(val) => updateThemeConfig('customBg', val)}
                  presets={BG_PRESETS}
                />
                <ColorControl
                  label="Accent"
                  value={cfg.customAccent || activeTheme.accent}
                  onChange={(val) => updateThemeConfig('customAccent', val)}
                  presets={COLOR_PRESETS}
                />
              </div>

              <div className="studio-options-panel grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Effect</label>
                  <CustomSelect
                    value={cfg.bgEffect === 'none' ? 'none' : 'eidos'}
                    onChange={(val) => updateThemeConfig('bgEffect', val)}
                    options={[
                      { value: 'eidos', label: 'MORPHE Flow' },
                      { value: 'none', label: 'None' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Font</label>
                  <CustomSelect
                    value={cfg.font || 'Manrope'}
                    onChange={(val) => updateThemeConfig('font', val)}
                    options={FONTS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cards</label>
                  <CustomSelect
                    value={cfg.cardStyle || 'glass'}
                    onChange={(val) => updateThemeConfig('cardStyle', val)}
                    options={[
                      { value: 'glass', label: 'Glass' },
                      { value: 'solid', label: 'Solid' },
                      { value: 'outline', label: 'Outline' }
                    ]}
                  />
                </div>
              </div>

              <div className="studio-section-card studio-radius-panel bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-center justify-between text-xs mb-2.5 leading-none">
                  <span className="font-medium text-zinc-400">Radius</span>
                  <span className="font-mono tabular-nums text-white">{cfg.cardRadius ?? 12}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="22"
                  value={cfg.cardRadius ?? 12}
                  onChange={(e) => updateThemeConfig('cardRadius', Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && (
            <div className="studio-tab-panel space-y-4 animate-panel-in" data-direction={tabDirection}>
              <div className="studio-media-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="studio-media-card bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="studio-media-thumb studio-avatar-thumb">
                        <SafeImage
                          src={profile.avatar_url}
                          className="w-full h-full object-cover"
                          fallback={<ProfileAvatarFallback />}
                        />
                      </div>
                      <span className="text-sm font-medium text-white leading-none">Avatar</span>
                    </div>
                    <label className="studio-upload-button h-8 px-3 bg-white text-black rounded-lg text-xs font-medium cursor-pointer hover:bg-zinc-200 inline-flex items-center justify-center gap-1.5 leading-none transition">
                      {uploadingField === 'avatar' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={profile.avatar_url || ''}
                    onChange={(e) => updateProfileState((p) => ({ ...p, avatar_url: e.target.value }))}
                    className="studio-media-url w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                </div>

                <div className="studio-media-card studio-banner-card bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="studio-media-thumb studio-banner-thumb">
                        <SafeImage
                          src={cfg.bannerUrl}
                          className="w-full h-full object-cover"
                          fallback={<ProfileBannerFallback />}
                        />
                      </div>
                      <span className="text-sm font-medium text-white leading-none">Banner</span>
                    </div>
                    <label className="studio-upload-button h-8 px-3 bg-white text-black rounded-lg text-xs font-medium cursor-pointer hover:bg-zinc-200 inline-flex items-center justify-center gap-1.5 leading-none transition">
                      {uploadingField === 'banner' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => handleImageUpload(e, 'banner')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={cfg.bannerUrl || ''}
                    onChange={(e) => updateThemeConfig('bannerUrl', e.target.value)}
                    className="studio-media-url w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                </div>
              </div>

              <div className="studio-profile-fields grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Handle</label>
                  <input
                    type="text"
                    value={profile.username}
                    maxLength={USERNAME_MAX}
                    autoCapitalize="none"
                    spellCheck={false}
                    onChange={(e) =>
                      updateProfileState((p) => ({ ...p, username: sanitizeUsername(e.target.value) }))
                    }
                    className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                  {validateUsername(profile.username) && (
                    <p className="text-xs text-amber-400 mt-1.5 leading-snug">{validateUsername(profile.username)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display name</label>
                  <input
                    type="text"
                    value={profile.display_name || ''}
                    maxLength={LIMITS.displayName}
                    onChange={(e) => updateProfileState((p) => ({ ...p, display_name: e.target.value }))}
                    className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Badge</label>
                  <input
                    type="text"
                    placeholder="Developer"
                    maxLength={LIMITS.badge}
                    value={cfg.badge || ''}
                    onChange={(e) => updateThemeConfig('badge', e.target.value)}
                    className="w-full h-10 bg-[#111115] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
                  <CustomSelect
                    value={cfg.status || 'none'}
                    onChange={(val) => updateThemeConfig('status', val)}
                    options={STATUS_OPTIONS.map((s) => ({
                      value: s.value,
                      label: s.label,
                      icon: (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                      )
                    }))}
                  />
                </div>
              </div>

              <div className="studio-bio-card">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={profile.bio || ''}
                  maxLength={LIMITS.bio}
                  onChange={(e) => updateProfileState((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-[#111115] border border-white/[0.08] rounded-xl p-3.5 text-sm text-white leading-relaxed focus:outline-none focus:border-white/25"
                />
              </div>

              <div className="studio-section-card studio-profile-metrics bg-[#0c0c0f] border border-white/[0.07] rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3 tabular-nums">
                  <div>
                    <div className="text-xs text-zinc-500">Views</div>
                    <div className="text-lg font-semibold text-white leading-tight mt-0.5">{profile.views || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Clicks</div>
                    <div className="text-lg font-semibold text-white leading-tight mt-0.5">{totalClicks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">CTR</div>
                    <div className="text-lg font-semibold text-zinc-200 leading-tight mt-0.5">{ctr}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — PREVIEW */}
        <div className="studio-preview lg:col-span-5 relative flex flex-col items-center justify-center p-5 sm:p-7 overflow-hidden min-h-[580px]">
          <SlidingSegments
            activeIndex={previewMode === 'mobile' ? 0 : 1}
            count={2}
            ariaLabel="Preview size"
            className="preview-mode-tabs mb-7 grid grid-cols-2 gap-1.5 bg-[#0c0c0f] border border-white/[0.08] p-1.5 rounded-2xl z-20"
          >
            <button
              onClick={() => setPreviewMode('mobile')}
              aria-pressed={previewMode === 'mobile'}
              className="sliding-segment h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 leading-none cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Mobile</span>
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              aria-pressed={previewMode === 'desktop'}
              className="sliding-segment h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 leading-none cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 shrink-0" />
              <span>Desktop</span>
            </button>
          </SlidingSegments>

          {previewMode === 'mobile' ? (
            <div
              style={{ backgroundColor: activeBg }}
              className="preview-frame w-full max-w-[375px] h-[650px] rounded-[36px] border-[4px] border-[#1c1c21] ring-1 ring-white/10 shadow-2xl flex flex-col overflow-hidden relative animate-panel-in"
            >
              <AnimatedBackground
                embedded
                effect={cfg.bgEffect || 'eidos'}
                accentColor={activeParticleRgb}
                bgColor={activeBg}
              />

              <div className="pt-3 pb-1 flex justify-center shrink-0 relative z-20">
                <div className="w-20 h-4 bg-black rounded-full border border-white/[0.08]" />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <BioCard profile={profile} isPreview={true} />
              </div>
            </div>
          ) : (
            <div
              style={{ backgroundColor: activeBg }}
              className="preview-frame w-full h-[650px] rounded-xl border border-white/[0.1] shadow-2xl overflow-hidden relative animate-panel-in"
            >
              <AnimatedBackground
                embedded
                effect={cfg.bgEffect || 'eidos'}
                accentColor={activeParticleRgb}
                bgColor={activeBg}
              />
              <div className="w-full h-full overflow-y-auto dark-scroll relative z-10">
                <BioCard profile={profile} isPreview={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- ERROR BOUNDARY / 404 ---
// Одна битая запись в БД не должна превращать страницу в белый экран.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('MORPHE render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4 gap-3">
          <div className="text-sm text-zinc-400">Something went wrong on this page.</div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="h-9 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition cursor-pointer"
            >
              Reload
            </button>
            <a
              href="/"
              className="h-9 px-4 bg-[#15151a] text-zinc-200 border border-white/[0.09] rounded-xl text-sm font-medium hover:bg-[#1c1c22] transition inline-flex items-center"
            >
              Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFoundPage() {
  useEffect(() => {
    document.title = '404 — MORPHE';
  }, []);
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
      <div className="text-sm font-mono text-zinc-400">404</div>
      <Link
        to="/"
        className="mt-4 h-10 px-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition inline-flex items-center justify-center leading-none"
      >
        Home
      </Link>
    </div>
  );
}

function RoutedApp() {
  const location = useLocation();
  return (
    // key сбрасывает ошибку при переходе на другую страницу
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/:username" element={<PublicProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutedApp />
    </BrowserRouter>
  );
}

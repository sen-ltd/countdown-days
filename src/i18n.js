/**
 * src/i18n.js — Japanese / English UI translations.
 */

export const translations = {
  ja: {
    appTitle: 'カウントダウン',
    addEvent: 'イベントを追加',
    editEvent: 'イベントを編集',
    deleteEvent: 'イベントを削除',
    deleteConfirm: '本当に削除しますか？',
    save: '保存',
    cancel: 'キャンセル',
    eventName: 'イベント名',
    eventDate: '日付',
    eventIcon: 'アイコン',
    eventColor: 'カラー',
    templates: 'テンプレート',
    presets: 'プリセット',
    noEvents: 'まだイベントがありません。追加してみましょう！',
    daysUntil: '日後',
    daysSince: '日前',
    today: '今日！',
    tomorrow: '明日',
    yesterday: '昨日',
    hours: '時間',
    minutes: '分',
    seconds: '秒',
    shareLink: 'URLをコピー',
    shareLinkCopied: 'コピーしました！',
    themeToggle: 'テーマ切替',
    langToggle: 'EN',
    pastEvents: '過去のイベント',
    upcomingEvents: '今後のイベント',
    eventNamePlaceholder: '例: 誕生日',
    required: '必須',
    nameTooLong: '100文字以内で入力してください',
    invalidDate: '有効な日付を入力してください',
  },
  en: {
    appTitle: 'Countdown Days',
    addEvent: 'Add Event',
    editEvent: 'Edit Event',
    deleteEvent: 'Delete Event',
    deleteConfirm: 'Are you sure you want to delete this event?',
    save: 'Save',
    cancel: 'Cancel',
    eventName: 'Event Name',
    eventDate: 'Date',
    eventIcon: 'Icon',
    eventColor: 'Color',
    templates: 'Templates',
    presets: 'Presets',
    noEvents: 'No events yet. Add one to get started!',
    daysUntil: 'days to go',
    daysSince: 'days ago',
    today: 'Today!',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    shareLink: 'Copy URL',
    shareLinkCopied: 'Copied!',
    themeToggle: 'Toggle Theme',
    langToggle: 'JA',
    pastEvents: 'Past Events',
    upcomingEvents: 'Upcoming Events',
    eventNamePlaceholder: 'e.g. Birthday',
    required: 'Required',
    nameTooLong: 'Max 100 characters',
    invalidDate: 'Please enter a valid date',
  },
};

/** @type {'ja'|'en'} */
let currentLang = 'ja';

/**
 * Sets the active language.
 * @param {'ja'|'en'} lang
 */
export function setLang(lang) {
  if (lang === 'ja' || lang === 'en') currentLang = lang;
}

/**
 * Returns the active language code.
 * @returns {'ja'|'en'}
 */
export function getLang() {
  return currentLang;
}

/**
 * Translates a key using the currently active language.
 * Falls back to the key itself if not found.
 * @param {string} key
 * @param {'ja'|'en'} [lang]
 * @returns {string}
 */
export function t(key, lang) {
  const l = lang || currentLang;
  return translations[l]?.[key] ?? translations.en[key] ?? key;
}

/** Preset holiday/template definitions. */
export const PRESETS = [
  { key: 'new_year',      icon: '🎍', nameJa: '元旦',         nameEn: "New Year's Day",     dateFactory: () => `${new Date().getFullYear() + (new Date().getMonth() >= 0 ? 1 : 0)}-01-01`, color: '#e53935' },
  { key: 'xmas',          icon: '🎄', nameJa: 'クリスマス',    nameEn: 'Christmas',           dateFactory: () => `${new Date().getFullYear()}-12-25`,  color: '#43a047' },
  { key: 'halloween',     icon: '🎃', nameJa: 'ハロウィン',    nameEn: 'Halloween',           dateFactory: () => `${new Date().getFullYear()}-10-31`,  color: '#fb8c00' },
  { key: 'golden_week',   icon: '🗾', nameJa: 'ゴールデンウィーク', nameEn: 'Golden Week',    dateFactory: () => `${new Date().getFullYear()}-05-03`,  color: '#8e24aa' },
  { key: 'obon',          icon: '🏮', nameJa: 'お盆',          nameEn: 'Obon',                dateFactory: () => `${new Date().getFullYear()}-08-13`,  color: '#f4511e' },
  { key: 'birthday',      icon: '🎂', nameJa: '誕生日',        nameEn: 'Birthday',            dateFactory: () => '',                                   color: '#e91e63' },
  { key: 'exam',          icon: '📝', nameJa: '試験',          nameEn: 'Exam',                dateFactory: () => '',                                   color: '#1565c0' },
  { key: 'wedding',       icon: '💍', nameJa: '結婚式',        nameEn: 'Wedding',             dateFactory: () => '',                                   color: '#fdd835' },
  { key: 'travel',        icon: '✈️', nameJa: '旅行出発',      nameEn: 'Travel',              dateFactory: () => '',                                   color: '#00897b' },
  { key: 'summer_break',  icon: '🌊', nameJa: '夏休み',        nameEn: 'Summer Break',        dateFactory: () => `${new Date().getFullYear()}-07-20`,  color: '#039be5' },
];

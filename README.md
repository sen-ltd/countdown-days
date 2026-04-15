# Countdown Days ⏳

イベントまでの日数カウントダウン & 過去日数カウントアップ。複数イベント管理、プリセット、URL 共有に対応。

**Live demo**: https://sen.ltd/portfolio/countdown-days/

---

## Features

- **Multiple events** — Add, edit, delete any number of events
- **Live updates** — Days / hours / minutes / seconds refresh every second
- **Count-up support** — Past events show "days since" in muted style
- **Presets** — Japanese holidays, birthdays, exams, weddings, travel, and more
- **URL sharing** — Share a single event via a URL parameter link
- **localStorage persistence** — Events survive page refresh
- **Japanese / English UI** — Toggle with one click
- **Dark / light theme** — Respects system preference; toggle to override
- **Zero dependencies** — Vanilla JS, no build step required

## Getting Started

```bash
# Serve locally
npm run serve
# → open http://localhost:8080

# Run tests
npm test
```

## File Structure

```
countdown-days/
├── index.html          # App shell
├── style.css           # All styles (CSS custom properties for theming)
├── src/
│   ├── countdown.js    # Pure calculation functions (testable)
│   ├── i18n.js         # ja/en translations + preset definitions
│   └── main.js         # DOM wiring, localStorage, live update loop
├── tests/
│   └── countdown.test.js
├── package.json
└── LICENSE
```

## API — countdown.js

```js
import {
  getDaysBetween,   // (from, to) → integer calendar days
  getTimeUntil,     // (date, now?) → { days, hours, minutes, seconds, total, isPast }
  formatDuration,   // (time, lang?) → "3日 14時間 25分" | "3d 14h 25m"
  isSameDay,        // (a, b) → boolean
  createEvent,      // (name, date, color?, icon?) → event object
  validateEvent,    // (event) → { valid, errors }
} from './src/countdown.js';
```

## License

MIT © 2026 SEN LLC (SEN 合同会社)

<!-- sen-publish:links -->
## Links

- 🌐 Demo: https://sen.ltd/portfolio/countdown-days/
- 📝 dev.to: https://dev.to/sendotltd/a-countdown-tracker-that-handles-dst-timezones-and-calendar-day-math-correctly-1koc
<!-- /sen-publish:links -->

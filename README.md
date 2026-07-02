# WhatsApp Poll Exporter

A browser extension that adds an **Export** button next to every poll on WhatsApp Web, letting you download vote results as **Excel (XLSX)**, **Excel (HTML)**, or **CSV**.

It's a fork of [Whatsapp-Poll-Export](https://github.com/arieli88/WhatsApp-Poll-Export)

Works on Chrome, Edge, and Firefox.

---

## Features

- **One-click export** — button appears directly next to the "View votes" button inside each poll
- **Three export formats**
  - **Excel (XLSX)** — native spreadsheet with formatting, column widths, alternating row colours, and auto-filter
  - **Excel (HTML)** — HTML table that Excel opens natively; no library dependency
  - **CSV** — plain UTF-8 text with BOM for broad compatibility
- **Phone number formatting** — uses `libphonenumber-js` to format numbers from 80+ countries into their local national format
- **Six UI languages** — English, Hebrew, Arabic (RTL), Spanish, French, Portuguese
- **Persistent settings** — format and language are saved across sessions via `chrome.storage.sync`

---

## Installation

### Chrome / Edge (unpacked)

1. Clone or download this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.
5. Open [web.whatsapp.com](https://web.whatsapp.com) — the Export button appears inside every poll.

### Firefox (unpacked)

1. Clone or download this repository.
2. Run `make firefox` to generate `dist/firefox-v0.1.0.zip` with the correct manifest.
3. Open `about:debugging#/runtime/this-firefox`.
4. Click **Load Temporary Add-on** and select `dist/firefox-v0.1.0.zip` (or the `manifest.json` directly from the project folder — Firefox accepts both).

---

## Build

Requires `zip` (available on macOS/Linux by default).

```bash
# Build both Chrome and Firefox packages into dist/
make

# Build only one target
make chrome
make firefox

# Remove build artifacts
make clean
```

Output files:
```
dist/
  chrome-v0.1.0.zip   ← load in Chrome / Edge
  firefox-v0.1.0.zip  ← load in Firefox
```

---

## Usage

1. Open [web.whatsapp.com](https://web.whatsapp.com) and navigate to a chat that contains a poll.
2. An **Export** button appears alongside the "View votes" button.
3. Click **Export** — the file downloads immediately using the format you selected in settings.
4. To change format or language, click the extension icon in the browser toolbar.

---

## Settings

| Setting | Options | Default |
|---------|---------|---------|
| Language | English, Hebrew, Arabic, Spanish, French, Portuguese | English |
| Export Format | Excel (XLSX), Excel (HTML), CSV | CSV |

Settings are synced across devices when you are signed into your browser profile.

---

## Project structure

```
├── manifest.json          Chrome / Edge manifest (MV3)
├── manifest.firefox.json  Firefox manifest (MV3 + gecko id)
├── popup.html             Extension popup UI
├── popup.js               Popup logic & settings persistence
├── script.js              Content script — injects Export button
├── moduleraid.js          WhatsApp module extraction + export engine
├── translations.js        All UI and export strings (6 languages)
├── make_xlsx_global.js    Exposes xlsx.full.min.js as window.XLSX
├── xlsx.full.min.js       SheetJS library for native XLSX generation
├── libphonenumber-js.min.js  Phone number parsing & formatting
├── icons/                 Extension icons (16 → 128 px)
├── Makefile               Build targets
└── README.md
```

---

## How it works

`script.js` watches the WhatsApp Web DOM for elements containing the "View votes" text and injects an Export button next to them.

When clicked, the button posts a message to `moduleraid.js` (which runs inside the page context). `moduleraid.js` uses WhatsApp Web's internal module system (`window.require`) to access:
- `Store.Msg` — find the poll message by ID
- `Store.PollVote` — retrieve all vote records for that poll
- `Store.Contact` — resolve display names

The data is then formatted (dates localised, phone numbers normalised) and exported in the chosen format.

---

## Permissions

| Permission | Reason |
|------------|--------|
| `storage` | Save user preferences |
| `activeTab` | Access the active WhatsApp Web tab |
| `tabs` | Notify open tabs when settings change |
| `scripting` | Inject settings updates into WhatsApp tabs |
| `host_permissions: web.whatsapp.com` | Read the WhatsApp Web page |

---

## Browser compatibility

| Browser | Minimum version | Notes |
|---------|----------------|-------|
| Chrome  | 88+ | Full support (MV3) |
| Edge    | 88+ | Chromium-based, same as Chrome |
| Firefox | 109+ | Uses `manifest.firefox.json`; `chrome.*` namespace supported |

---

## License

MIT — see [LICENSE](LICENSE).

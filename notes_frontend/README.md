# Ocean Notes – Next.js Frontend

Bold, high-contrast notes organizer following the Ocean Professional theme.

## Features
- Create, edit, duplicate, and delete personal notes
- Organize notes into folders (Inbox + custom)
- Three-panel layout: Folders (left), Notes list (center), Editor (right)
- App bar with quick actions
- LocalStorage persistence (no backend required)
- Keyboard shortcuts: 
  - Cmd/Ctrl+N: New note
  - Cmd/Ctrl+S: Prevent default (no-op to avoid browser save)

## Getting Started
Install dependencies and run dev server:
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build
```bash
npm run build
npm start
```

## Theming
- Primary: #F97316
- Secondary/Success: #10B981
- Error: #EF4444
- Background: #000000
- Surface: #1F2937
- Text: #FFFFFF

All styling is handled via TailwindCSS v4 utilities and custom CSS variables in src/app/globals.css.

# IBA Prep — DU IBA MBA admission trainer

A web app for preparing for the University of Dhaka IBA MBA admission test. It covers English, Mathematics and Analytical ability, with a 30-day plan, adaptive practice, mock exams and an optional AI tutor.

Progress is stored in the browser (IndexedDB). There are no accounts, and you can back up or move your progress with **Settings → Export**.

## What's inside

| Section | What it does |
|---|---|
| Dashboard | Today's mission (from the 30-day plan, adjusted to your weakest topics), streak, readiness estimate, section levels |
| 30-Day Plan | Four phases (foundation → intensive → advanced → exam readiness), a calendar, daily hours, scheduled mocks |
| Daily Practice | Adaptive English / Maths / Analytical sets, a timed mixed final challenge, and a 28-question diagnostic |
| English Mastery | 16 visual grammar lessons (colour-coded sentence diagrams, wrong vs right), 6 reading passages, usage practice |
| Vocabulary Lab | 127 words with IPA, Bengali meaning, synonyms/antonyms network, collocations, roots, memory hooks; SM-2 spaced repetition and games |
| Quantitative | Every topic with written questions, plus 22 generators that compute unlimited fresh questions; a 25-card shortcut library with "when not to use" notes |
| Speed Gym | Typed-answer drills (percentages, multiplication, fractions, mental, approximation, number properties, sprint) with automatic levels |
| Analytical | Drag-and-drop arrangement puzzles with live condition checking, an 8-step method, critical reasoning, data interpretation with charts, data sufficiency |
| Mock Exam | Practice / timed / full simulation; configurable format; optional negative marking; navigator, mark for review, auto-submit, resume, detailed report, 30-minute written part |
| AI Tutor | Explain, Socratic hints, check my working, vocabulary coach, writing feedback, study coach. Works offline without a key; uses Claude when a key is set. Includes a reviewed AI question generator |
| Mistake Notebook | Wrong and very slow answers, cause classification, notes, a 1-3-7-14-30 day revision ladder, "practise similar", bookmarks |
| Resource Library | Sources with verification labels |
| Analytics | Accuracy and speed trends, topic levels, mock trend, revision backlog, consistency heatmap |
| Settings | Exam format editor, negative marking, preferences, export / import / reset, AI status |

## About accuracy and sources

- **Exam format:** IBA's official site (mba.iba-du.edu) could not be read automatically. The test date, fee and the per-section minimum rule come from copies of the official notice. The "about 70 MCQs in 90 minutes + 30-minute written" structure and the 0.25 negative marking come from press and coaching sources. They are labelled **unverified** everywhere, and negative marking is **off by default** (you can turn it on in Settings). Check the official circular and adjust Settings → Exam format if anything differs.
- **Questions:** every question is labelled as one of:
  - original practice question
  - computer-generated (the answer is computed)
  - AI-generated, reviewed
  - adapted
  - verified past question

  None are presented as past-paper questions. No copyrighted past papers are reproduced.
- **Answer keys:** `npm run verify` checks the whole bank:
  - every key is in range and every option list has no duplicates
  - every written maths answer is recomputed and compared with its key
  - 8,800 generated questions are checked
  - each puzzle is proved to have exactly one solution
- **Readiness score:** an internal estimate from your topic levels and practice volume. It does not predict admission, because IBA's cut-offs are not published.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/suborhan7/iba-prep.git
cd iba-prep
npm install
npm run dev
```

Then open http://localhost:3000.

Other commands:

```bash
npm run build && npm start   # production build
npm run verify               # verify every answer key, generator and puzzle
npm run typecheck
```

## Turn on the AI tutor (optional)

The app works fully without AI. In that case the tutor answers from the app's own explanations, lessons and word list.

To use Claude, copy `.env.example` to `.env.local` and set the key:

```
ANTHROPIC_API_KEY=sk-ant-...
# AI_MODEL=claude-opus-5-5   (default)
```

To use an OpenAI-compatible provider instead, set:

```
AI_PROVIDER=openai-compatible
AI_BASE_URL=...
AI_API_KEY=...
AI_MODEL=...
```

Keys are read only by the server routes (`/api/tutor` and `/api/generate`) and are never sent to the browser.

## Put it online (free)

1. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New → Project**.
2. Import `suborhan7/iba-prep`. The defaults are fine, because Vercel detects Next.js.
3. (Optional) Under **Environment Variables**, add `ANTHROPIC_API_KEY`.
4. Click **Deploy**. Every push to `main` redeploys automatically.

### Turn on phone ↔ laptop sync (free, one-time setup)

1. In Vercel, open the project → **Storage** → **Create** → **Blob**. Choose **Private** access.
2. Connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
3. Go to **Deployments** → **⋯** → **Redeploy**.
4. In the app, open **Settings → Sync between phone and laptop**:
   - On the first device, click **Create a sync code**.
   - On the other device, enter the same code.

After that, sync runs automatically:
- when the app opens
- every 5 minutes
- when you switch away

Answers from both devices are combined, not overwritten. The code never leaves your device; the server only stores a copy under a hash of it. If you made the Blob store **Public** by mistake, also set `SYNC_BLOB_ACCESS=public`.

When running the app on your own computer, `SYNC_LOCAL_DIR=./.sync` stores the copies in a folder instead.

### Install as an app

- **Android, Chrome or Edge on a laptop:** use the **Install app** button in the sidebar, the phone header, or Settings.
- **iPhone (Safari):** tap **Share → Add to Home Screen**.

The installed app opens in its own window and practice works offline.

## Project layout

```
src/app/            pages (one folder per section) and API routes
src/components/     shared UI: question player, puzzle board, charts, word card
src/data/           question bank, grammar lessons, vocabulary, puzzles, plan, resources
src/lib/            adaptive engine, spaced repetition, generators, mock builder, storage, AI
scripts/            verify-bank.ts (answer-key verification)
```

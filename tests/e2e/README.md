# Phone walkthrough tests

Run these before every release. They use the app like a student on a phone, with taps.

```
npx next build && SYNC_LOCAL_DIR=.sync npx next start -p 3100
node tests/e2e/journey.js "Pixel 7"     # 44 scripted journeys (also try "iPhone 13")
node tests/e2e/monkey.js "Pixel 7" "" 35 # taps random controls on every page, flags taps that do nothing
```

Needs Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`).

# Leonida Legend — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden. Free and open source (MIT). No account, no network, no Rockstar artwork — the look is our own.

## What it does

- **Checklist** — every trophy with its official name, description and grade. Tick it when it pops; progress is saved in the browser (localStorage).
- **Guides with sources** — each trophy has a guide in our own words, with the sources its facts come from (Push Square, PowerPyx, GTABase, OutputLag, KeenGamer, gtasix.how, Exophase, PSNProfiles). Where no guide has confirmed a method yet, the guide says so instead of guessing.
- **Roadmap to the platinum** — six stages, in order: story first, then side strands, exploration, activities, crime and cash, and finally 100% completion. About 200–300 hours in total.
- **Missables** — only one trophy is possibly missable: **Positive Mental Attitude** (Lucia's Chapter 1 balcony meditation). The guide explains exactly when to do it and how to protect it with a manual save.
- **Filters & spoiler setting** — filter by kind (story, missable, side strands, collectibles, activities, crime, exploration, platinum path), grade and earned status; search by name, mission or keyword. The spoiler setting hides story trophy names and descriptions until they are earned.
- **Counters** — counted trophies (250 stunts, 42 shooting-range golds, 100 WAiNK scans…) have a +/− counter in the detail panel.
- **Export / import** — download your progress as JSON and import it back on any device.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static file server. It works with the network off: every file it loads lives under `app/`.

## Files

- `app/index.html` — the page shell (header, progress, tabs, toolbar, detail panel)
- `app/app.js` — the tracker: state, filters, spoiler rule, export/import, roadmap, missables
- `app/style.css` — the Vice City dusk theme (CSS gradients only, no images or web fonts)
- `app/data/trophies.json` — the official 55 trophies with guides and sources
- `main.ts` — the make.fun hand-in program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 4 renders of the app in a browser (the cover is first by name)

## Sources

Names, descriptions and grades are the official list as PlayStation publishes it, as Exophase and PSNProfiles listed it. Guides cite Push Square, PowerPyx, GTABase, OutputLag, KeenGamer and gtasix.how beside each trophy. See the About & Sources tab in the app for the full list.

Unofficial fan guide — not affiliated with Rockstar Games, Take-Two Interactive or PlayStation.

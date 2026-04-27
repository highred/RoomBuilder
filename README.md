# RoomBuilder

Interactive isometric 3D room builder built with Vite, TypeScript, and Three.js.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
```

The production build is generated in `dist/`.

## Notes

Saved rooms, permanent assets, and imported model files are stored in the browser by default. For a distributable seeded package, export/import seed data should be added so curated local assets can ship with the app.

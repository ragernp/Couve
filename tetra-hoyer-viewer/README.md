# Hoyer Frigus SF1200-N1 – 3D viewer

Interactive 3D viewer (desktop + mobile) for the **Tetra Hoyer Frigus SF1200-N1** continuous ice-cream
freezer, **Machine No. Z138, 1079**.

- Orbit / pan / zoom with mouse and touch
- Preset views (iso, front, side, rear, top) and numbered part markers that fly the camera to each part
- Dimension overlay (193 × 84 × 200 cm), optional 1.75 m scale figure
- X-ray shell, openable service doors, exploded view and a "simulate running" mode
- Specs tab (with provenance for each figure) and generated front / side / plan drawings (downloadable SVG)
- Light and dark themes, bottom-sheet layout on phones

## Run it

No build step. ES modules need an HTTP server (they don't load from `file://`):

```sh
python3 -m http.server 8000 --directory tetra-hoyer-viewer
# open http://localhost:8000
```

It is plain static files, so it can be hosted on any static host (GitHub Pages, Netlify, S3, …).
Three.js r160 is vendored in `vendor/`, so the page works offline.

## Where the data comes from

- Type and machine numbers: supplied by the owner.
- Dimensions, weight, capacity, power, refrigerant, equipment list: used-equipment dealer listings for an
  SF1200-N1 (S/N FRI250215, built 2005). **That is a different unit** – check the nameplate on Z138 / 1079.
- Exterior layout (operator panel, inlet pump, cylinder cover, outlet pump, feet, doors) follows reference
  photos of SF1200 units. The dealer photos are copyrighted and are *not* included in this repo.
- The interior (barrel, dasher, drive, compressor, condenser) is **schematic**, not a manufacturer drawing.

Unofficial visualisation; not affiliated with or endorsed by Tetra Pak.

## Layout

```
index.html        page + importmap
style.css         layout, themes, mobile bottom sheet
js/model.js       procedural Three.js model (dimensions live in DIM)
js/main.js        scene, camera, controls, hotspots, UI wiring
js/drawings.js    SVG elevations/plan generated from the same dimensions
js/data.js        specs, sources, part descriptions
vendor/           three.module.min.js + OrbitControls, RoomEnvironment, RoundedBoxGeometry
```

# Licences and credits

Different parts of this repository are under different terms.

| Part | Where | Terms |
|---|---|---|
| Source code | `dist/*.js`, `dist/*.css`, `dist/*.html`, `server.mjs`, `tests/` | MIT, see [LICENSE](LICENSE) |
| Mascot **Nong Nong Mai (น้องน่องไม้)** and the logo | `dist/mascot/`, `dist/buddy/*.webp`, `dist/brand/` | © 2026 chanapoom. All rights reserved. Not covered by the MIT licence. Do not reuse without permission. |
| Place database | `dist/places.json` | Contains data from © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. As a database derived from OpenStreetMap it is available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Each record links its own sources in `sources`. Other sources are owners' public pages (facts) and [Wikidata](https://www.wikidata.org/) (CC0). |
| Rail lines and stations | `dist/rail.json` | © OpenStreetMap contributors, ODbL 1.0 |
| Province outlines | `dist/provinces.json` | Source and licence are recorded inside the file |
| Place photos | `dist/photos/` | Wikimedia Commons, each under its own licence (CC0, CC BY or CC BY-SA). The author, licence and file page for each photo are in its place's `photo` field in `places.json`, and are shown on the site. |
| Map tiles | loaded from tile.openstreetmap.org | © OpenStreetMap contributors, shown on the map |
| Leaflet 1.9.4 | `dist/vendor/leaflet.*` | BSD-2-Clause, see `dist/vendor/LEAFLET-LICENSE.txt` |
| Leaflet.markercluster 1.5.3 | `dist/vendor/markercluster/` | MIT, see `dist/vendor/markercluster/LICENSE` |
| Fonts | loaded from Google Fonts | SIL Open Font License (IBM Plex Sans Thai, Manrope, Noto Sans Thai, Work Sans) |

Google Maps is used only for "Take me there" links that open in Google Maps. No content from Google is stored in this repository.

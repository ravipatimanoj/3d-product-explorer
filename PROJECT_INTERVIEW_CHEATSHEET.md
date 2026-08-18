# 3D Product Explorer — Interview Cheat Sheet

Print this. Speak from it. Details: `PROJECT_TECHNICAL_DOCUMENTATION.md`. Slides: `PROJECT_PRESENTATION_GUIDE.md`.

Repo as of `main` / `fcc85a8`. Root `README.md` is **stale**.

---

## 30 seconds

I built a 3D product explorer: a React Three Fiber smartphone, a Spring Boot catalog on PostgreSQL, and an AI assistant that returns validated JSON actions. The model never talks to Three.js. `FOCUS_FEATURE` with id `camera` runs the same React handlers as clicking the camera hotspot.

## 1 minute

It is a product inspector, not a chatbot with a canvas behind it. Postgres stores three products; only `smartphone-001` has an interactive procedural model with twelve named parts. Users orbit, click hotspots, explode the phone, change color, and toggle the flash LED. Natural language goes to `/api/ai/chat`. Spring loads the product, stuffs the catalog into the system prompt, and asks OpenAI for JSON. We allowlist the action and feature ID. React already knew how to focus, explode, assemble, and toggle flash — AI is another input to that state machine. TV and fridge are catalog-plus-Q&A only.

## 3 minutes

Spec sheets are not spatial. I built a procedural phone so every catalog feature has a matching mesh name. CameraRig lerps the camera; ExplodedLayer lerps parts apart; materials highlight the selection. The API started in-memory so the JSON contract could freeze, then the same DTOs moved to Flyway and JPA. AI is orchestrated: the OpenAI key never enters Vite. The model must answer from catalog context and emit `FOCUS_FEATURE`, `EXPLODE_PRODUCT`, `ASSEMBLE_PRODUCT`, or `TOGGLE_FLASH`. Warp-drive IDs get dropped. Timeouts are 504, missing key 503, provider HTTP errors 502. LLM for intent, backend for policy, React for 3D.

## 5 minutes

**Client.** `App.tsx` orchestrates. `useProduct` loads `GET /api/products`. Local state: color, flash, exploded, `focusNonce`, `overviewNonce`. `ProductViewer` writes a module-level `cameraCommand` because animation runs in R3F `useFrame`.

**3D.** No phone GLTF. Groups named `camera`, `battery`, `flash`, and so on. Hotspots are Drei `Html` with `pointerEvents` only on the pin. Battery/processor ghost the **frame**, not just the back glass. OrbitControls `minDistance` was 2.1 and fought close-ups; we use 0.35 and restore the lerped camera after `controls.update()`.

**Data.** Tables: `products`, `product_colors`, `product_features`, `feature_specifications`. Composite feature PK. `open-in-view=false`, `FetchMode.SUBSELECT`.

**AI.** Prompt includes live feature ids and specs. `json_object`, temperature 0.2, 20s read timeout. `validate()` is the policy layer. `handleAiAction` is a switch on existing setters. `pendingExplodedFocus` waits until explode is true before close-up.

**Tests.** Spring tests hit real Postgres. AI tests use `RecordingAiProvider`. Provider tests use a local HttpServer and assert the key is not logged.

---

## Architecture

```
User → React App
         ├─ ProductViewer (R3F / Three.js)
         └─ AiAssistant → POST /api/ai/chat
              → AiService → ProductService → PostgreSQL
                         → OpenAiChatProvider → OpenAI
              → { message, action }
              → handleAiAction → same state as UI clicks
              → CameraRig / meshes
```

**One sentence:** AI translates language into four verbs; the viewer is deterministic.

---

## Frontend

| Piece | Job |
| --- | --- |
| `App.tsx` | Session state + `handleAiAction` |
| `useProduct.ts` | Catalog load, selected product/feature |
| `productApi.ts` | `GET /api/products` |
| `aiApi.ts` | `POST /api/ai/chat` |
| `ProductViewer.tsx` | Canvas, lights, OrbitControls, command bus write |
| `Product3DRenderer.tsx` | Phone vs placeholder |
| `SmartphoneModel.tsx` | Procedural meshes, highlight, flash, internals |
| `FeatureHotspots.tsx` | Html pins |
| `CameraRig.tsx` | Camera lerp |
| `ExplodedLayer.tsx` | Layer lerp |
| `cameraOverview.ts` | Overview + per-feature camera overrides |
| `explodedView.ts` | `cameraCommand`, `explodedMode`, `flashLit`, offsets |
| `product3DCapabilities.ts` | Only smartphone is fully interactive |
| `AiAssistant.tsx` | Chat UI; **does not send history** |

State flow: `useProduct` + App locals → Viewer + Panel + Assistant. No Redux.

---

## Backend

| Piece | Job |
| --- | --- |
| `ProductController` | Product REST |
| `AiController` | `POST /api/ai/chat` |
| `HealthController` | `{status:UP}` — **does not check DB** |
| `ProductService` | JPA read, 404 |
| `ProductMapper` | Entity → DTO |
| `AiService` | Prompt, parse, validate |
| `OpenAiChatProvider` | Chat Completions HTTP |
| `AiProperties` | `OPENAI_API_KEY`, model, timeout 20s |
| `CorsConfig` | `localhost:5173` |
| `GlobalExceptionHandler` | 404 / AI statuses / 400 |

Leftover unused: `com.productexplorer.domain.*` (old in-memory records).

---

## Database

Postgres 16 via `docker-compose`. JDBC in `application.properties`. Flyway V1+V2. Hibernate `ddl-auto=validate`.

```
products ──< product_colors
         ──< product_features (PK product_id+id)
                    ──< feature_specifications
```

Three products: `smartphone-001` (12 features), `tv-001` (10), `refrigerator-001` (10).

---

## 3D

- Canvas FOV 30, PCF shadows, overview eye `(1.55, 0.38, 5.15)`.
- Phone is boxes/cylinders/`RoundedBox`, **not** GLTF. `smart_tv.glb` unused.
- Node names = `model_node_name`.
- Hotspot position = `resolveHotspotPosition` (lookAt override).
- Explode layers: frame, display, internals, battery, backGlass, camera.
- Exploded clickable nodes: display, battery, processor, frame, camera, flash.
- `internalsOpen` if battery or processor selected.
- Flash LED driven by `flashLit`, not by “is flash selected”.

Click path: hotspot → `handleSelectFeature` → `selectFeature` + `focusNonce++` → `resolveFeatureFocus` → `cameraCommand` → CameraRig.

AI path: `handleAiAction` → **same** `selectFeature` + `focusNonce++` (except flash LED side effect is UI-only).

---

## APIs

| Method | URL | UI uses it |
| --- | --- | --- |
| GET | `/api/health` | no |
| GET | `/api/products` | yes |
| GET | `/api/products/{id}` | yes (switch) |
| GET | `.../features` | helper only |
| GET | `.../features/{fid}` | helper only |
| POST | `/api/ai/chat` `{productId,message}` | yes |

---

## AI

**Not keyword matching.** No `contains("camera")` router.

Prompt rules: catalog only; JSON envelope; feature questions also `FOCUS_FEATURE`; colors/overview stay `action: null`; “show flash” ≠ “turn on flash”.

| User says | Intended action |
| --- | --- |
| Show me the camera | `FOCUS_FEATURE` / `camera` |
| Tell me about the camera | `FOCUS_FEATURE` / `camera` + explanatory text |
| Show camera in exploded view | `EXPLODE_PRODUCT` / `camera` |
| Show me the battery | `FOCUS_FEATURE` / `battery` |
| What does the battery do? | `FOCUS_FEATURE` / `battery` + text |
| Turn on the flash | `TOGGLE_FLASH` / `enabled: true` |
| What colors? | `action: null` |

OpenAI output **wording varies**; tests stub the provider and lock the **action contract**.

`resolveFeatureId`: id, `modelNodeName`, or name, case-insensitive → canonical id.

Viewer actions only if `product.id == smartphone-001` (hardcoded constant — mention as coupling).

---

## Security

- Key: `OPENAI_API_KEY` → backend only.
- **Never** `VITE_OPENAI_API_KEY`.
- `.env` gitignored; launch.json loads it for the IDE.
- Log redaction tested.
- **No auth** on the API (quota risk if exposed).

---

## Errors

| Failure | User sees |
| --- | --- |
| Missing key | 503 configured |
| OpenAI 401 / 429 | 502 unavailable |
| Timeout | 504 timed out |
| Bad model JSON | 200 fallback, no action |
| Unknown feature | 200 “not available”, no action |
| Unknown action type | 200 keep message, drop action |
| Missing product | 404 before OpenAI |
| Postgres down at boot | API does not start |
| Backend down | product error card |

401 and 429 share 502 on purpose. Operators read WARN logs.

---

## Testing

- `mvn test` needs live Postgres.
- Product controller/service tests: 3 products, 12 phone features, camera JSON.
- AI tests: `RecordingAiProvider`.
- Provider tests: local HttpServer, no real OpenAI.
- Frontend: **no tests** (Vitest unused). `npm run build` = `tsc -b && vite build`.

---

## Phone features (12)

`display` `camera` `flash` `frame` `action-button` `volume-buttons` `power-button` `usb-c` `speaker` `microphone` `battery` `processor`

---

## Major bugs (say problem → fix)

1. **Hotspot hits** — Html overlay stole clicks → `pointerEvents: none` except the button.
2. **Pin/camera framing** — DB positions ≠ meshes → `FEATURE_FOCUS_OVERRIDES`.
3. **Explode spacing** — retuned `EXPLODED_OFFSETS` + exploded overview camera.
4. **Battery hidden** — ghost frame + back glass (`internalsOpen`).
5. **Flash show vs on** — two actions; UI second-click toggles LED.
6. **minDistance 2.1** — blocked close-ups → 0.35 + restore position after `orbit.update()`.
7. **Explode+focus same tick** — `pendingExplodedFocus`.
8. **Feature id aliases** — `resolveFeatureId`.
9. **API key in the client** — never Vite-prefixed; server Bearer.
10. **429 quota** — UI 502; log HTTP 429 `insufficient_quota`.
11. **Timeout vs HTTP error** — 504 vs 502; sanitized logs.

---

## Current capabilities

Interactive smartphone 3D + catalog-grounded AI + four viewer actions.

## Current limitations

No chat memory, no RAG, no voice, no TV/fridge 3D, no GLTF loader in code, no auth, health ignores DB, 401/429 identical to UI, tests need Docker Postgres, README stale.

## Next

High: conversation context, capabilities in data, frontend tests, Testcontainers, auth.  
Medium: richer actions (color, reset), other product renderers, light RAG.  
Later: voice, production deploy, anatomy-style catalogs on the same action pattern.

---

## Rapid-fire answers

**Why not Redux?** Small tree; 3D animation is not Redux-shaped.

**Why nonces?** Re-fire camera when the feature id did not change.

**Why json_object?** Parseable action envelope; still validate.

**Is the prompt RAG?** No — stuff one product DTO into the system prompt.

**Why JPA validate not update?** Flyway owns schema.

**Why open-in-view false?** Map DTOs inside the transaction.

**Does AI set camera x,y,z?** No. IDs only.

**Does “tell me about X” move the camera?** Yes, by design (`FOCUS_FEATURE`).

**Does “turn on flash” focus the LED?** No. `TOGGLE_FLASH` only.

**Can I steal the OpenAI key from the SPA?** No. It is not there.

**What is actually AI?** OpenAI interprets phrasing into JSON. Java only allowlists.

**Biggest coupling?** `AiService.SMARTPHONE_PRODUCT_ID` vs frontend `product3DCapabilities.ts` — two sources of “has 3D”.

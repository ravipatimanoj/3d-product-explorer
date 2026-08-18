# 3D Product Explorer — Presentation Guide

Use this as a slide-by-slide speaking script. Technical depth lives in `PROJECT_TECHNICAL_DOCUMENTATION.md`. This file is what you say and show.

**Source of truth:** current `main` (`fcc85a8`). Do not quote the root `README.md` — it is stale (it still says in-memory catalog and “AI later”).

---

## How to present (30–40 minutes)

| Minutes | Section | Goal |
| --- | --- | --- |
| 0–2 | Problem and demo intent | Why 3D + AI together |
| 2–6 | Live or recorded demo | Load phone, hotspot, explode, color, AI |
| 6–12 | Architecture | Boxes and arrows, ownership |
| 12–18 | 3D system | Canvas, CameraRig, explode, nodes |
| 18–24 | Backend + Postgres | Contract, Flyway, JPA |
| 24–32 | AI orchestration | Prompt → JSON → validate → same React handlers |
| 32–36 | Bugs and design choices | Prove you actually built it |
| 36–40 | Limits and next | Honest scope |

If you only have **10 minutes**: demo + architecture diagram + AI lifecycle + one bug (OrbitControls minDistance or explode+focus).

If you only have **5 minutes**: use the 3-minute spoken script in Part 17 of the technical doc.

---

## Slide 1 — Title

**3D Product Explorer**

An interactive product inspector: React Three Fiber + Spring Boot + PostgreSQL + OpenAI structured actions.

One-liner you can say:

> “The AI never touches Three.js. It returns a feature ID, and the viewer we already built does the rest.”

---

## Slide 2 — What it is

Talking points:

- Portfolio-quality **product explorer**, not a store.
- User inspects a flagship smartphone in 3D: orbit, hotspots, explode, color, flash LED.
- Asks natural language questions that can **move the camera** or **answer from the catalog**.
- Catalog also has a TV and a refrigerator. Those are **data + Q&A only** today (`product3DCapabilities` all false; AI rejects viewer actions).

Do **not** say “we load GLTF phones.” The phone is **procedural meshes**. `smart_tv.glb` exists on disk and is **not loaded**.

---

## Slide 3 — Problem

| 2D product page | This app |
| --- | --- |
| Photos + spec table | Spatial model of 12 parts |
| User hunts for the camera in a diagram | Hotspot / click / “show me the camera” |
| Chatbot hallucinates specs | Catalog-grounded prompt + ID validation |
| AI would need a scene API | AI emits `FOCUS_FEATURE` / `EXPLODE_PRODUCT` / … |

---

## Slide 4 — Demo script (say this while clicking)

1. **Load.** “On startup React calls `GET /api/products`. Postgres has three rows. We default to `smartphone-001`.”
2. **Orbit.** “OrbitControls, damping on, minDistance 0.35 so close-ups work.”
3. **Camera hotspot.** “This pin is Drei Html, but the click goes to `App.handleSelectFeature`, which is the same path AI will use.”
4. **Color Blue.** “No backend. `phoneAppearance.ts` swaps PBR colors.”
5. **Exploded view.** “Six `ExplodedLayer` groups lerp to offsets. Only six hotspots stay clickable.”
6. **Battery.** “Frame and back glass go translucent so you can see the cell. That was a real bug: transparent glass was not enough because the frame is a solid volume.”
7. **Assemble + View Full Phone.** “`overviewNonce` retriggers CameraRig even if the feature did not change.”
8. **AI: “Show me the camera.”** “Watch the same close-up. The network tab is `POST /api/ai/chat`, not a Three.js call.”
9. **AI: “Tell me about the camera.”** “Still `FOCUS_FEATURE` — we *want* Q&A to also inspect the part.”
10. **AI: “Show me the camera in exploded view.”** “`EXPLODE_PRODUCT` plus `featureId`. We delay the close-up until explode state is true.”
11. **AI: “Turn on the flash.”** “`TOGGLE_FLASH`. The camera does **not** move. Show vs toggle are different intents.”
12. **Switch to TV.** “Placeholder. Chat still works. If the model returns explode, the backend strips it.”

---

## Slide 5 — Architecture (draw this)

```
User
  → React App (session state)
      → ProductViewer (Canvas / Three.js)
      → AiAssistant (POST /api/ai/chat)
  → Spring Boot
      → ProductService → JPA → PostgreSQL
      → AiService → OpenAI → validate JSON
  → React handleAiAction
  → same state as clicks
  → CameraRig / ExplodedLayer / materials
```

Ownership one-liners:

- **React** owns UI state and animation *inputs*.
- **Spring** owns catalog truth and AI policy.
- **Postgres** owns product rows.
- **OpenAI** owns language understanding.
- **Three.js** owns pixels.

---

## Slide 6 — Frontend map

Show the file names, not every prop:

- `App.tsx` — orchestrator (color, flash, explode, nonces, `handleAiAction`)
- `useProduct.ts` — catalog fetch
- `ProductViewer.tsx` — Canvas, lights, OrbitControls, writes `cameraCommand`
- `Product3DRenderer.tsx` — smartphone vs placeholder
- `SmartphoneModel.tsx` — named meshes
- `FeatureHotspots.tsx` — Html pins
- `CameraRig.tsx` — lerp camera
- `ExplodedLayer.tsx` — lerp parts
- `cameraOverview.ts` / `explodedView.ts` — presets + command bus
- `AiAssistant.tsx` / `aiApi.ts` — chat HTTP

Say: “No Redux. The state tree is small and must stay in lockstep with the canvas.”

---

## Slide 7 — 3D deep dive (only if the audience is technical)

Cover in this order:

1. **Canvas** — FOV 30, PCF shadows, DPR 1–2.
2. **Named nodes** — `modelNodeName` in Postgres equals `<group name="camera">`.
3. **Hotspot click chain** — pin → `handleSelectFeature` → `selectFeature` + `focusNonce++` → `resolveFeatureFocus` → `cameraCommand` → CameraRig lerp → `usePartLook` highlight.
4. **Why module-level `cameraCommand`** — `useFrame` runs 60fps inside Canvas; ProductViewer writes commands during React render.
5. **AI reuse** — `handleAiAction` only calls those same setters.

Optional visual: assembled camera override for `camera` eye `(0.62, 1.16, -0.95)` lookAt `(0.16, 0.9, -0.05)` vs raw DB eye `(2, 1.5, 3)`.

---

## Slide 8 — Data model (12 features)

List them so you look fluent:

Display, Camera System, Flash, Titanium Frame, Action Button, Volume Buttons, Power Button, USB-C, Speaker, Microphone, Battery, Processor.

Say why IDs matter:

> “The LLM is allowed to say ‘Camera System’ or ‘camera’. `resolveFeatureId` canonicalizes to `camera`. React then `find`s by id. If it says warp-drive, we drop the action.”

---

## Slide 9 — PostgreSQL

Four tables only:

`products` 1—* `product_colors`  
`products` 1—* `product_features` (PK `product_id + id`)  
`product_features` 1—* `feature_specifications`

Talking points:

- Flyway V1 phone, V2 TV + fridge.
- `ddl-auto=validate`, `open-in-view=false`, `@Fetch(SUBSELECT)`.
- Same JSON the in-memory catalog used to return — frontend did not need a rewrite for persistence.
- Tests and the app share `localhost:5432` (limitation: no H2/Testcontainers).

---

## Slide 10 — REST surface

| Method | Path | Used by UI? |
| --- | --- | --- |
| GET | `/api/health` | No (curl/ops) |
| GET | `/api/products` | Yes — initial load |
| GET | `/api/products/{id}` | Yes — product switch |
| GET | `/api/products/{id}/features` | Helper exists, UI unused |
| GET | `/api/products/{id}/features/{fid}` | Helper exists, UI unused |
| POST | `/api/ai/chat` | Yes — AI panel |

CORS: `http://localhost:5173` only.

---

## Slide 11 — AI lifecycle (the money slide)

Say it slowly:

1. User types English.
2. React POSTs `{ productId, message }` — **no history**.
3. `AiService` loads the product from Postgres (404 before any OpenAI call).
4. System prompt = rules + **this product’s colors and features**.
5. OpenAI Chat Completions, `gpt-4o-mini`, temperature 0.2, `response_format: json_object`.
6. Parse JSON (including fenced markdown).
7. Validate type allowlist + feature IDs + smartphone-only viewer actions.
8. React shows `message` and runs `action` through existing handlers.

**This is AI, not `if (text.contains("camera"))`.** There is no keyword router in Java or TypeScript.

---

## Slide 12 — Action table

| Action | Params | 3D result |
| --- | --- | --- |
| `FOCUS_FEATURE` | `featureId` | Select + camera lerp + highlight |
| `EXPLODE_PRODUCT` | optional `featureId` | Layers apart; optional sequenced focus |
| `ASSEMBLE_PRODUCT` | — | Layers together |
| `TOGGLE_FLASH` | `enabled` bool | LED / point light only |

Unknown type → keep text, drop action.  
Unknown FOCUS id → *“That component is not available on this product.”*

Call out the subtle difference:

> “A UI click on Flash goes through `handleSelectFeature` and can turn the LED on. An AI `FOCUS_FEATURE` on flash does not; turning the LED on is `TOGGLE_FLASH`.”

---

## Slide 13 — Security (one slide, be crisp)

- Key is `OPENAI_API_KEY` on the **server**. Bound as `ai.openai.api-key`.
- `.env` gitignored; `.env.example` is empty.
- **Never** `VITE_OPENAI_API_KEY` — Vite would bake it into the bundle.
- Logs run through `sanitizeForLog` (tested with a fake `sk-test-…` key).
- No user auth on the API — say that before they ask.

Do not paste a real key on a slide.

---

## Slide 14 — Errors (table you can memorize)

| Situation | HTTP / UI |
| --- | --- |
| No API key | 503 AI service is not configured |
| OpenAI 401 or 429 | 502 AI provider unavailable |
| Timeout | 504 AI provider timed out |
| Bad JSON from model | 200 + fallback sentence, no action |
| Bad feature id | 200 + canned sentence, no action |
| Postgres down at boot | App does not start |
| Backend down | Product error card / AI error line |

You diagnosed a live 429 `insufficient_quota` that **looked** like a generic 502 to the UI. That is a good war story: contract vs operator logs.

---

## Slide 15 — Tests

- JUnit + `@SpringBootTest` + MockMvc against **real Postgres seed data**.
- `RecordingAiProvider` `@Primary` so AI tests do not call OpenAI.
- `OpenAiChatProviderTest` uses a local `HttpServer` for 401 and timeout + log redaction.
- Frontend: `tsc` on build; Vitest is installed but **there are no frontend tests**. Say this; do not claim coverage you do not have.

---

## Slide 16 — History (shows progression, not luck)

1. API + in-memory catalog  
2. Procedural 3D phone  
3. Color + reset camera  
4. Framing overrides  
5. Exploded view + flash  
6. PostgreSQL + two more products  
7. AI actions on the **existing** viewer  

---

## Slide 17 — Bugs that prove you were in the code

Pick three if short on time:

1. **Hotspot clicks** — Html `pointerEvents: none` except the button.
2. **OrbitControls minDistance 2.1** fought close-ups; restore camera after `controls.update()`.
3. **Explode then focus** — `pendingExplodedFocus` because exploded camera math depends on `exploded === true`.
4. **Battery invisible** — ghost the frame, not only the back glass.
5. **Show flash ≠ turn on flash**.

---

## Slide 18 — What we would build next

**High:** chat memory, capabilities in data not a hardcoded `SMARTPHONE_PRODUCT_ID`, frontend tests, Testcontainers, auth on `/api/ai/chat`.

**Medium:** color as an AI action, TV/fridge 3D, light RAG.

**Later:** voice, WebXR, anatomy-style catalogs using the same FOCUS_FEATURE pattern.

---

## Spoken closers

**If they like architecture:**  
“The interesting part is the boundary. The model is a translator into four verbs. The 3D engine is deterministic.”

**If they like 3D:**  
“CameraRig is a second control system next to OrbitControls. We had to stop OrbitControls from undoing scripted close-ups.”

**If they like AI:**  
“Structured output plus a validator is what makes this production-shaped. The LLM is not the product database and not the renderer.”

---

## Demo failure plan

| What breaks | What you say |
| --- | --- |
| Postgres not running | “The API will not boot; Flyway needs `product-explorer-db`. The SPA shows Unable to load product.” |
| No OpenAI key | “Catalog 3D still works. Chat returns 503.” |
| 429 quota | “UI says provider unavailable; server log is HTTP 429. Billing, not code.” |
| TV selected | “Intentional placeholder. Catalog Q&A still works.” |

---

## Files to keep open while presenting

- `App.tsx` — `handleAiAction`
- `AiService.java` — prompt + `validate`
- `OpenAiChatProvider.java` — HTTP + timeouts
- `cameraOverview.ts` — overrides
- `explodedView.ts` — command bus
- `V1__create_product_catalog.sql` — 12 features

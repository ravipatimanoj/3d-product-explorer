# 1. Project Overview

- **What it is:** A split-stack 3D Product Explorer: React viewer + Spring Boot catalog + an AI assistant that drives the existing 3D UI.
- **Problem it solves:** Spec sheets and 2D photos do not show where a camera, battery, or flash actually sits on a device.
- **What the user can do:** Orbit, zoom, and pan a procedural smartphone; click hotspots or the feature list; explode/assemble the phone; change color; toggle the LED flash; ask questions in English.
- **How AI fits:** The model never talks to Three.js. It returns `{ message, action }`. React runs the same handlers a click would run.
- **Catalog vs 3D:** PostgreSQL has a smartphone, TV, and refrigerator. Only `smartphone-001` has an interactive 3D model. TV/fridge show catalog Q&A and a “3D model coming soon” placeholder.
- **Not a store:** No cart, auth, checkout, or conversation history sent to OpenAI.

# 2. Technology Stack

| Layer | Technology | Role in this project |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite | SPA on `localhost:5173`. Local state in `App` / `useProduct`. No Redux. |
| 3D | Three.js, React Three Fiber, Drei `OrbitControls` | Declarative canvas. Orbit / zoom / pan stay native. Drei also supplies `Html` hotspots and `ContactShadows`. |
| Backend | Java 17, Spring Boot 3.3.5, REST | Product APIs and AI policy on `localhost:8080`. |
| Persistence | PostgreSQL 16, Flyway, Spring Data JPA | Catalog tables + seed data. Hibernate `ddl-auto=validate`. |
| AI | OpenAI Chat Completions | Default model `gpt-4o-mini` (`ai.openai.model`, overridable via `AI_OPENAI_MODEL`). Base URL `https://api.openai.com/v1`. Temperature `0.2`, `response_format: json_object`. Key: `OPENAI_API_KEY` on the server only. |
| Tools | Maven, npm, Git, Docker Compose, Cursor | Backend build, frontend build, source control, local Postgres 16, IDE used to build the project. |

The phone is **procedural meshes** in `SmartphoneModel`, not a loaded GLTF. A `smart_tv.glb` file may exist on disk; the app does not load it.

# 3. High-Level Architecture

```
User
 ↓
React UI  (App, FeaturePanel, AiAssistant, ProductViewer)
 ↓
GET /api/products…     POST /api/ai/chat
 ↓
Spring Boot  (ProductController / AiController)
 ↓
PostgreSQL                 OpenAI Chat Completions
 ↓                         ↓
Product JSON               { message, action }  (validated)
 ↓
React
 ↓
Same 3D state as clicks  →  CameraRig / ExplodedLayer / materials
```

**React → Spring Boot.** The browser calls REST over HTTP. `productApi.ts` loads the catalog (`GET /api/products`). `aiApi.ts` posts `{ productId, message }` to `POST /api/ai/chat`. CORS allows only `http://localhost:5173`.

**Spring Boot → PostgreSQL.** `ProductService` uses JPA repositories. Flyway owns schema and seed data. The JSON the frontend receives is a `ProductResponse` (id, colors, nested features with `modelNodeName`, positions, specs).

**Spring Boot → OpenAI.** `AiService` loads that same product, builds a system prompt from catalog text, and `OpenAiChatProvider` calls `/chat/completions`. The frontend never sees the API key.

**Spring Boot → React.** Product GET returns catalog JSON. AI POST returns `{ message, action }`. Unknown action types are stripped. Viewer actions are allowed only for `smartphone-001`.

**React → Three.js / R3F.** `ProductViewer` hosts the `Canvas`. `Product3DRenderer` picks `SmartphoneModel` for the phone. `CameraRig` and `ExplodedLayer` run inside `useFrame`. `OrbitControls` still owns rotate / zoom / pan.

**AI response → React action → 3D viewer.** `AiAssistant` calls `onAction(response.action)`. `App.handleAiAction` updates the same state as UI clicks (`selectFeature`, `focusNonce`, `exploded`, `flashOn`, `overviewNonce`). There is no second camera engine.

# 4. Complete Data Flow

1. Vite starts the React app (`main.tsx` → `App`).
2. `useProduct` calls `GET /api/products` (default product `smartphone-001`).
3. `ProductController` → `ProductService` → PostgreSQL.
4. Backend maps entities to `ProductResponse` JSON.
5. React stores `products` + selected `product` (features included).
6. `ProductViewer` mounts a R3F canvas. For the phone, `Product3DRenderer` draws `SmartphoneModel` and `FeatureHotspots`.
7. The user orbits with `OrbitControls`, clicks hotspots or the feature list, toggles exploded view, changes color, or toggles flash.
8. The user types in `AiAssistant`.
9. React sends `{ productId, message }` to `POST /api/ai/chat`. UI chat history is local only; OpenAI does not receive prior turns.
10. `AiController` → `AiService` loads the product from Postgres and stuffs catalog text into the system prompt (not RAG).
11. `OpenAiChatProvider` calls OpenAI and expects a JSON object.
12. `AiService.validate` allowlists the action and feature IDs.
13. React shows `message` and runs `handleAiAction`.
14. Existing 3D code reacts: select feature, bump `focusNonce`, set `exploded`, toggle flash, or bump `overviewNonce`.

# 5. Database / Product Data

Product data lives in PostgreSQL (`product_explorer`), created and seeded by Flyway (`V1__create_product_catalog.sql`, `V2__seed_additional_products.sql`).

| Table | Holds |
| --- | --- |
| `products` | `id`, name, description, category, `default_color` |
| `product_colors` | Available color names per product |
| `product_features` | Feature `id`, name, `model_node_name`, 3D `position_*`, `camera_*` |
| `feature_specifications` | Name/value specs per feature |

**IDs.** Products: `smartphone-001`, `tv-001`, `refrigerator-001`. Smartphone features use stable IDs such as `camera`, `battery`, `display`, `flash`. For the phone, `id` and `modelNodeName` match Three.js group names.

**Colors.** Names in `product_colors` (phone: Natural, Black, Silver, Blue). React `selectedColor` drives PBR materials in `phoneAppearance.ts`.

**How the frontend gets data.** `GET /api/products` returns the full nested catalog. The UI does not keep a second hardcoded product list. `product3DCapabilities.ts` only says which 3D *behaviors* a product ID supports (interactive model, hotspots, explode, flash). Copy still comes from the API.

Example (trimmed):

```json
{
  "id": "smartphone-001",
  "name": "Premium Flagship Smartphone",
  "defaultColor": "Natural",
  "availableColors": ["Natural", "Black", "Silver", "Blue"],
  "features": [
    {
      "id": "camera",
      "name": "Camera System",
      "modelNodeName": "camera",
      "position": { "x": 0.25, "y": 1.2, "z": 0.1 },
      "cameraPosition": { "x": 2.0, "y": 1.5, "z": 3.0 },
      "specifications": [{ "name": "Type", "value": "Multi-lens rear array" }]
    }
  ]
}
```

# 6. Product → Feature Mapping

The join key is the **feature ID** (and matching `modelNodeName` on the phone).

**Camera System**

```
PostgreSQL product_features.id = 'camera', name = 'Camera System', model_node_name = 'camera'
        ↓
ProductResponse / ProductFeature JSON
        ↓
React product.features  (FeaturePanel list + selection)
        ↓
Hotspot (Drei Html pin on that feature)
        ↓
SmartphoneModel group name "camera"  (highlight / click)
        ↓
cameraOverview preset for node "camera"
        ↓
CameraRig looks at the camera module
        ↓
AI FOCUS_FEATURE / EXPLODE_PRODUCT featureId "camera"
```

**Battery** is the same chain: DB `battery` → JSON → panel + hotspot → mesh group `battery` → exploded layer offset `battery` → `FOCUS_FEATURE` / explode with `featureId: "battery"`. Internals (battery/processor) also ghost the frame so the pack is visible.

One ID, four surfaces: database, sidebar, hotspot, 3D node, AI action.

# 7. 3D Viewer Architecture

| Piece | What it does | How it connects |
| --- | --- | --- |
| **ProductViewer** | Canvas, lights, shadows, `OrbitControls`, explode / “View Full Phone” buttons. Writes `explodedMode`, `flashLit`, `cameraCommand`. | Owned by `App`. Hosts renderer + `CameraRig`. |
| **Product3DRenderer** | Chooses the 3D implementation by product ID. Phone → model + hotspots. TV/fridge → nothing in the canvas (placeholder outside). | Child of `ProductViewer`. |
| **SmartphoneModel** | Procedural phone meshes (frame, display, camera, battery, …). Color + selection highlight + flash LED. | Named groups match `modelNodeName`. Parts sit in `ExplodedLayer`s. |
| **FeatureHotspots** | HTML pins from catalog features. Click → `onSelectFeature`. | Positions from `cameraOverview`. Follow explode offsets. |
| **CameraRig** | Invisible `useFrame` helper. Lerps camera + orbit target to overview or a feature preset. | Reads `cameraCommand` / `explodedMode` (not props). |
| **ExplodedLayer** | Lerps a group to an offset or back to origin. | Used by the model and hotspots. Shared `explodedMode` flag. |
| **FeaturePanel** | Sidebar: colors, feature buttons, selected spec sheet. | Same `selectedFeature` / `selectedColor` as the canvas. |

`App` is the session owner. The canvas is a view of that state.

# 8. How Camera Focus Works

```
User clicks Camera (hotspot, mesh, or FeaturePanel)
        ↓
App.handleSelectFeature → selectedFeature = camera, focusNonce++
        ↓
ProductViewer: resolveFeatureFocus(camera, exploded?)
        ↓
cameraCommand = { featureId, cameraPosition, lookAt, focusNonce }
        ↓
CameraRig sees a new nonce and lerps toward the camera module
        ↓
Hotspot highlight + FeaturePanel details update from the same selectedFeature
```

Presets live in `cameraOverview.ts` (assembled) and `explodedView.ts` (exploded look-at + eye offset). Catalog `cameraPosition` is a fallback, not a second system.

**AI uses this path, not a new one.** `FOCUS_FEATURE` → `selectFeature` + `focusNonce++`. `SHOW_OVERVIEW` → `overviewNonce++` (same as **View Full Phone**). `FOCUS_FEATURE` does **not** assemble or explode.

If explode/assemble must change *and* a feature must be focused, `App` sets `pendingFocusMode` so `focusNonce` bumps **after** React has committed `exploded`. Then `CameraRig` uses the matching assembled or exploded coordinates.

# 9. Exploded View

**Assembled:** `exploded = false`. Layers sit at the origin. Overview camera uses the assembled full-phone shot.

**Exploded:** `exploded = true`. `ExplodedLayer` lerps six layers (frame, display, internals, battery, back glass, camera) to `EXPLODED_OFFSETS`. Buttons, ports, and similar parts ride with the frame.

The UI button and AI share `setExploded`.

| User intent | Action | 3D result |
| --- | --- | --- |
| Take it apart | `EXPLODE_PRODUCT` | Layers separate. Optional `featureId` then focuses that part. |
| Show camera exploded | `EXPLODE_PRODUCT` + `camera` | Explode, wait until exploded is true, then CameraRig uses exploded camera coords. |
| Put it together | `ASSEMBLE_PRODUCT` | Layers return. Optional `featureId` focuses in assembled mode. |

Orbit / zoom / pan stay enabled. Explode only moves parts and retargets the camera.

# 10. AI Assistant — MOST IMPORTANT

```
User: "Show me the camera in exploded view"
        ↓
AiAssistant  →  sendAiChat(productId, message)
        ↓
POST /api/ai/chat
        ↓
AiController
        ↓
AiService  (load product from Postgres, build system prompt)
        ↓
OpenAiChatProvider  →  OpenAI Chat Completions
        ↓
JSON  { message, action }
        ↓
AiService.validate  (allowlist + feature IDs + smartphone-only viewer actions)
        ↓
AiAssistant shows message, calls onAction
        ↓
App.handleAiAction  →  existing 3D state
```

**The AI does not control Three.js.** It cannot set camera x,y,z, run JavaScript, or call R3F. It only proposes an allowed action. React executes it.

| Action | Parameters | What React already does |
| --- | --- | --- |
| `FOCUS_FEATURE` | `featureId` required | Select + camera close-up. Does not change explode mode. |
| `EXPLODE_PRODUCT` | optional `featureId` | `setExploded(true)` + optional sequenced focus. |
| `ASSEMBLE_PRODUCT` | optional `featureId` | `setExploded(false)` + optional sequenced focus. |
| `SHOW_OVERVIEW` | none | Same as View Full Phone (`overviewNonce++`). Does not assemble/explode. |
| `TOGGLE_FLASH` | `enabled` boolean | LED on/off. “Show the flash” is focus, not toggle. |
| `null` / `NONE` | — | Catalog answer only (e.g. available colors). |

Viewer actions are allowed only for `smartphone-001`. TV/fridge stay catalog Q&A.

# 11. AI Example Conversations

**USER:** “Show me the camera”  
**AI ACTION:** `FOCUS_FEATURE` → `camera`  
**RESULT:** Camera System is selected; CameraRig moves to the camera module. Explode mode unchanged.

**USER:** “What’s the battery capacity?”  
**AI ACTION:** `FOCUS_FEATURE` → `battery`  
**RESULT:** Catalog answer (e.g. ~4000 mAh) plus battery selected and focused.

**USER:** “Show me the flash”  
**AI ACTION:** `FOCUS_FEATURE` → `flash`  
**RESULT:** Flash module selected and focused. LED is not toggled by this phrasing.

**USER:** “Show camera in exploded view”  
**AI ACTION:** `EXPLODE_PRODUCT` → `camera`  
**RESULT:** Phone takes apart; after explode commits, camera layer is focused.

**USER:** “Show display in assembled mode”  
**AI ACTION:** `ASSEMBLE_PRODUCT` → `display`  
**RESULT:** Phone puts together; Display is selected and focused.

**USER:** “Turn on the flash”  
**AI ACTION:** `TOGGLE_FLASH` → `enabled: true`  
**RESULT:** LED lights. Camera does not need to move.

**USER:** “What colors does this phone come in?”  
**AI ACTION:** `null`  
**RESULT:** Text from catalog colors. No 3D action.

**USER:** “Show me the full phone”  
**AI ACTION:** `SHOW_OVERVIEW`  
**RESULT:** Camera pulls back to the current assembled or exploded overview. Same as View Full Phone.

# 12. AI Safety / Validation

- `OPENAI_API_KEY` is a backend env var (`AiProperties`). There is no `VITE_OPENAI_API_KEY`.
- React only sends `productId` + user text and receives `{ message, action }`.
- Allowed types: `NONE`, `FOCUS_FEATURE`, `EXPLODE_PRODUCT`, `ASSEMBLE_PRODUCT`, `SHOW_OVERVIEW`, `TOGGLE_FLASH`. Anything else is dropped (`action` becomes `null`).
- `FOCUS_FEATURE` IDs must match the product (id, `modelNodeName`, or name). Unknown → *“That component is not available on this product.”* and no action.
- Unknown IDs on explode/assemble still explode or assemble, but do not focus a fake part.
- Viewer actions on TV/fridge are replaced with a “3D AI interactions are not currently available…” message.
- The model is told to answer only from catalog context and not invent specs.
- The model cannot emit JavaScript or drive Three.js. Only React state changes the scene.
- Logs redact the key. Missing key → **503**. Timeout → **504**. OpenAI HTTP errors (including 429) → **502**.

# 13. Important API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness (`{ "status": "UP" }`). Does not ping Postgres. |
| GET | `/api/products` | Full catalog (what the app loads on start). |
| GET | `/api/products/{productId}` | One product with features. |
| GET | `/api/products/{productId}/features` | Feature list. |
| GET | `/api/products/{productId}/features/{featureId}` | One feature. |
| POST | `/api/ai/chat` | Body `{ productId, message }` → `{ message, action }`. |

# 14. Important Files

### Frontend

| File | Responsibility |
| --- | --- |
| `frontend/src/App.tsx` | Session state + `handleAiAction` / click handlers. |
| `frontend/src/hooks/useProduct.ts` | Loads catalog; `selectedFeature` / product selection. |
| `frontend/src/services/productApi.ts` | Product REST client. |
| `frontend/src/services/aiApi.ts` | `POST /api/ai/chat` client. |
| `frontend/src/components/AiAssistant.tsx` | Chat UI; forwards `action` to `App`. |
| `frontend/src/components/FeaturePanel.tsx` | Feature list, specs, color selector. |
| `frontend/src/product3DCapabilities.ts` | Which product IDs get 3D / AI viewer actions. |

### 3D

| File | Responsibility |
| --- | --- |
| `frontend/src/components/ProductViewer.tsx` | Canvas, controls, camera command bridge. |
| `frontend/src/components/Product3DRenderer.tsx` | Phone vs placeholder routing. |
| `frontend/src/components/SmartphoneModel.tsx` | Procedural phone meshes. |
| `frontend/src/components/FeatureHotspots.tsx` | Clickable feature pins. |
| `frontend/src/components/CameraRig.tsx` | Camera lerp. |
| `frontend/src/components/ExplodedLayer.tsx` | Part separation animation. |
| `frontend/src/components/explodedView.ts` | Shared explode offsets + `cameraCommand`. |
| `frontend/src/components/cameraOverview.ts` | Assembled focus presets. |

### Backend / AI / configuration

| File | Responsibility |
| --- | --- |
| `.../controller/ProductController.java` | Product REST. |
| `.../service/ProductService.java` | Catalog reads from JPA. |
| `.../controller/AiController.java` | `POST /api/ai/chat`. |
| `.../service/AiService.java` | Prompt, parse, allowlist. |
| `.../service/OpenAiChatProvider.java` | OpenAI HTTP call + timeouts. |
| `backend/src/main/resources/application.properties` | Port 8080, Postgres, OpenAI settings. |
| `docker-compose.yml` | PostgreSQL 16. |
| `.../db/migration/V1__create_product_catalog.sql` | Schema + smartphone seed. |

# 15. Frontend State

| State | Where | Effect |
| --- | --- | --- |
| `product` / `products` | `useProduct` | Catalog on screen; 3D renderer chosen by `product.id`. |
| `selectedFeature` | `useProduct` | Panel details, hotspot highlight, mesh highlight, camera look-at. |
| `selectedColor` | `App` | Phone materials. Defaults to `product.defaultColor`. |
| `flashOn` | `App` | LED in the model (`flashLit`). |
| `exploded` | `App` | Layer offsets + exploded vs assembled camera presets. |
| `focusNonce` | `App` | “Focus this feature again” even if ID did not change. |
| `overviewNonce` | `App` | Pull back to full phone (UI or `SHOW_OVERVIEW`). |
| `pendingFocusMode` | `App` | Wait until `exploded` matches assemble/explode, then bump `focusNonce`. |

TV/fridge keep catalog state but 3D capability flags disable focus, explode, and flash.

# 16. Typical User Journey

1. App opens → `GET /api/products` → smartphone selected.
2. Canvas shows the procedural phone; user orbits / zooms / pans.
3. User clicks **Camera** → `selectedFeature = camera`, `focusNonce++` → CameraRig close-up → panel shows Camera System.
4. User asks “Tell me about the camera” → `FOCUS_FEATURE` / `camera` → same focus path + catalog text.
5. User asks “Show camera in exploded view” → `EXPLODE_PRODUCT` / `camera` → layers separate → pending exploded focus → camera module close-up.
6. User asks “Show display in assembled mode” → `ASSEMBLE_PRODUCT` / `display` → layers close → display focused.

Clicks and AI share one pipeline. Only the *intent parser* (OpenAI + `AiService`) is extra.

# 17. What I Built / Key Engineering Decisions

- **One 3D interaction system.** AI does not lerp cameras or explode meshes. It sets the same React state as the UI.
- **AI is an orchestration layer.** OpenAI maps English → allowlisted JSON. Backend validates. React executes.
- **Backend owns the OpenAI key.** The browser never calls OpenAI.
- **Postgres is catalog truth.** Flyway seeds products/features; the SPA does not duplicate a product database.
- **Feature IDs are the spine.** Same `camera` / `battery` string in SQL, JSON, mesh names, hotspots, and AI actions.
- **Structured JSON, not keywords.** No `message.contains("camera")` in the viewer.
- **OrbitControls stay in charge** of rotate / zoom / pan. CameraRig only animates to goals, then damping continues.
- **Assembled vs exploded focus** uses one CameraRig plus `pendingFocusMode`, not two camera systems.
- **Procedural phone** so every catalog feature can have a named clickable mesh without wiring a GLTF.
- **Capability flags** so TV/fridge can exist in the catalog before they have 3D.

# 18. Interview Explanation

## "Explain This Project in 60 Seconds"

I built a 3D Product Explorer: a React Three Fiber smartphone viewer backed by a Spring Boot catalog in PostgreSQL. You can orbit the phone, click features, explode it, change color, and toggle the flash. An AI assistant on the same page answers from that catalog and can drive the viewer. The model never talks to Three.js. It returns a small JSON action like `FOCUS_FEATURE` with `featureId: camera`. The backend validates it against the product, and React runs the same code a hotspot click would run. Feature IDs are the join key across the database, the UI, the meshes, and the AI. Only the flagship phone is interactive in 3D; TV and fridge are real catalog products with Q&A and a placeholder model.

## "Explain the AI in 30 Seconds"

The chat box posts `productId` and the user sentence to Spring Boot. The server loads the product, puts the catalog in the system prompt, and calls OpenAI `gpt-4o-mini` with JSON mode. `AiService` allowlists the action and feature IDs. React then calls existing handlers: focus, explode, assemble, overview, or toggle flash. If the model invents a warp drive, we drop the action. The API key never leaves the server.

## "Explain the Architecture in 30 Seconds"

It is three layers with one contract. PostgreSQL holds products and features. Spring Boot exposes REST and is the only OpenAI client. React owns session state and a R3F canvas. Data flows JSON over HTTP. 3D motion is always React state → CameraRig / ExplodedLayer. AI is just another producer of that state.

## "Top 15 Questions I Should Be Able to Answer"

**Why React?** The UI, catalog panel, and canvas must share one selected feature, color, explode flag, and flash flag. A React SPA with local state is enough; there is no multi-page app.

**Why Three.js?** We need a real-time 3D phone with lights, shadows, and a camera the user can orbit.

**Why React Three Fiber?** So the scene is React components (`Canvas`, `CameraRig`, `SmartphoneModel`) instead of a separate Three.js lifecycle.

**Why Spring Boot?** Typed REST, validation, JPA, and a policy layer in front of OpenAI (allowlist, 503/502/504), on Java 17.

**Why PostgreSQL?** The catalog is relational (product → colors → features → specs) and should survive restarts. Flyway owns schema; we are not using an in-memory catalog at runtime.

**How does the frontend get data?** `useProduct` → `GET /api/products`. Nested JSON becomes `product.features`. No second hardcoded catalog.

**How does AI get product context?** `AiService` reloads that product and writes id, colors, and each feature’s id/name/description/specs into the system prompt. Not RAG. No chat history to OpenAI.

**How does AI trigger 3D actions?** Validated `{ type, featureId?, enabled? }` → `App.handleAiAction` → existing `selectFeature` / `setExploded` / `setFlashOn` / nonces.

**Where is the OpenAI key stored?** Server env `OPENAI_API_KEY` → `ai.openai.api-key`. Never in Vite.

**How are AI actions validated?** Allowlisted types; smartphone-only viewer actions; `FOCUS_FEATURE` must resolve to a real feature; flash needs a boolean `enabled`.

**How does feature mapping work?** One ID such as `camera` in Postgres, JSON, mesh `name`, hotspot, panel, and AI `featureId`.

**How does exploded view work?** Boolean `exploded` → `ExplodedLayer` lerps groups to offsets. AI `EXPLODE_PRODUCT` sets that boolean; optional `featureId` focuses after the mode commits.

**How does camera focus work?** `focusNonce` + feature presets in `cameraOverview` / exploded eye offsets. `CameraRig` lerps. Clicks and AI bump the same nonce.

**What if AI returns an invalid feature?** Focus: user-facing “not available” and no action. Explode/assemble: still change mode, ignore the bad ID. Unknown types: message kept, action null.

**What if OpenAI is unavailable?** Missing key **503**, timeout **504**, provider HTTP errors **502**. The 3D viewer still works from the product API; only chat fails.

# 3D Product Explorer — Technical Documentation

This document describes the **current implementation** of the 3D Product Explorer as of commit `fcc85a8` (`AI Feature Implementation`) on `main`. It is based on source code, Flyway migrations, tests, Docker Compose, and git history.

It does **not** describe the stale `README.md`, which still says the catalog is in-memory and that PostgreSQL/AI are future work.

**Not modified by this documentation pass:** source code, tests, configuration, git history.

---

## Table of contents

1. [Project overview](#part-1--project-overview)
2. [Technology stack](#part-2--technology-stack)
3. [Complete architecture](#part-3--complete-architecture)
4. [Frontend structure](#part-4--frontend-structure)
5. [3D architecture](#part-5--3d-architecture)
6. [Product data model](#part-6--product-data-model)
7. [PostgreSQL](#part-7--postgresql)
8. [Spring Boot backend](#part-8--spring-boot-backend)
9. [AI architecture](#part-9--ai-architecture)
10. [AI action system](#part-10--ai-action-system)
11. [Security](#part-11--security)
12. [Error handling](#part-12--error-handling)
13. [Testing](#part-13--testing)
14. [Development history](#part-14--development-history)
15. [Important bugs we fixed](#part-15--important-bugs-we-fixed)
16. [End-to-end user scenarios](#part-16--end-to-end-user-scenarios)
17. [Interview explanation](#part-17--interview-explanation)
18. [Likely interview questions](#part-18--likely-interview-questions)
19. [What we would build next](#part-19--what-we-would-build-next)
20. [Final cheat sheet](#part-20--final-cheat-sheet)

---

## Part 1 — Project overview

### 1. What this application does

The 3D Product Explorer is a split-stack web application that lets a user inspect a product catalog in an interactive 3D scene and ask an AI assistant about that product.

The live interactive 3D experience is implemented for **one product**: `smartphone-001` ("Premium Flagship Smartphone"). The catalog also contains a television (`tv-001`) and a refrigerator (`refrigerator-001`). Those two products have PostgreSQL-backed names, colors, features, and specifications, and they can be selected in the header, but they currently render a **"3D model coming soon"** placeholder. Their AI chat can answer catalog questions but cannot drive viewer actions.

The application is a portfolio-quality product explorer, not a commercial storefront. There is no cart, checkout, authentication, user accounts, or inventory.

### 2. What problem it solves

A conventional product page is 2D: photos, a spec table, and maybe a static 360 spin. That does not show **where** a component lives, how internals relate, or let a user inspect a camera module, battery, or USB-C port in spatial context.

This project solves that by combining:

- A **PostgreSQL-backed product catalog** served by a Spring Boot REST API.
- A **procedural Three.js smartphone** (not a loaded GLTF for the phone) with selectable parts.
- A **single React state model** for selection, camera focus, color, flash, and exploded view.
- An **AI assistant that returns structured actions**, which the React layer executes using those same existing handlers. The model never talks to Three.js.

### 3. What the main user experience is

On load, the React app fetches the catalog from `GET /api/products`, defaults to `smartphone-001`, and shows:

- **Left / main pane:** an interactive 3D canvas. The user can orbit, pan, and zoom the phone.
- **Header:** product tabs for Smartphone, Television, and Refrigerator.
- **Right sidebar:**
  - Product name, description, color swatches.
  - A list of 12 smartphone features.
  - Detail text and specifications for the selected feature.
  - An AI Product Assistant chat box.

Typical interactions:

- Click a **hotspot** or a **feature button** → camera animates to that part, the mesh is highlighted, the sidebar shows specs.
- Click **Exploded View** → layers separate (display, internals, battery, back glass, camera).
- Click **View Full Phone** → camera returns to the overview framing.
- Change **color** → frame and back-glass materials update immediately.
- Click the **flash** a second time while it is already selected → LED turns on/off without changing camera.
- Type **"Show me the camera"** in the AI box → the backend returns a structured `FOCUS_FEATURE` action → React focuses the camera using the same path as a hotspot click.

### 4. Why we chose an interactive 3D product explorer

Supported by the repository itself (`README.md` original intent plus the implemented viewer):

- Spatial understanding of hardware is the product. A chatbot or a spec sheet cannot show that the camera island is on the back-upper-right or that the battery sits behind the back glass.
- The 3D model is the **execution target** for AI. Structured actions are only useful if there is already a deterministic viewer.
- A procedural phone (RoundedBox / cylinders / meshes) keeps the demo independent of a third-party GLTF pipeline. A `frontend/public/models/smart_tv.glb` file exists, but **no GLTF loader is used anywhere in the TypeScript source**.

### 5. How AI fits into the application

AI is a **natural-language control and explanation layer**, not a second product database and not a second 3D engine.

Flow:

1. The user types a sentence in `AiAssistant`.
2. React POSTs `{ productId, message }` to `/api/ai/chat`.
3. Spring Boot loads the product from PostgreSQL.
4. `AiService` builds a catalog-grounded system prompt.
5. `OpenAiChatProvider` calls OpenAI Chat Completions with `response_format: json_object`.
6. The backend parses and **validates** the JSON against allowed actions and real feature IDs.
7. React receives `{ message, action }`. The message is shown in chat. The action is dispatched through `App.handleAiAction`, which calls the same state setters used by UI clicks.

### 6. What makes this different from a normal chatbot

| Normal chatbot | This application |
| --- | --- |
| Free-form text is the product | Text is one output; a **structured action** is the other |
| Model may invent specs | Prompt says: answer only from catalog context; backend still validates IDs |
| Frontend just displays the reply | Frontend **executes** `FOCUS_FEATURE`, `EXPLODE_PRODUCT`, `ASSEMBLE_PRODUCT`, `SHOW_OVERVIEW`, `TOGGLE_FLASH` |
| Model would need scene APIs to move a camera | Model never sees Three.js; React already owns camera, highlight, explode, flash |
| Conversation memory across turns | **No conversation history is sent.** Each request is a single user message plus freshly loaded product context |
| Keyword matching (`if (text.includes("camera"))`) | OpenAI interprets phrasing; backend only allowlists the resulting action |

### 7. Current supported product(s)

| Product ID | Name | In PostgreSQL | Interactive 3D | AI catalog Q&A | AI 3D actions |
| --- | --- | --- | --- | --- | --- |
| `smartphone-001` | Premium Flagship Smartphone | Yes, 12 features | Yes, procedural model | Yes | Yes |
| `tv-001` | Premium 65-inch 4K Smart TV | Yes, 10 features | No (placeholder) | Yes | Rejected by backend |
| `refrigerator-001` | Premium French Door Refrigerator | Yes, 10 features | No (placeholder) | Yes | Rejected by backend |

Capability flags live in `frontend/src/product3DCapabilities.ts`. Viewer-action gating on the backend is hard-coded to `smartphone-001` in `AiService.SMARTPHONE_PRODUCT_ID`.

### 8. Current supported AI capabilities

For `smartphone-001`:

- Answer questions from the **current product catalog row** (name, description, colors, feature descriptions, specifications).
- `FOCUS_FEATURE` — select and camera-focus a catalog feature. Does **not** change exploded/assembled mode.
- `EXPLODE_PRODUCT` — open exploded view, optionally with a `featureId` to focus after exploding.
- `ASSEMBLE_PRODUCT` — close exploded view, optionally with a `featureId` to focus after assembling (example: “show display in assembled mode”).
- `SHOW_OVERVIEW` — same as the View Full Phone button (`overviewNonce`). Does not assemble/explode by itself.
- `TOGGLE_FLASH` — set flash LED on or off via `enabled: true|false`.

For `tv-001` and `refrigerator-001`:

- Catalog Q&A only.
- If the model returns a viewer action, `AiService.validate` replaces it with a null action and the message: *"3D AI interactions are not currently available for this product. I can still answer questions from the product catalog."*

### 9. Current limitations and what is intentionally not implemented

These are visible in the current code; they are not missing accidents unless noted:

- No multi-turn chat memory. `AiAssistant` keeps a local UI transcript but `sendAiChat` sends only the latest message.
- No RAG, embeddings, or vector store. Grounding is the product DTO stuffed into the system prompt.
- No voice input/output.
- No GLTF/GLB loading in code. `smart_tv.glb` is unused.
- No interactive 3D for TV or refrigerator.
- No user auth, rate limiting, or CSRF tokens.
- No shopping / comparison / AR.
- No frontend unit/integration tests (Vitest and Testing Library are in `package.json` but there is no `test` script and no `*.test.ts` / `*.spec.ts` files).
- Backend tests require a **live PostgreSQL** on `localhost:5432`. There is no H2, no Testcontainers.
- `HealthController` returns `{ status: "UP" }` without checking the database or OpenAI.
- CORS is only `http://localhost:5173`.
- OpenAI HTTP 401 and 429 are both mapped to the same user-facing **502** `"AI provider unavailable."`
- Leftover unused Java domain records (`com.productexplorer.domain.*`) from the in-memory catalog phase. Runtime mapping uses JPA entities + DTOs.
- `productApi.getProductFeatures` and `getProductFeature` exist but the UI does not call them.
- `ProductFeatureRepository.findByProduct_IdOrderBySortOrderAsc` is unused; features are loaded via the product aggregate.

---

## Part 2 — Technology stack

Only technologies that actually appear in the repository are listed.

### React (`react` ^19.2.8)

- **Why:** Component UI, local state, and composition of the 3D canvas with HTML overlays.
- **Where:** Entire `frontend/src` tree. Entry is `main.tsx` → `App.tsx`.
- **Communicates with:** TypeScript types; React Three Fiber `<Canvas>` as a React child; `fetch` to Spring Boot.

### TypeScript (`typescript` ~6.0.2)

- **Why:** Typed product/AI contracts matching backend JSON.
- **Where:** All `.ts` / `.tsx` files. Product types in `frontend/src/types/product.ts`; AI types in `frontend/src/types/ai.ts`.
- **Communicates with:** Vite + `tsc -b` during `npm run build`. JSON from the API is asserted into these types (no runtime schema validation on the frontend).

### Vite (`vite` ^8.2.0)

- **Why:** Dev server and bundler for the React SPA.
- **Where:** `frontend/vite.config.ts`, `frontend/index.html`, `npm run dev` / `npm run build`.
- **Communicates with:** Serves the SPA at `http://localhost:5173`. The SPA then calls `http://localhost:8080/api`. Optional `VITE_API_BASE_URL` overrides the API base. There is **no** `VITE_OPENAI_API_KEY`.

### HTML / CSS

- **Why:** Shell page and visual layout.
- **Where:** `frontend/index.html` (`#root`); `frontend/src/index.css` (reset, fonts); `frontend/src/App.css` (layout, hotspots, AI panel, viewer controls).
- **Communicates with:** React classNames. Hotspot HTML is injected into the 3D scene via Drei `<Html>`.

### Three.js (`three` ^0.185.1)

- **Why:** WebGL scene graph, cameras, lights, materials, meshes, animation math.
- **Where:** Imported in `ProductViewer.tsx`, `SmartphoneModel.tsx`, `CameraRig.tsx`, `ExplodedLayer.tsx`. Vector3 lerp, Color lerp, shadow maps, geometries.
- **Communicates with:** React Three Fiber binds Three.js objects to React components. OrbitControls (Drei) mutates the same camera CameraRig animates.

### React Three Fiber (`@react-three/fiber` ^9.7.0)

- **Why:** Declarative React wrapper over Three.js so the phone is a component tree, not an imperative `new THREE.Scene()`.
- **Where:** `<Canvas>` in `ProductViewer.tsx`; `useFrame` / `useThree` in `CameraRig`, `ExplodedLayer`, and the Flash LED.
- **Communicates with:** React props from `App` → `ProductViewer` → `Product3DRenderer` → `SmartphoneModel`. Imperative module refs in `explodedView.ts` bridge Canvas-internal animation with React state.

### OrbitControls (`@react-three/drei`)

- **Why:** User orbit / zoom / pan with damping.
- **Where:** `<OrbitControls makeDefault ...>` in `ProductViewer.tsx`.
- **Communicates with:** `CameraRig` reads `useThree().controls`, lerps `controls.target`, and temporarily copies camera position around `orbit.update()` so min-distance clamping cannot undo a close-up.

### React Three Drei (also used; not just OrbitControls)

Present in `frontend/package.json` as `@react-three/drei` ^10.7.8:

- `ContactShadows` — ground contact shadow under the phone.
- `Html` — HTML hotspot pins in 3D space.
- `Outlines` — selection outline on meshes.
- `RoundedBox` — phone body, display, camera island, battery.

### Java 17

- **Why:** Backend language. `pom.xml` sets `<java.version>17</java.version>`.
- **Where:** `backend/src/main/java/com/productexplorer/**`.
- **Communicates with:** Spring Boot, JDBC/JPA, Jackson JSON.

### Spring Boot 3.3.5

- **Why:** REST API, dependency injection, validation, exception mapping.
- **Where:** `ProductExplorerApplication`, controllers, services, `GlobalExceptionHandler`, `CorsConfig`.
- **Communicates with:** Frontend via HTTP JSON. PostgreSQL via Spring Data JPA. OpenAI via `RestClient`.

### Maven

- **Why:** Build and test the backend.
- **Where:** `backend/pom.xml`. Commands: `mvn test`, `mvn spring-boot:run`.
- **Communicates with:** Compiles Java, runs JUnit 5 tests, packages the Spring Boot JAR.

### Spring Data JPA / Hibernate / Jakarta Persistence

- **Why:** Map tables to entities; `ddl-auto=validate` so Flyway owns schema.
- **Where:** `entity/*`, `repository/*`, `ProductService`.
- **Communicates with:** PostgreSQL through the datasource in `application.properties`. `FetchMode.SUBSELECT` loads colors/features/specs without Open-in-View (`spring.jpa.open-in-view=false`).

### Flyway

- **Why:** Versioned SQL migrations instead of Hibernate creating tables.
- **Where:** `backend/src/main/resources/db/migration/V1__create_product_catalog.sql`, `V2__seed_additional_products.sql`. Enabled in `application.properties`.
- **Communicates with:** Runs on Spring Boot startup against PostgreSQL.

### PostgreSQL 16

- **Why:** Persistent product catalog. Replaced the deleted in-memory `ProductCatalog.java` (commit `bc6d494`).
- **Where:** `docker-compose.yml` service `postgres`; JDBC URL `jdbc:postgresql://localhost:5432/product_explorer`.
- **Communicates with:** Spring datasource. Frontend never talks to Postgres.

### OpenAI API

- **Why:** Interpret natural language into catalog-grounded JSON `{ message, action }`.
- **Where:** `OpenAiChatProvider` POSTs to `{baseUrl}/chat/completions` (default `https://api.openai.com/v1`). Model default `gpt-4o-mini`. Temperature `0.2`. `response_format.type = json_object`.
- **Communicates with:** Backend only. The React app never holds the API key.

### REST APIs + JSON

- **Why:** Contract between SPA and backend.
- **Where:** Product GET endpoints, `POST /api/ai/chat`, `GET /api/health`. Jackson (via `spring-boot-starter-web`) serializes Java records to JSON. Frontend `fetch` + `response.json()`.
- **Communicates with:** CORS on `/api/**` from `http://localhost:5173`.

### Docker Compose

- **Why:** Local PostgreSQL 16 with healthcheck and named volume.
- **Where:** `docker-compose.yml`. Database `product_explorer`, user/password `product_explorer` (local-dev defaults committed in-repo).

### Jakarta Validation

- **Why:** Reject blank AI chat bodies.
- **Where:** `AiChatRequest` `@NotBlank` on `productId` and `message`; `AiController` `@Valid`. Invalid requests become 400 `"Invalid request."`

### Jackson `ObjectMapper`

- **Why:** Parse OpenAI message content (which is itself a JSON string) into `AiChatResponse`.
- **Where:** Injected into `AiService` and `OpenAiChatProvider`.

### Not in the codebase (do not claim these)

Redux/Zustand, Next.js, GraphQL, Redis, Kafka, WebSockets, Spring Security / OAuth, H2, Testcontainers, WebGL raw shaders beyond `meshPhysicalMaterial` / `meshStandardMaterial` / `meshBasicMaterial`, `useGLTF` / `GLTFLoader`, `VITE_OPENAI_API_KEY`.

---

## Part 3 — Complete architecture

```
User
  ↓
React UI  (App.tsx)
  ↓
3D Viewer and/or AI Assistant
  ↓
Spring Boot REST API
  ↓
PostgreSQL          and/or          OpenAI API
  ↓                                    ↓
Product JSON                     Structured JSON {message, action}
  ↓                                    ↓
React state                        React action execution
  ↓
Three.js / React Three Fiber
  ↓
3D model (procedural smartphone)
```

### Step by step

**User.** Interacts with HTML (feature list, color swatches, explode/reset buttons, AI form) or with the WebGL canvas (orbit, mesh click, hotspot pin).

**React UI.** `App` owns explorer session state: selected product, selected feature, color, flash, exploded, camera nonces. `useProduct` owns catalog loading. `AiAssistant` owns chat transcript, input, AI loading/error.

**3D Viewer / AI Assistant.** Two sibling consumers of App state:

- `ProductViewer` writes `explodedView.cameraCommand`, `explodedMode`, and `flashLit` every render, then R3F animates.
- `AiAssistant` does not touch Three.js. After a successful POST it calls `onAction(response.action)`.

**Spring Boot REST API.** Controllers are thin. `ProductController` / `AiController` / `HealthController`. Business logic is in services.

**PostgreSQL.** Source of truth for products, colors, features, positions, camera positions, specifications. Flyway seeds three products.

**OpenAI API.** Receives system prompt + one user message. Returns a JSON object as the assistant `content`. The backend does not trust that JSON until `AiService.validate`.

**Structured AI response.** `{ "message": string, "action": null | { type, featureId?, enabled? } }`. Unknown types become `action: null`. Unknown feature IDs for `FOCUS_FEATURE` become a canned message and null action.

**React action execution.** `handleAiAction` switches on `action.type` and calls existing setters (`selectFeature`, `setFocusNonce`, `setExploded`, `setFlashOn`, `setPendingExplodedFocus`). Capability flags can no-op an action.

**Three.js / R3F.** `CameraRig` lerps camera + orbit target. `ExplodedLayer` lerps layer offsets. `SmartphoneModel` highlights meshes, ghosts frame/back glass for internals, pulses the flash LED.

**3D model.** Named Three.js groups (`camera`, `battery`, `flash`, …) that match `ProductFeature.modelNodeName`.

### Who owns what

| Responsibility | Owner |
| --- | --- |
| Catalog fetch, selected product/feature | `useProduct` |
| Color, flash, exploded, camera nonces, AI dispatch | `App` |
| Chat UI and HTTP to `/api/ai/chat` | `AiAssistant` + `aiApi` |
| Canvas, lights, orbit, wiring cameraCommand | `ProductViewer` |
| Which 3D renderer to use | `Product3DRenderer` + `product3DCapabilities` |
| Procedural meshes, click on parts, flash animation | `SmartphoneModel` |
| HTML pins | `FeatureHotspots` |
| Camera lerp | `CameraRig` |
| Layer explode lerp | `ExplodedLayer` |
| Focus presets | `cameraOverview.ts` |
| Explode offsets + command bus | `explodedView.ts` |
| REST product API | `ProductController` → `ProductService` → JPA → `ProductMapper` |
| REST AI API | `AiController` → `AiService` → `ProductService` + `AiProvider` |
| OpenAI HTTP | `OpenAiChatProvider` |
| Schema + seed | Flyway SQL |
| HTTP error JSON | `GlobalExceptionHandler` |
| CORS | `CorsConfig` |

---

## Part 4 — Frontend structure

Root: `frontend/src`. Entry: `main.tsx` mounts `<App />` in StrictMode.

### State flow (important)

```
useProduct
  products, selectedProductId, product, selectedFeature, loading, error
       ↓
App
  selectedColor, flashOn, exploded, focusNonce, overviewNonce, pendingFocusMode
       ↓
  ProductViewer  ← 3D props
  FeaturePanel   ← details + color + feature buttons
  AiAssistant    ← productId, onAction → handleAiAction → same App setters
```

There is no global store. Capability gating happens in `App` before props are passed (`selectedFeature` is forced `null` when `featureFocus` is false).

---

### `App.tsx`

- **Responsibility:** Shell layout, session state, AI action orchestration, loading/error/empty screens.
- **Important state:** from `useProduct` plus `focusNonce`, `overviewNonce`, `selectedColor`, `flashOn`, `exploded`, `pendingFocusMode` (`'exploded' | 'assembled' | null`).
- **Important functions:**
  - `handleSelectProduct` — resets flash/explode/color/nonces, then `selectProduct`.
  - `handleSelectFeature` — no-op without `featureFocus`; second click on flash toggles LED; otherwise selects feature and bumps `focusNonce`.
  - `handleSelectColor` — sets color.
  - `handleResetView` — bumps `overviewNonce`.
  - `handleAiAction` — switch on structured action types.
- **Props:** none (root).
- **Dependencies:** `useProduct`, `getProduct3DCapabilities`, `AiAssistant`, `FeaturePanel`, `ProductSelector`, `ProductViewer`.
- **Called by:** `main.tsx`.
- **Calls:** child components and hook.
- **Why it exists:** Single place where UI clicks and AI actions converge so the 3D viewer has one input model.

The `pendingFocusMode` effect: if AI asks to explode **or assemble** and also focus a part, the mode flag is set first. Camera offsets are only correct after `exploded` matches the target mode. The effect then increments `focusNonce`.

`ProductViewer` is keyed by `selectedProductId` so the Canvas remounts on product change.

---

### `main.tsx`

- Mounts React 19 `createRoot` on `#root` with `StrictMode`.
- Imports `index.css`.

---

### `components/ProductViewer.tsx`

- **Responsibility:** R3F Canvas: background, lights, ground plane, model, CameraRig, ContactShadows, OrbitControls, explode/reset overlay buttons.
- **Props:** `product`, `selectedFeature`, `selectedColor`, `flashOn`, `exploded`, `onSelectFeature`, `onExplodedChange`, `onResetView`, `focusNonce`, `overviewNonce`.
- **Important functions:** `handleToggleExploded`, `handleSelectNode` (maps mesh `nodeName` → feature via `modelNodeName`).
- **State:** none. Writes module-level `explodedMode`, `flashLit`, `cameraCommand` every render.
- **Dependencies:** R3F Canvas, Drei, THREE, `CameraRig`, `cameraOverview`, `Product3DRenderer`, `explodedView`, `product3DCapabilities`.
- **Called by:** `App`.
- **Calls:** `Product3DRenderer`, `CameraRig`, `ProductModelPlaceholder` when `interactiveModel` is false.
- **Why it exists:** Isolates WebGL from the HTML chrome.

OrbitControls: `minDistance={0.35}`, `maxDistance={14}`, damping `0.08`, `makeDefault` so `useThree().controls` is this instance.

---

### `components/Product3DRenderer.tsx`

- **Responsibility:** Product-id switch. Smartphone renders model + hotspots. TV, refrigerator, unknown render `null` (placeholder is outside the Canvas).
- **Functions:** `getProduct3DRendererId(productId)` → `'smartphone' | 'tv' | 'refrigerator' | 'none'`.
- **Also exports:** `ProductModelPlaceholder`.
- **Props:** product, selected node/color/feature, exploded, `onSelectNode`, `onSelectFeature`.
- **Called by:** `ProductViewer`.
- **Calls:** `SmartphoneModel`, `FeatureHotspots`.
- **Why it exists:** Prevents TV/fridge from accidentally using the phone mesh. Added in the AI/multi-product commit.

---

### `components/SmartphoneModel.tsx`

- **Responsibility:** Procedural flagship phone: frame, display, back glass, camera island + three lenses, flash LED, action/volume/power buttons, USB-C, speaker, microphone, battery, processor.
- **Props:** `selectedNodeName`, `selectedColor`, `onSelectNode`.
- **Important internals:**
  - `internalsOpen` when selected node is `battery` or `processor` — frame and back glass become transparent so internals are visible.
  - `SelectablePart` — click/hover with `event.stopPropagation()`; in exploded mode only nodes in `EXPLODED_HOTSPOT_NODES` remain clickable.
  - `usePartLook` — selected emissive blue; unselected parts dim toward gray.
  - `Flash` — `useFrame` pulses LED, glow sphere, and point light from `flashLit.current`.
- **Called by:** `Product3DRenderer`.
- **Calls:** `ExplodedLayer`, `getPhoneAppearance`.
- **Why it exists:** The actual 3D product. Node `name` attributes are the join key to catalog `modelNodeName`.

---

### `components/FeatureHotspots.tsx`

- **Responsibility:** One Drei `<Html sprite>` pin per feature (subset in exploded mode).
- **Props:** `features`, `selectedFeatureId`, `exploded`, `onSelectFeature`.
- **State:** per-pin `hovered`.
- **Position:** `resolveHotspotPosition(feature)` (lookAt override, not raw DB `position`, so camera and flash pins sit on the actual meshes).
- **Click isolation:** outer Html `pointerEvents: 'none'`; only the button has `pointerEvents: 'auto'`. `zIndexRange={[20, 0]}`. `occlude={false}`.
- **Called by:** `Product3DRenderer`.
- **Calls:** `ExplodedLayer` so pins travel with exploded layers.
- **Why it exists:** Discoverability without requiring the user to click tiny meshes.

---

### `components/FeaturePanel.tsx`

- **Responsibility:** Sidebar product copy, `ColorSelector`, feature buttons (if `featureFocus`), selected feature description + specs.
- **Props:** `product`, `selectedFeature`, `selectedColor`, `capabilities`, `onSelectFeature`, `onSelectColor`.
- **Called by:** `App`.
- **Calls:** `ColorSelector`.
- **Why it exists:** Non-3D inspection UI. For TV/fridge, feature buttons are hidden and the placeholder says 3D exploration is coming soon. Color swatches still show because they come from the catalog.

---

### `components/ColorSelector.tsx`

- **Responsibility:** Accessible color radiogroup with arrow-key navigation.
- **Props:** `colors`, `selectedColor`, `onSelectColor`.
- **Swatches:** phone colors from `getPhoneAppearance`; TV/fridge names from `GENERIC_SWATCHES`.
- **Called by:** `FeaturePanel`.
- **Why it exists:** Color is React state feeding materials; it is not an AI action.

---

### `components/CameraRig.tsx`

- **Responsibility:** Animate perspective camera and OrbitControls target. Renders `null`.
- **No props.** Reads `cameraCommand` and `explodedMode` from `explodedView.ts`.
- **Behavior:**
  - On first controls availability, snap to overview (or exploded overview).
  - Each frame: if exploded flag changed, either keep feature focus (if a feature is selected) or go to exploded/assembled overview.
  - If `overviewNonce` changes, animate to overview.
  - If `focusNonce` or `featureId` changes, animate to `cameraPosition` / `lookAt`.
  - Exponential lerp `1 - exp(-3.4 * delta)`.
  - Clamps `orbit.minDistance` to at most `0.35` and restores lerped camera position after `orbit.update()` so OrbitControls cannot push the camera back.
- **Called by:** `ProductViewer` inside Canvas.
- **Why it exists:** Camera motion must run on the R3F frame loop, not in React render.

---

### `components/ExplodedLayer.tsx`

- **Responsibility:** Wrap children in a group whose position lerps between `[0,0,0]` and a layer offset when `explodedMode.current` is true. Exponential lerp `1 - exp(-4.4 * delta)`.
- **Props:** optional `name`, `offset`, `children`.
- **Called by:** `SmartphoneModel` (six layers) and `FeatureHotspots` (one wrapper per pin).
- **Why it exists:** Shared explode animation for meshes and HTML pins.

---

### `components/cameraOverview.ts`

- **Responsibility:** Overview camera constants (`OVERVIEW_CAMERA`, `OVERVIEW_TARGET`, `OVERVIEW_FOV = 30`) and per-feature **focus overrides**.
- **Functions:**
  - `resolveHotspotPosition(feature)` — override `lookAt` or DB `feature.position`.
  - `resolveFeatureFocus(feature, exploded)` — assembled override or DB `cameraPosition`/`position`; if exploded, offset lookAt and compute exploded eye via `resolveExplodedCamera`.
- **Why it exists:** DB camera coordinates are a first draft. Close-ups were tuned in the frontend because the procedural mesh layout is owned by the frontend.

---

### `components/explodedView.ts`

- **Responsibility:** Shared mutable command bus + explode math.
- **Exports:**
  - `explodedMode = { current: boolean }`
  - `flashLit = { current: boolean }`
  - `cameraCommand` `{ focusNonce, overviewNonce, featureId, cameraPosition, lookAt }`
  - `EXPLODED_CAMERA` / `EXPLODED_TARGET`
  - `EXPLODED_OFFSETS` for layers `frame`, `display`, `internals`, `battery`, `backGlass`, `camera`
  - `EXPLODED_HOTSPOT_NODES` = display, battery, processor, frame, camera, flash
  - `getExplodedOffset`, `offsetExplodedPosition`, `resolveExplodedCamera`
- **Why it exists:** R3F `useFrame` cannot cheaply subscribe to React props for every animation without extra rerenders; ProductViewer writes these objects during render, CameraRig/Flash/ExplodedLayer read them every frame.

---

### `phoneAppearance.ts`

- Maps color names `Natural | Black | Silver | Blue` to frame/back-glass colors and PBR factors. Unknown names fall back to Natural.
- Called by `SmartphoneModel` and `ColorSelector`.

---

### `product3DCapabilities.ts`

Per-product boolean flags:

```
interactiveModel, hotspots, featureFocus, explodedView, flash, colorCustomization
```

Only `smartphone-001` is all `true`. `tv-001`, `refrigerator-001`, and unknown IDs are all `false`.

---

### `hooks/useProduct.ts`

- **State:** `products`, `selectedProductId` (default `smartphone-001`), `product`, `selectedFeature`, `loading`, `error`, `retryCount`.
- **Functions:**
  - `loadCatalog` — `getProducts()`, pick preferred or default or first.
  - `selectProduct` — optimistic cache hit, then `getProduct(id)` with a request-id guard against races.
  - `selectFeature` — set feature.
  - `retry` — increments `retryCount` to reload catalog.
- **Called by:** `App`, `ProductSelector` (imports `DEFAULT_PRODUCT_ID` for tab order).
- **Calls:** `productApi.getProducts`, `getProduct`.

---

### `services/productApi.ts`

- Base URL: `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'`.
- `getProducts`, `getProduct`, `getProductFeatures`, `getProductFeature`.
- Non-OK responses throw `API request failed with status ${status}` (no JSON message parsing).

---

### `services/aiApi.ts`

- Same base URL.
- `sendAiChat(productId, message)` POST `/ai/chat` with JSON body.
- Non-OK: tries to parse `{ message }` from the error body (so 502/503/504 text from the backend is shown in the AI panel).

---

### `types/product.ts`

Frontend mirrors of backend DTOs: `Position`, `FeatureSpecification`, `ProductFeature`, `Product`.

### `types/ai.ts`

```ts
AiActionType = 'FOCUS_FEATURE' | 'EXPLODE_PRODUCT' | 'ASSEMBLE_PRODUCT' | 'TOGGLE_FLASH' | 'SHOW_OVERVIEW'
AiAction { type, featureId?, enabled? }
AiChatResponse { message, action }
```

There is no frontend `AiChatRequest` type; the POST body is inline.

---

### `components/ProductSelector.tsx`

Header tabs. Orders `smartphone-001` first. `role="tablist"`. Called by `App`.

---

### `components/AiAssistant.tsx`

- **State:** `messages`, `input`, `loading`, `error`.
- **Resets** transcript when `productId` changes (`key={product.id}` on the component also remounts it from App).
- **Submit:** append user bubble, `sendAiChat`, append assistant `response.message`, `onAction(response.action)`.
- **Does not** send prior messages to the backend.
- **Props:** `productId`, `viewerActionsAvailable`, `onAction`.
- Copy changes when 3D actions are unavailable.

---

### Other frontend files

| File | Role |
| --- | --- |
| `App.css` | Layout, hotspots, AI chat, viewer buttons |
| `index.css` | Global reset |
| `index.html` | Title "3D Product Explorer", `#root` |
| `vite.config.ts` | `@vitejs/plugin-react` only |
| `package.json` | Scripts `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`. No `test` script |

---

## Part 5 — 3D architecture

### Canvas

`ProductViewer` creates `<Canvas shadows dpr={[1,2]} gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}`. On create, `gl.shadowMap.type = THREE.PCFShadowMap`. Initial camera position `OVERVIEW_CAMERA` `(1.55, 0.38, 5.15)`, FOV `30`.

### Scene

R3F implicit scene. Background color `#d7dee6`. Ground plane `18×18` at y `-1.05`. `ContactShadows` at y `-1.04`.

### Camera

Perspective camera owned by Canvas. `CameraRig` animates `camera.position` and `controls.target`, then `camera.lookAt(orbit.target)`.

### Lights

- Hemisphere `#f7f9fb` / `#c5ced8` intensity `0.82`
- Ambient `0.48`
- Key directional `(4.2, 7.2, 5)` intensity `1.52`, casts shadow, 1024 map
- Fill directional `(-5, 3.2, 2.4)` `0.58`
- Rim directional `(1.8, 2.4, -5.5)` `1.28` color `#e7eef6`
- Spot `(-2.2, 5.4, 3.2)`
- Flash `pointLight` inside the Flash group when `flashLit` is on (distance `1.6`, color `#fff1b8`)

### Materials

Mostly `meshPhysicalMaterial` (frame, display, back glass, lens glass) and `meshStandardMaterial` (buttons, battery, processor, camera island). Flash on-state uses `meshBasicMaterial` overlays (`toneMapped={false}`) plus emissive LED.

### Meshes

Constructed in JS: `RoundedBox`, `boxGeometry`, `cylinderGeometry`, `sphereGeometry`. No imported phone mesh.

### GLTF / model loading

**Not used.** Grep finds no `useGLTF`, `GLTFLoader`, or references to `smart_tv.glb` in TS/JS. The GLB file is in `frontend/public/models/` from the AI-era commit but is not loaded.

### OrbitControls

User can pan, zoom, rotate. Damping on. Target initialized to `OVERVIEW_TARGET` `(0, 0.12, 0)`. `minDistance` 0.35 (originally 2.1 in the first 3D commit, which blocked close-ups).

### CameraRig

Described in Part 4. Dual input: user OrbitControls when `animating` is false; scripted lerp when a nonce or explode flag changes.

### Hotspots

HTML pins at resolved lookAt points. In exploded view only six pins remain. Pins are parented to `ExplodedLayer` with the same offset as their mesh layer.

### Feature highlighting

`usePartLook`: selected mesh gets emissive `#3b82f6` and Drei `<Outlines thickness={2.6} color="#9ad0ff" />`. Other parts lerp color toward `#8b939d`.

### Camera presets and transitions

Assembled presets: `FEATURE_FOCUS_OVERRIDES` in `cameraOverview.ts` for all 12 smartphone nodes. Fallback: API `cameraPosition` / `position`.

Exploded presets: lookAt += layer offset; eye = lookAt + `EXPLODED_EYE_FROM_LOOKAT[node]` when defined.

Transitions are frame-loop lerps, not camera.position.set snaps (except initial overview snap).

### Exploded view vs assembled view

`App.exploded` → `ProductViewer` sets `explodedMode.current`. `ExplodedLayer` targets offsets or origin. Overview camera switches between `OVERVIEW_*` and `EXPLODED_*`. UI button labels "Exploded View" / "Assembled View". AI `ASSEMBLE_PRODUCT` sets `exploded` false and may also focus a `featureId`. `SHOW_OVERVIEW` only bumps `overviewNonce` (same as View Full Phone).

### Flash behavior

Two separate systems:

1. **Focus flash** (`FOCUS_FEATURE` / hotspot / feature list): selects the flash node, cameras in, highlights the LED mesh. `handleSelectFeature` also sets `flashOn` true on first select.
2. **Toggle flash** (`TOGGLE_FLASH` or second click on already-selected flash): flips `flashOn` → `flashLit.current`. `Flash` `useFrame` animates intensity. AI "show me the flash" is instructed **not** to use `TOGGLE_FLASH`.

### Color switching

`selectedColor` → `getPhoneAppearance` → frame and back-glass materials. Not an AI action. Changing product resets color to `defaultColor`.

### Internal components / battery / processor visibility

Battery and processor meshes always exist (inside exploded layers). In assembled view they are buried inside the solid frame. Selecting `battery` or `processor` sets `internalsOpen`, which:

- Makes the frame `opacity 0.16`, `transparent`, `depthWrite false`, lower metalness.
- Makes back glass `opacity 0.2`.

That is how internals become visible without a true cutaway boolean.

### How model nodes are identified

1. Catalog `product_features.model_node_name` (and usually `id` with the same slug).
2. Three.js `<group name={nodeName}>` in `SelectablePart`.
3. `handleSelectNode` finds `product.features.find(f => f.modelNodeName === nodeName)`.
4. Camera overrides keyed by `modelNodeName` then `id`.

Smartphone node names in the model: `frame`, `display`, `camera`, `flash`, `action-button`, `volume-buttons`, `power-button`, `usb-c`, `speaker`, `microphone`, `battery`, `processor`. Nested names like `camera-lens-main` are visual only; they are not catalog IDs.

### Clicking a hotspot → camera focus

```
Hotspot onClick
  → onSelectFeature(feature)          // FeatureHotspots
    → App.handleSelectFeature
      → selectFeature(feature)        // useProduct
      → setFocusNonce(n+1)
        → ProductViewer re-renders
          → resolveFeatureFocus(feature, exploded)
          → cameraCommand.{focusNonce, featureId, cameraPosition, lookAt}
            → CameraRig useFrame sees nonce/id change
              → lerp camera + orbit target
        → SmartphoneModel selectedNodeName matches feature.modelNodeName
          → highlight + possible internalsOpen
        → FeaturePanel shows description/specs
```

### AI-triggered focus uses the same 3D systems

```
AiAssistant onAction({ type: 'FOCUS_FEATURE', featureId: 'camera' })
  → App.handleAiAction
    → product.features.find(id === 'camera')
    → selectFeature(feature)
    → setFocusNonce(n+1)
```

That is the same pair of state updates as `handleSelectFeature`. There is no second camera API, no `scene.getObjectByName` from the AI layer, and no OpenAI tool that returns x/y/z. The model only returns a feature ID the catalog already has.

---

## Part 6 — Product data model

### Runtime API shape (what React consumes)

Defined by backend DTOs and `frontend/src/types/product.ts`:

**Product**

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Primary key, e.g. `smartphone-001` |
| `name` | string | Display name |
| `description` | string | Marketing/concept copy |
| `category` | string | `Smartphone`, `Television`, `Refrigerator` |
| `defaultColor` | string | Initial swatch |
| `availableColors` | string[] | Ordered by `product_colors.sort_order` |
| `features` | ProductFeature[] | Ordered by `sort_order` |

**ProductFeature**

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable ID used by AI and UI selection |
| `name` | string | Human label ("Camera System") |
| `description` | string | Catalog paragraph |
| `category` | string | Feature grouping (Hardware, Camera, Internal, …) |
| `modelNodeName` | string | Three.js group name |
| `position` | `{x,y,z}` | Default hotspot / lookAt from DB |
| `cameraPosition` | `{x,y,z}` | Default eye from DB |
| `specifications` | `{name,value}[]` | Spec list |

Java also has unused domain records `com.productexplorer.domain.Product` / `ProductFeature` / `Position` / `FeatureSpecification` with the same fields. They are **not referenced** by `ProductService` after the JPA migration. Persistence uses `*Entity` classes.

### Why IDs are important

- AI `FOCUS_FEATURE.featureId` must match a catalog id (or be resolved from name / `modelNodeName` by `AiService.resolveFeatureId`).
- React `handleAiAction` looks up `product.features.find(item => item.id === action.featureId)`.
- Hotspots use `feature.id` as React keys and selected comparison.
- Composite DB key is `(product_id, id)` so `camera` can exist on both phone and TV without colliding.

If the model invents `warp-drive`, validation replaces the action with null and the message *"That component is not available on this product."*

### The 12 smartphone features

From `V1__create_product_catalog.sql` / `ProductControllerTest` (size 12):

| sort | id | name | category | modelNodeName | notable specs |
| --- | --- | --- | --- | --- | --- |
| 1 | `display` | Display | Hardware | `display` | OLED, 1-120 Hz adaptive, 2000 nits |
| 2 | `camera` | Camera System | Camera | `camera` | 48 MP wide, 12 MP ultra wide, 5x telephoto |
| 3 | `flash` | Flash | Camera | `flash` | True Tone LED; Auto/On/Off |
| 4 | `frame` | Titanium Frame | Design | `frame` | Grade 5 titanium, IP68 |
| 5 | `action-button` | Action Button | Controls | `action-button` | Press and hold; configurable |
| 6 | `volume-buttons` | Volume Buttons | Controls | `volume-buttons` | Dual-button rocker |
| 7 | `power-button` | Power Button | Controls | `power-button` | Power/lock; side fingerprint |
| 8 | `usb-c` | USB-C Port | Connectivity | `usb-c` | USB-C 3.2, 27W, 10 Gbps |
| 9 | `speaker` | Speaker | Audio | `speaker` | Stereo, spatial audio |
| 10 | `microphone` | Microphone | Audio | `microphone` | Multi-mic beamforming |
| 11 | `battery` | Battery | Internal | `battery` | Li-ion, ~4000 mAh, MagSafe compatible |
| 12 | `processor` | Processor | Internal | `processor` | 6-core CPU, 5-core GPU, 16-core Neural Engine |

DB `position` / `camera_*` values exist for all 12. The **viewer prefers frontend overrides** in `FEATURE_FOCUS_OVERRIDES` for framing quality.

### TV and refrigerator (catalog only)

TV (`tv-001`) 10 features: `display`, `hdmi-ports`, `usb-port`, `speakers`, `power-button`, `remote-sensor`, `wifi`, `ethernet-port`, `processor`, `stand`. Colors: Graphite, Silver, Midnight, Ivory.

Refrigerator (`refrigerator-001`) 10 features: `freezer`, `refrigerator-compartment`, `water-dispenser`, `ice-maker`, `door`, `compressor`, `temperature-controls`, `shelves`, `door-alarm`, `interior-light`. Colors: Stainless Steel, Black Stainless, White, Slate.

These IDs are valid for catalog Q&A. They are not wired to a 3D renderer.

---

## Part 7 — PostgreSQL

### How it is run

`docker-compose.yml`: image `postgres:16`, container `product-explorer-db`, DB/user/password `product_explorer`, port `5432`, volume `product_explorer_pgdata`, healthcheck `pg_isready`.

### Connection configuration

`backend/src/main/resources/application.properties`:

```
spring.datasource.url=jdbc:postgresql://localhost:5432/product_explorer
spring.datasource.username=product_explorer
spring.datasource.password=product_explorer
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

These are local development credentials committed in the repo (not production secrets). There is no separate `application-test.properties`. Tests use this same database.

### Why PostgreSQL

Commit `bc6d494` deleted `ProductCatalog.java` (in-memory seed) and introduced JPA + Flyway. Goals visible in that change:

- Persist the same API contract.
- Add TV and refrigerator rows without Java seed classes.
- Keep schema in SQL migrations.

### Access technology

**Spring Data JPA** (`JpaRepository`), Hibernate as JPA provider, PostgreSQL JDBC driver. Not raw JDBC templates. Not MyBatis.

### Tables (actual)

#### `products`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | VARCHAR(64) PK | |
| `name` | VARCHAR(255) NOT NULL | |
| `description` | TEXT NOT NULL | |
| `category` | VARCHAR(64) NOT NULL | |
| `default_color` | VARCHAR(64) NOT NULL | |

#### `product_colors`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | BIGSERIAL PK | |
| `product_id` | VARCHAR(64) FK → products ON DELETE CASCADE | |
| `color_name` | VARCHAR(64) | unique per product |
| `sort_order` | INT | unique per product |

Index: `idx_product_colors_product_id`.

#### `product_features`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | VARCHAR(64) | part of composite PK |
| `product_id` | VARCHAR(64) | part of composite PK, FK cascade |
| `name`, `description`, `category` | | |
| `model_node_name` | VARCHAR(128) | |
| `sort_order` | INT unique per product | |
| `position_x/y/z` | DOUBLE PRECISION | |
| `camera_x/y/z` | DOUBLE PRECISION | |

PK `(product_id, id)`. Index `idx_product_features_product_id`.

#### `feature_specifications`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | BIGSERIAL PK | |
| `product_id`, `feature_id` | composite FK → product_features | |
| `name` | VARCHAR(128) | |
| `value` | VARCHAR(255) | |
| `sort_order` | INT unique per feature | |

Index `idx_feature_specifications_feature`.

No other tables exist in migrations (no users, no chat history, no Flyway custom table besides Flyway’s own `flyway_schema_history`).

### Relationships

```
products 1 ──< product_colors
products 1 ──< product_features
product_features 1 ──< feature_specifications
```

JPA: `ProductEntity` OneToMany colors + features (`FetchMode.SUBSELECT`, `@OrderBy sortOrder`). `ProductFeatureEntity` `@IdClass(ProductFeatureId)` ManyToOne product, OneToMany specifications.

### How data is inserted

Flyway `INSERT` statements in V1 (smartphone) and V2 (TV + refrigerator). There is no admin API and no runtime insert path in Java.

### How data is retrieved

`ProductRepository.findAllByOrderByIdAsc()` / `findById`. `ProductFeatureRepository.findByProduct_IdAndId` for single feature. Mapper converts entities to records. Nested collections are initialized in the `@Transactional(readOnly = true)` service method (`open-in-view` is false, so mapping cannot happen lazily in the controller).

### How the frontend receives it

```
React useProduct
  → GET /api/products
  → ProductController.getAllProducts
  → ProductService.getAllProducts
  → ProductRepository
  → PostgreSQL
  → ProductMapper.toResponse
  → JSON array of ProductResponse
  → setProducts / setProduct
```

Jackson field names match the TypeScript interfaces (`defaultColor`, `availableColors`, `modelNodeName`, `cameraPosition`).

---

## Part 8 — Spring Boot backend

Package root: `com.productexplorer`.

### Application

`ProductExplorerApplication` — `@SpringBootApplication`, port **8080**.

### Maven (`backend/pom.xml`)

Parent Spring Boot 3.3.5. Dependencies: `starter-web`, `starter-validation`, `starter-data-jpa`, `postgresql` (runtime), `flyway-core`, `flyway-database-postgresql`, `starter-test`. Java 17.

### Configuration classes

| Class | Role |
| --- | --- |
| `CorsConfig` | `/api/**` from `http://localhost:5173`, methods GET POST PUT DELETE OPTIONS, headers `*` |
| `AiConfig` | `@EnableConfigurationProperties(AiProperties.class)` |
| `AiProperties` | `ai.openai.{apiKey, model, baseUrl, timeoutSeconds}`; `isConfigured()` if apiKey non-blank |

`application.properties` AI block:

```
ai.openai.api-key=${OPENAI_API_KEY:}
ai.openai.model=${AI_OPENAI_MODEL:gpt-4o-mini}
ai.openai.base-url=https://api.openai.com/v1
ai.openai.timeout-seconds=20
```

`.vscode/launch.json` loads workspace `.env` into the Spring Boot process. `.env` is gitignored; `.env.example` has empty `OPENAI_API_KEY`.

### Controllers

#### `HealthController`

| Method | URL | Request | Response | Purpose | Frontend caller |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | none | `{ "status": "UP" }` | Liveness of the HTTP process | none in the SPA (documented for curl) |

Does not check Postgres or OpenAI.

#### `ProductController` `@RequestMapping("/api/products")`

| Method | URL | Request | Response | Purpose | Frontend caller |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/products` | none | `ProductResponse[]` | Full catalog | `getProducts()` via `useProduct.loadCatalog` |
| GET | `/api/products/{productId}` | path id | `ProductResponse` | One product with features | `getProduct()` via `useProduct.selectProduct` |
| GET | `/api/products/{productId}/features` | path | `ProductFeatureResponse[]` | Feature list | `getProductFeatures()` **unused by UI** |
| GET | `/api/products/{productId}/features/{featureId}` | path | `ProductFeatureResponse` | One feature | `getProductFeature()` **unused by UI** |

404 body: `{ "status": 404, "message": "Product not found: …" }` or `"Feature not found: … for product: …"`.

#### `AiController` `@RequestMapping("/api/ai")`

| Method | URL | Request | Response | Purpose | Frontend caller |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/ai/chat` | `{ "productId", "message" }` both `@NotBlank` | `{ "message", "action" }` | Catalog-grounded chat + optional viewer action | `sendAiChat` |

`action` may be JSON `null`. `AiActionResponse` uses `@JsonInclude(NON_NULL)` so unused `featureId`/`enabled` are omitted.

### Services

**`ProductService`** — read-only transactional. `findProduct` or 404. Maps via `ProductMapper`.

**`AiService`** — `chat(productId, message)`: load product, `aiProvider.complete(systemPrompt, trimmed message)`, parse, validate.

**`AiProvider`** — interface `complete(systemPrompt, userMessage)`.

**`OpenAiChatProvider`** — production `AiProvider`. JDK `HttpClient` connect timeout 5s, read timeout `timeoutSeconds` (min 1). Bearer auth. Parses `choices[0].message.content`.

### Repositories

- `ProductRepository extends JpaRepository<ProductEntity, String>` + `findAllByOrderByIdAsc`
- `ProductFeatureRepository extends JpaRepository<ProductFeatureEntity, ProductFeatureId>` + `findByProduct_IdAndId`, unused `findByProduct_IdOrderBySortOrderAsc`

No `ProductColorRepository`; colors are children of `ProductEntity`.

### Mapper / DTOs

`ProductMapper` entity → `ProductResponse` / `ProductFeatureResponse` / `PositionResponse` / `FeatureSpecificationResponse`.

AI DTOs: `AiChatRequest`, `AiChatResponse`, `AiActionResponse` with factories `of`, `focus`, `explode`, `flash`.

### Exception handling

`GlobalExceptionHandler`:

- `ResourceNotFoundException` → 404
- `AiServiceException` → `ex.getStatus()` (503 / 502 / 504)
- `MethodArgumentNotValidException` → 400 `"Invalid request."`

Unhandled exceptions (e.g. datasource failure after startup) fall through to Spring Boot default error JSON. **Needs verification** for the exact body the frontend would show if Postgres dies mid-request; the SPA product client only surfaces HTTP status, not Spring’s `message` field.

### Complete product request lifecycle

```
React useProduct.loadCatalog
  → productApi.getProducts
  → fetch GET http://localhost:8080/api/products
  → CorsConfig allows origin 5173
  → ProductController.getAllProducts
  → ProductService.getAllProducts
  → ProductRepository.findAllByOrderByIdAsc
  → PostgreSQL SELECT products (+ subselect colors/features/specs)
  → ProductMapper.toResponse
  → JSON
  → setProducts / setProduct
  → App renders ProductViewer + FeaturePanel
```

### Complete AI request lifecycle (see also Part 9)

```
AiAssistant.handleSubmit
  → aiApi.sendAiChat(productId, text)
  → POST /api/ai/chat
  → AiController.chat (@Valid)
  → AiService.chat
      → ProductService.getProductById  (Postgres)
      → buildSystemPrompt
      → OpenAiChatProvider.complete
      → parse + validate
  → JSON AiChatResponse
  → setMessages + onAction
  → handleAiAction
  → ProductViewer / CameraRig / SmartphoneModel
```

---

## Part 9 — AI architecture

### Classes

| Class | Role |
| --- | --- |
| `AiController` | HTTP adapter |
| `AiService` | Prompt, parse, validate |
| `AiProvider` | Port for completion |
| `OpenAiChatProvider` | OpenAI Chat Completions adapter |
| `AiConfig` / `AiProperties` | Binding `ai.openai.*` |
| `AiChatRequest` / `AiChatResponse` / `AiActionResponse` | Wire types |
| `AiServiceException` | Typed HTTP failure |
| `RecordingAiProvider` | Test double (`@Primary` in AI tests) |

Frontend: `AiAssistant.tsx`, `aiApi.ts`, `types/ai.ts`, `App.handleAiAction`.

### Why this is actually AI, not keyword matching

There is **no** Java/TypeScript `if (message.contains("camera"))` routing.

What the LLM does:

- Reads a long system prompt that includes the **live catalog** (ids, names, descriptions, specs, colors).
- Interprets paraphrases ("zoom into the rear lenses", "take the phone apart", "light up the LED").
- Emits JSON with an allowed action type.

What the backend **deterministically** does:

- Allowlist action types.
- Resolve feature IDs against the catalog (`id`, `modelNodeName`, or `name`, case-insensitive).
- Drop viewer actions for non-smartphone products.
- Require `enabled` for flash.
- Strip unknown types (`DELETE_DATABASE` test keeps the message, nulls the action).

If OpenAI is down, there is no local intent classifier fallback.

Tests inject `RecordingAiProvider` so they assert **validation**, not live model quality. Live phrasing can vary; the prompt and tests document the **intended** contract.

### System prompt rules (from `AiService.buildSystemPrompt`)

- Answer only from catalog; do not invent specs.
- Return JSON only in the documented shapes.
- Allowed types: `NONE`, `FOCUS_FEATURE`, `EXPLODE_PRODUCT`, `ASSEMBLE_PRODUCT`, `SHOW_OVERVIEW`, `TOGGLE_FLASH`.
- Feature-specific questions **also** return `FOCUS_FEATURE` (including "what is", "tell me about", "what does X do").
- Product-level questions (colors, overall description) stay `action: null`.
- "show / focus / zoom / where is" → `FOCUS_FEATURE`.
- Explode without a component → `EXPLODE_PRODUCT`.
- "show X in exploded view" / internals → `EXPLODE_PRODUCT` with `featureId`.
- Assemble without a component → `ASSEMBLE_PRODUCT`.
- Show X in assembled mode → `ASSEMBLE_PRODUCT` with that `featureId`.
- View full phone / reset view → `SHOW_OVERVIEW`.
- Turn flash on/off → `TOGGLE_FLASH`. **"show me the flash" is FOCUS_FEATURE, not TOGGLE_FLASH.**
- Viewer actions ALLOWED only when `product.id == smartphone-001`.

OpenAI request extras: `temperature: 0.2`, `response_format: { type: "json_object" }`.

Parser also strips markdown fences if the model wraps JSON in ` ``` `.

### Example utterances — intended OpenAI JSON and what React does

The `message` string is produced by the model and **will vary**. Actions below are what the prompt plus tests specify. If the model returns a slightly different `message`, validation still keeps a valid action.

#### "Show me the camera"

Intended OpenAI content:

```json
{
  "message": "Showing the Camera System.",
  "action": { "type": "FOCUS_FEATURE", "featureId": "camera" }
}
```

Covered by `AiServiceTest.focusFeature_returnsCameraAction` and `AiControllerTest.chat_focusesCamera`.

React: `selectFeature(camera)` + `focusNonce++` → CameraRig uses camera override `(0.62, 1.16, -0.95)` looking at `(0.16, 0.9, -0.05)` when assembled.

#### "Tell me about the camera"

Intended:

```json
{
  "message": "<catalog-based explanation of Camera System / 48MP / 12MP / 5x>",
  "action": { "type": "FOCUS_FEATURE", "featureId": "camera" }
}
```

Covered by `featureQuestion_keepsFocusAction`. Same 3D path as above; the difference is the chat text is explanatory.

#### "Show me the camera in exploded view"

Intended:

```json
{
  "message": "Opening the camera in exploded view.",
  "action": { "type": "EXPLODE_PRODUCT", "featureId": "camera" }
}
```

Covered by `explodeProduct_withFeatureId_isPreserved`.

React: `setExploded(true)`; `selectFeature(camera)`; if already exploded, `focusNonce++` immediately; else `pendingFocusMode = 'exploded'` until explode state is true, then `focusNonce++`. Camera uses exploded lookAt + `EXPLODED_EYE_FROM_LOOKAT.camera`. The assembled counterpart uses `ASSEMBLE_PRODUCT` + `featureId` and `pendingFocusMode = 'assembled'`.

#### "Show me the battery"

Intended: `FOCUS_FEATURE` / `featureId: "battery"`. React selects battery, ghosts frame/back glass (`internalsOpen`), cameras to the back of the phone.

#### "Turn on the flash"

Intended:

```json
{
  "message": "Turning on the flash.",
  "action": { "type": "TOGGLE_FLASH", "enabled": true }
}
```

Covered by `toggleFlash_returnsEnabledTrue`.

React: `setFlashOn(true)` only. **Does not** select the flash feature or move the camera. LED animation runs via `flashLit`.

#### "What does the battery do?"

Intended: catalog description/specs in `message` **and** `FOCUS_FEATURE` / `battery` (feature question rule). Same 3D path as "Show me the battery".

#### Product-level: "What colors are available?"

Intended: `action: null`, message listing Natural, Black, Silver, Blue. Tests: `productLevelQuestion_keepsNullAction`, `chat_colorsQuestion_returnsCatalogColorsWithoutAction`. No camera change.

---

## Part 10 — AI action system

Allowed after validation (viewer types only for `smartphone-001`):

### `FOCUS_FEATURE`

- **Meaning:** Select a catalog feature and animate the camera to it.
- **Parameters:** `featureId` required. Resolved via id / modelNodeName / name.
- **Validation:** Unknown ID → message *"That component is not available on this product."*, `action null`. Blank ID → same (resolve returns null).
- **Frontend:** `handleAiAction` finds feature by **id only** (already canonicalized by backend). Requires `capabilities.featureFocus`.
- **3D result:** highlight, sidebar details, CameraRig focus. Flash first-select via UI also turns LED on; AI focus does **not** go through `handleSelectFeature`, so **AI FOCUS_FEATURE on flash does not set `flashOn`**. Needs to be stated in interviews: UI click and AI focus are almost the same, except flash LED side effect lives only in `handleSelectFeature`.

### `EXPLODE_PRODUCT`

- **Meaning:** Separate layers. Optional `featureId` to focus a component in exploded space.
- **Parameters:** `featureId` optional. Unknown featureId → explode **without** feature (action kept, id dropped).
- **Frontend:** `setExploded(true)`; if feature present and `featureFocus`, select it and sequence focus after explode.
- **3D result:** `ExplodedLayer` offsets; exploded overview camera unless a feature focus wins.

### `ASSEMBLE_PRODUCT`

- **Meaning:** Collapse layers. Optional `featureId` to focus a component in assembled space (symmetric with explode).
- **Parameters:** `featureId` optional. Unknown featureId → assemble **without** feature (action kept, id dropped).
- **Frontend:** `setExploded(false)`; if feature present and `featureFocus`, select it and sequence focus after assemble via `pendingFocusMode = 'assembled'`.
- **3D result:** layers lerp to origin; CameraRig uses assembled feature camera when a feature is selected, otherwise assembled overview.

### `SHOW_OVERVIEW`

- **Meaning:** Same as the View Full Phone button.
- **Parameters:** none.
- **Frontend:** `setOverviewNonce(n+1)`. Does not change exploded/assembled or selected feature.
- **3D result:** CameraRig lerps to overview (assembled or exploded overview depending on current mode).

### `TOGGLE_FLASH`

- **Meaning:** LED on/off.
- **Parameters:** `enabled` boolean required. Missing `enabled` → action stripped, message kept.
- **Frontend:** `setFlashOn(action.enabled)` if `capabilities.flash`.
- **3D result:** Flash `useFrame` animation only.

### `NONE` / null / unknown types

`NONE` and unknown types (test: `DELETE_DATABASE`) → `action null`, original message kept (except viewer-rejected products, which overwrite the message).

### Why AI does not control Three.js

Three.js lives in the browser. OpenAI returns data. If the model returned `{ "cameraX": 1.2 }`, every client would have to interpret unsafe numbers, and exploded-view math would be duplicated. Feature IDs reuse the catalog join key the meshes already use. Validation stays on the server; animation stays in CameraRig.

---

## Part 11 — Security

### `OPENAI_API_KEY`

- Read only by Spring: `ai.openai.api-key=${OPENAI_API_KEY:}`.
- Intended to be set in a gitignored root `.env` (see `.env.example` and `launch.json` `envFile`).
- **This document does not print any key.** Do not commit `.env`.

### Why the key is not in React / must not be `VITE_OPENAI_API_KEY`

Vite inlines any `VITE_*` env var into the browser bundle. Anyone could extract it and bill the OpenAI account. The current design:

- Browser → your backend only.
- Backend → OpenAI with Bearer token.
- `OpenAiChatProvider.sanitizeForLog` redacts the key, `Authorization` headers, `Bearer` tokens, and `sk-…` patterns before WARN logs. Tests assert 401 bodies do not leak the secret into logs or exception messages.

### CORS

Dev-only allowlist `http://localhost:5173`. Not a production CORS policy. No credentials flag.

### Validation

- Bean Validation on AI request.
- Allowlisted actions and catalog feature IDs.
- Product 404 before any OpenAI call (`missingProduct_throwsNotFound`).

### Secrets management (current)

- Gitignore `.env`, `.env.*` except `.env.example`.
- Local default Postgres password is in `application.properties` and `docker-compose.yml` (dev only).
- No vault, no AWS SM, no Spring Cloud Config.
- Health endpoint does not expose the key.

### What is not secured

No authentication on `/api/**`. Anyone who can reach port 8080 can chat (and spend OpenAI quota) and read the catalog.

---

## Part 12 — Error handling

| Failure | What happens |
| --- | --- |
| **PostgreSQL unavailable at startup** | Spring Boot fails to start (datasource / Flyway). SPA cannot load products. |
| **PostgreSQL unavailable after startup** | JPA calls fail. Not mapped in `GlobalExceptionHandler`. Frontend `getProducts` throws `API request failed with status …`. `App` shows "Unable to load product" + Try Again. **Exact status code needs verification** (typically 500). |
| **Backend unavailable** | `fetch` rejects or non-OK. Product load: generic status error. AI: `AI request failed with status …` or network Error message in the AI panel. 3D does not load if catalog never arrived. |
| **Missing OpenAI key** | `OpenAiChatProvider` throws 503 `"AI service is not configured."` Test: `complete_missingApiKey_throwsConfiguredMessage`. SPA shows that message via `aiApi` JSON `message`. |
| **OpenAI 401** | `RestClientResponseException` → 502 `"AI provider unavailable."` Logs HTTP 401 + redacted body. Test covers this. User does **not** see "invalid API key". |
| **OpenAI 429 / insufficient quota** | Same mapper as other HTTP errors: **502** `"AI provider unavailable."` Confirmed in development history when OpenAI returned `insufficient_quota`. There is **no dedicated 429 branch**. Logs include status and redacted body (quota text may still appear in server logs; it is not returned to the browser). |
| **OpenAI timeout / unreachable** | Connect 5s, read `timeout-seconds` (20). `ResourceAccessException` → 504 `"AI provider timed out."` Test: delayed mock server. |
| **OpenAI empty/invalid choices content** | 502 `"AI response was invalid."` |
| **Invalid AI JSON / blank message** | `AiService.parse` / `validate` → `"I couldn't complete that request. Please try again."`, `action null`. HTTP 200. |
| **Invalid feature ID** | 200 with canned message, `action null` (FOCUS). Explode with bad id still explodes. |
| **Unknown AI action** | 200, original message, `action null`. |
| **Missing product on AI call** | 404 `Product not found: …` before OpenAI. |
| **Blank AI body** | 400 `"Invalid request."` |
| **TV/fridge viewer action** | 200, viewer-unavailable message, `action null`. |

Frontend product errors do not parse backend JSON `message`; AI errors do.

---

## Part 13 — Testing

### Backend (JUnit 5, Spring Boot Test, MockMvc, AssertJ)

All `@SpringBootTest` product/AI service/controller tests talk to **real PostgreSQL** with Flyway seed data. They will fail if Docker Postgres is down.

| Test class | What it validates |
| --- | --- |
| `ProductExplorerApplicationTests` | Context loads |
| `ProductServiceTest` | Catalog size 3; smartphone 12 features and colors; TV/fridge 10 features and colors; 404 messages |
| `ProductControllerTest` | HTTP JSON for list/detail/features/camera/TV/fridge; 404 bodies |
| `AiServiceTest` | Prompt-driven validation with `RecordingAiProvider`: focus, explode ± feature, assemble, flash, invalid action, unknown feature, missing product, TV viewer rejection, feature question keeps focus, colors stay null action |
| `AiControllerTest` | MockMvc POST `/api/ai/chat` for camera focus, 404, colors, explode+feature |
| `OpenAiChatProviderTest` | Missing key → 503; local HttpServer 401 → 502 + log redaction; timeout → 504; `sanitizeForLog` |
| `RecordingAiProvider` | In-memory `AiProvider` for tests (`@Primary`) |

**Not present:** Mockito-based unit tests in the final tree (an earlier attempt failed in the sandbox; tests were rewritten to a fake provider). No WebTestClient. No frontend tests.

### Frontend build

`npm run build` runs `tsc -b && vite build`. That is compile-time checking, not behavioral tests.

Vitest, Testing Library, and jsdom are installed but unused (no test files, no npm test script).

### Maven build

`mvn test` / `mvn spring-boot:run` from `backend/` with `JAVA_HOME` pointing at JDK 17 (README). Requires Postgres.

---

## Part 14 — Development history

Reconstructed from `git log` on `main`. Do not invent phases that are not commits.

### Phase 0 — Initial project setup (`967b56b`, 2026-08-15)

- **Goal:** Monorepo with Vite React frontend and Spring Boot API.
- **Problem:** Need a stable catalog contract before 3D.
- **Implementation:** In-memory `ProductCatalog.java`, DTOs, mapper, CORS, health, product endpoints, frontend `useProduct` + placeholder `ProductViewer` (a gray box), tests against in-memory data.
- **Result:** SPA could load `smartphone-001` from `localhost:8080`. README still describes this phase.

### Phase 1 — Interactive 3D smartphone (`6ce0237`, 2026-08-16)

- **Goal:** Replace the test box with a real phone viewer.
- **Implementation:** `SmartphoneModel`, `FeatureHotspots`, `CameraRig`, `cameraOverview` constants, lights/shadows, OrbitControls `minDistance={2.1}`.
- **Result:** Click features/hotspots to inspect a procedural phone.

### Phase 2 — Hotspots, color, reset camera (`519f45d`)

- **Goal:** Better hotspot UX, colorways, return-to-overview.
- **Implementation:** `ColorSelector`, `phoneAppearance.ts`, hotspot core/label CSS, `overviewNonce` on CameraRig.
- **Result:** Natural/Black/Silver/Blue materials; "View Full Phone".

### Phase 3 — Camera and hotspot framing (`058a447`)

- **Goal:** Camera and flash framing that matches the actual meshes, not DB coordinates.
- **Implementation:** `FEATURE_FOCUS_OVERRIDES` + `resolveFeatureFocus`; hotspot pulse CSS.
- **Result:** Close-ups look at the island/LED instead of catalog `position`.

### Phase 4 — Exploded view (`75ed0a3`)

- **Goal:** Take the phone apart and keep camera/hotspots consistent.
- **Implementation:** `explodedView.ts`, `ExplodedLayer`, CameraRig command bus, flash LED `useFrame`, `flashOn` + second-click toggle, exploded hotspot subset.
- **Result:** Exploded/assembled toggle and internal layers.

### Phase 5 — Visual polish (`0c2a8b1`)

- **Goal:** Sidebar/CSS polish and small model tweaks.
- **Files:** `App.css`, `App.tsx`, `FeaturePanel.tsx`, `SmartphoneModel.tsx`.

### Phase 6 — PostgreSQL catalog (`bc6d494`, 2026-08-16)

- **Goal:** Replace in-memory catalog; add two more products.
- **Implementation:** Docker Postgres, Flyway V1/V2, JPA entities/repositories, mapper rewrite, delete `ProductCatalog.java`, expand tests to 3 products.
- **Result:** API shape unchanged for the phone; TV and fridge exist as data.

### Phase 7 — AI assistant (`fcc85a8`, 2026-08-17)

- **Goal:** Natural language that drives the **existing** viewer and answers from the catalog.
- **Implementation:** Full AI backend + `AiAssistant` + `handleAiAction` + `product3DCapabilities` + `ProductSelector` + `Product3DRenderer` placeholders + hotspot pointer-events fix + CameraRig minDistance workaround + pending exploded focus + OpenAI env wiring + tests.
- **Also added:** unused `smart_tv.glb`.
- **Result:** Current architecture described in this document.

---

## Part 15 — Important bugs we fixed

Evidence: git diffs, current code, and implementation transcripts. Where a commit message was generic, the **code change** is the source.

### Hotspot stacking / click issues

- **Problem:** Pins sat in overlapping Html overlays; clicks hit the wrong feature or the canvas.
- **Root cause:** Drei `<Html>` wrapper used `pointerEvents: 'auto'` on a large stacking context (`zIndexRange` 40). Labels and hit areas stacked in screen space.
- **Solution:** Outer Html `pointerEvents: 'none'`; only the 36px (28px exploded) button is `pointerEvents: 'auto'`; `stopPropagation` on pointerdown/click; lower `zIndexRange` to `[20, 0]`; `occlude={false}`.
- **Why:** Keep pins always visible but make the hit target the pin, not the HTML billboard.

### Camera / flash hotspot positioning

- **Problem:** Pins used DB `feature.position`, which did not sit on the procedural camera island / LED.
- **Root cause:** Seed coordinates were written before mesh layout was finalized; frontend owns mesh transforms.
- **Solution:** `resolveHotspotPosition` uses `FEATURE_FOCUS_OVERRIDES.lookAt`.
- **Why:** One override table drives both camera lookAt and pin placement.

### Exploded-view spacing

- **Problem:** Layers overlapped or flew too far; exploded overview camera was too distant (`EXPLODED_CAMERA` was originally `(2.15, 2.55, 8.65)`).
- **Root cause:** Offsets and overview camera were independent guesses.
- **Solution:** Current offsets in `EXPLODED_OFFSETS` (display `z+0.62`, internals `x+0.82`, battery `x-0.82`, backGlass `z-0.95`, camera `z-0.92`) and overview `(4.15, 1.32, 4.35)`.
- **Why:** Readable separation without losing the phone on screen.

### Camera framing

- **Problem:** API `cameraPosition` values framed the whole device, not the part.
- **Solution:** Full `FEATURE_FOCUS_OVERRIDES` map for all 12 nodes; exploded eye offsets in `EXPLODED_EYE_FROM_LOOKAT`.
- **Why:** Tune in the client next to the meshes.

### Battery / processor visibility

- **Problem:** Selecting Battery/Processor highlighted a mesh you still could not see; transparent back glass was not enough because the **frame is a solid volume**.
- **Root cause:** Internals live inside the frame RoundedBox.
- **Solution:** `internalsOpen` ghosts **both** frame and back glass.
- **Why:** Avoid a real CSG cutaway; keep one model.

### Flash focus vs flash toggle

- **Problem:** "Show flash" and "turn on flash" are different intents; clicking flash always refocused.
- **Solution:** Prompt: show = `FOCUS_FEATURE`, on/off = `TOGGLE_FLASH`. UI: second click on already-selected flash toggles `flashOn` and returns without bumping `focusNonce`.
- **Why:** Reuse selection state as a mode switch without extra buttons.

### OrbitControls minimum distance preventing zoom

- **Problem:** Close-up presets placed the camera nearer than OrbitControls `minDistance` (initially **2.1**). `orbit.update()` shoved the camera back.
- **Solution:** `minDistance={0.35}` on OrbitControls; CameraRig also `min(orbit.minDistance, 0.35)` and **restores** lerped `camera.position` after `update()`, then `lookAt` the target.
- **Why:** Keep OrbitControls for the user without letting its collider undo scripted close-ups.

### Exploded + feature focus sequencing

- **Problem:** `EXPLODE_PRODUCT` + `featureId` set explode and focus in one React tick; CameraRig used assembled offsets or exploded-overview instead of exploded close-up.
- **Solution:** `pendingFocusMode`; effect waits until `exploded` matches the requested mode, then increments `focusNonce`. If already in that mode, increment immediately. CameraRig, on explode-flag change, prefers existing feature camera over exploded overview when `cameraCommand.featureId` is set.
- **Why:** Exploded lookAt depends on `exploded` being true inside `resolveFeatureFocus`.

### AI feature ID mapping

- **Problem:** Model might return `"Camera System"` or `"camera-module"` instead of `camera`.
- **Solution:** `resolveFeatureId` matches id, modelNodeName, and name, case-insensitive; always returns canonical `feature.id`. Unknown FOCUS ids are rejected.
- **Why:** Keep the LLM flexible; keep the client strict (`find` by id).

### OpenAI API key configuration

- **Problem:** Key must reach Spring without landing in the Vite bundle; IDE launch must see `.env`.
- **Solution:** `OPENAI_API_KEY` → `AiProperties`; `.env` gitignored; `launch.json` `envFile`; empty default in properties so the app still boots without a key (AI calls then 503).
- **Why:** Standard 12-factor backend secret.

### OpenAI 429 quota

- **Problem:** Live calls returned HTTP 429 `insufficient_quota`. The API still responded **502** `"AI provider unavailable."` to the browser. Early on, missing logs made 504 vs 429 hard to tell apart.
- **Root cause:** All `RestClientResponseException` paths share one user message; quota is an account/billing issue, not an app bug.
- **Solution:** WARN logs with status + sanitized body; keep generic client message (do not leak provider error strings). Fix is operational (billing/quota), not a new action type.
- **Why:** Avoid leaking provider internals; one stable frontend contract.

### AI provider timeout / error handling

- **Problem:** Hung OpenAI calls and 401s needed safe, typed HTTP statuses without secret leakage.
- **Solution:** 5s connect / 20s read; map timeout → 504; HTTP errors → 502; missing key → 503; sanitize logs; tests with local `HttpServer`.
- **Why:** The SPA can show a specific timeout string vs unconfigured vs generic provider failure.

---

## Part 16 — End-to-end user scenarios

### 1. User loads smartphone

```
Browser GET localhost:5173
  → Vite → index.html → main.tsx → App
  → useProduct.loadCatalog
  → GET /api/products
  → ProductController → ProductService → PostgreSQL (3 products)
  → JSON
  → selectedProductId = smartphone-001
  → App capabilities = all true
  → ProductViewer Canvas mounts
  → Product3DRenderer → SmartphoneModel + FeatureHotspots
  → CameraRig snaps to OVERVIEW_CAMERA
  → FeaturePanel shows product copy + 12 buttons
  → AiAssistant empty state "Ask me about this product"
```

### 2. User clicks Camera hotspot

```
FeatureHotspots Hotspot onClick(camera feature)
  → App.handleSelectFeature
  → setFlashOn(false)  // node is not flash
  → useProduct.selectFeature(camera)
  → focusNonce++
  → ProductViewer writes cameraCommand for camera override
  → CameraRig lerps to rear camera island
  → SmartphoneModel highlights camera group + lenses
  → FeaturePanel shows Camera System specs (48MP / 12MP / 5x)
```

### 3. User changes phone color

```
ColorSelector onClick("Blue")
  → App.handleSelectColor
  → selectedColor = "Blue"
  → ProductViewer selectedColor prop
  → SmartphoneModel getPhoneAppearance("Blue")
  → frameColor #4a6fa3, backGlassColor #5f93cc
No backend call.
```

### 4. User explodes the phone

```
Exploded View button
  → onExplodedChange(true)
  → App.exploded = true
  → explodedMode.current = true
  → ExplodedLayer lerps six layers to EXPLODED_OFFSETS
  → FeatureHotspots hides non-subset pins
  → CameraRig sees exploded flag; if no feature camera, EXPLODED_CAMERA
```

### 5. User selects Battery

```
FeaturePanel button "Battery"  (or hotspot if visible)
  → handleSelectFeature(battery)
  → selectedFeature = battery; focusNonce++
  → internalsOpen true → frame/back glass ghosted
  → CameraRig to battery camera (assembled or exploded variant)
  → FeaturePanel shows ~4000 mAh / MagSafe specs
```

### 6. User asks AI "Show me the camera"

```
AiAssistant submit
  → POST /api/ai/chat { productId: smartphone-001, message }
  → AiService loads product from Postgres
  → OpenAI json_object completion
  → validate FOCUS_FEATURE camera
  → { message, action: { type: FOCUS_FEATURE, featureId: camera } }
  → chat bubble
  → handleAiAction → selectFeature + focusNonce++
  → same CameraRig path as scenario 2
  Note: does not use handleSelectFeature, so flash LED side effects do not run.
```

### 7. User asks AI "Tell me about the camera"

```
Same HTTP path
  → action still FOCUS_FEATURE camera (prompt rule)
  → message is explanatory catalog text
  → 3D focus same as scenario 6
```

### 8. User asks AI "Show me the camera in exploded view"

```
OpenAI → EXPLODE_PRODUCT + featureId camera
  → setExploded(true); selectFeature(camera); pendingFocusMode if needed
  → layers separate
  → effect focusNonce++
  → resolveFeatureFocus(camera, exploded=true)
  → exploded eye/lookAt
```

### 9. User asks AI "Turn on the flash"

```
OpenAI → TOGGLE_FLASH enabled true
  → setFlashOn(true)
  → flashLit.current = true
  → Flash useFrame: LED emissive, glow, pointLight
  → camera and selectedFeature unchanged
```

---

## Part 17 — Interview explanation

Spoken versions are also copied into `PROJECT_PRESENTATION_GUIDE.md` and `PROJECT_INTERVIEW_CHEATSHEET.md`.

### 30-second

I built a 3D product explorer: a React Three Fiber smartphone on the client, a Spring Boot catalog API on PostgreSQL, and an AI assistant that does not talk to Three.js. The model returns a validated JSON action like FOCUS_FEATURE camera, and React runs the same state handlers a hotspot click would run.

### 1-minute

The app is a product inspector, not a chatbot with a pretty background. PostgreSQL stores three products; only the flagship phone has a procedural 3D model with twelve named parts. Users orbit the phone, click hotspots, explode the device, change colors, and toggle the flash LED. When they type natural language, Spring Boot loads that product, stuffs the catalog into a system prompt, and asks OpenAI for JSON. The backend allowlists the action and feature ID. The frontend already knew how to focus, explode, and toggle flash, so AI is an additional input to the same state machine.

### 3-minute

Start with the problem: spec sheets do not show spatial structure. I built a procedural phone in React Three Fiber so every catalog feature has a matching mesh name. CameraRig lerps the perspective camera; ExplodedLayer lerps parts apart; materials highlight the selection. Color is just React state into PBR parameters.

The API started in-memory so the frontend contract could freeze, then I moved the same JSON to PostgreSQL with Flyway and JPA. Television and refrigerator rows exist, but capabilities flags turn off 3D and the AI backend refuses viewer actions for those IDs.

AI is orchestrated, not embedded in the scene. The key never leaves the server. OpenAI is required to answer only from catalog context and to emit FOCUS_FEATURE, EXPLODE_PRODUCT, ASSEMBLE_PRODUCT (optional featureId), SHOW_OVERVIEW, or TOGGLE_FLASH. If it invents a warp drive, we drop the action. If the account is out of quota, the user sees a generic 502 and we log a redacted 429. Timeouts are 504. Missing key is 503.

That split—LLM for intent, backend for policy, React for 3D—is the architecture I would defend in a design interview.

### 5-minute deep technical

(Walk the stack.)

**Client.** App.tsx is the orchestrator. useProduct loads GET /api/products. Local state holds color, flash, exploded, and two nonces so selecting the same feature twice still retriggers CameraRig. A module-level cameraCommand object is written during ProductViewer render because the animation loop lives inside Canvas.

**3D.** No GLTF for the phone. Groups named camera, battery, flash, and so on. Hotspots are Drei Html pins with pointer-events only on the button so stacked billboards do not steal clicks. Internals are hidden until battery/processor selection ghosts the frame. OrbitControls minDistance used to be 2.1 and fought close-ups; we lowered it and restore the lerped camera after controls.update.

**Data.** Four tables, composite feature PK, Flyway seed. open-in-view is false; mapping happens in a read-only transaction with SUBSELECT fetches.

**AI.** AiService.buildSystemPrompt includes every feature id and spec. OpenAiChatProvider uses json_object, temperature 0.2, 20s read timeout. validate() is the security boundary: allowlist, product capability, feature resolution. React handleAiAction is a switch that calls the same setters as the UI, with pendingFocusMode so explode/assemble-then-focus uses the correct camera math.

**Tests.** Controller and service tests hit real Postgres. AI tests swap in RecordingAiProvider. Provider tests spin a local HttpServer for 401 and timeout, and assert the API key never appears in logs.

---

## Part 18 — Likely interview questions

Answers are based on this repo.

### React: Why is explorer state in App instead of Redux?

The tree is small and the 3D viewer, feature panel, and AI assistant must share one session. App is the composition root. useProduct isolates fetching. Extra stores would not simplify CameraRig, which cannot sit in Redux anyway because it runs in useFrame.

### React: What are focusNonce and overviewNonce?

CameraRig must re-animate even if the selected feature id did not change (click Camera twice, or explode then focus the same part). Incrementing a nonce is an event. overviewNonce is the "View Full Phone" event.

### TypeScript: Do you validate API JSON at runtime?

No. Types are compile-time only. Backend Jackson + Bean Validation are the contract. A mismatch would show up as undefined fields in the UI.

### Three.js / R3F: Why procedural instead of GLTF?

Faster iteration on named parts, click targets, and explode layers. A TV GLB was added later but is not loaded; the renderer switch is explicitly `null` for tv/refrigerator.

### R3F: Why cameraCommand instead of props on CameraRig?

CameraRig originally took props. Exploded view moved command state to a mutable module so the frame loop and ProductViewer stay in sync without rerendering the entire graph every animation tick, and so explode/flash flags are readable from useFrame (Flash, ExplodedLayer) without prop drilling through every mesh.

### State management: How does AI not fight the UI?

Both call the same App handlers. There is one `exploded` boolean, one `selectedFeature`, one `flashOn`.

### REST: Why GET products includes nested features?

The first paint needs names, colors, and feature list. Extra round-trips exist (`/features`, `/features/{id}`) but the SPA does not use them after catalog load. selectProduct still refetches GET `/products/{id}` to refresh the cached item.

### Spring Boot: Why records for DTOs and mutable entities?

Entities need JPA no-arg constructors and setters. API responses are immutable records, which Jackson serializes cleanly.

### Java: What is ProductFeatureId?

`@IdClass` for the composite `(product, id)` primary key so feature slugs can repeat across products.

### PostgreSQL: Why Flyway validate + Hibernate validate?

Flyway owns DDL. `ddl-auto=validate` fails fast if entities drift from SQL. Seed data is SQL, not Java.

### PostgreSQL: N+1?

`@Fetch(FetchMode.SUBSELECT)` on colors, features, and specifications. Combined with `open-in-view=false`, the service method loads what the mapper needs.

### OpenAI: Why json_object and temperature 0.2?

We need a parseable action envelope, not prose. Low temperature reduces random action types. We still parse defensively and allowlist.

### LLM structured output: What if the model wraps JSON in markdown?

`extractJson` slices from first `{` to last `}` when the string starts with ` ``` `.

### AI orchestration: Is the system prompt RAG?

No. It is "stuff the current product DTO into the prompt." Fine for one product’s twelve features; would not scale to a manual PDF corpus.

### Security: Could someone call OpenAI through your API?

Yes. `/api/ai/chat` is unauthenticated. Mitigation in a real deployment would be auth, quota, and CORS/network restrictions. The key still would not go to the browser.

### API keys: What is wrong with VITE_OPENAI_API_KEY?

It is compiled into the SPA. Anyone can steal it.

### Error handling: Why 502 for both 401 and 429?

Stable client contract; do not leak provider error strings. Operators use WARN logs. Tradeoff: the UI cannot say "out of quota" vs "bad key".

### Testing: Why a fake AiProvider instead of Mockito?

Spring Boot tests plus a `@Primary` RecordingAiProvider avoid attaching a mock agent and still assert validation. Provider HTTP behavior is tested separately against a real local HTTP server.

### Testing: Why no Testcontainers?

Current tests assume Docker Compose Postgres on localhost. That is a limitation; CI would need that service or a container.

### Performance: Is the 3D model heavy?

A few dozen primitives, 1024 shadow maps, DPR capped at 2. No texture assets on the phone. Hotspots are DOM. Fine for a single product; a scanned GLB TV would need Draco/compression (not implemented).

### Architecture: How would you add a second interactive product?

Add capabilities true for that id, implement a renderer branch in `Product3DRenderer`, seed features whose `model_node_name` match meshes, and extend `AiService.SMARTPHONE_PRODUCT_ID` (today a single constant—call that out as a known coupling).

### Scalability: What breaks first?

OpenAI latency and cost (every chat is a full catalog prompt). Postgres is tiny. The SPA is static. Horizontal scale: multiple API instances with the same DB; rate-limit AI; do not put WebGL on the server.

---

## Part 19 — What we would build next

Based on current gaps, not fantasy rewrites.

### High priority

- **Conversation context:** send a bounded message history, or a server-side session, so "now explode it" works after "show the camera".
- **Unify viewer-enabled product IDs:** replace `SMARTPHONE_PRODUCT_ID` with capabilities stored in DB or shared config so TV 3D and AI actions cannot drift.
- **Frontend tests** for `handleAiAction`, `resolveFeatureFocus`, and `AiService`-equivalent fixtures; npm `test` script.
- **Testcontainers or dedicated test DB** so `mvn test` is not coupled to a developer’s Docker daemon.
- **Health checks** that ping Postgres (and optionally a cheap OpenAI configuration check without spending tokens).
- **README update** (it is stale). Remove or wire `smart_tv.glb`.
- **Production secret management** and auth on `/api/ai/chat`.

### Medium priority

- **Richer AI 3D commands:** rotate to back, set color (with allowlisted color names), reset view, highlight without moving camera. Each would be a new action type + App handler + prompt line + tests.
- **Interactive TV/fridge renderers** (GLTF or procedural) using the existing catalog positions.
- **RAG / grounded knowledge:** manuals, compare-to-spec PDFs, citations. Only after prompt-stuffing is clearly too small.
- **Better provider errors:** optional distinct 429 handling for operators (still careful with user-facing copy).
- **Delete unused domain package** and unused `productApi` helpers once you are ready to touch code.

### Future / advanced

- **Voice:** Web Speech API or a streaming STT/TTS pipeline into the same `sendAiChat`.
- **Multi-product comparison** in one scene.
- **Medical / anatomy explorer:** same pattern (catalog of named parts + camera presets + structured FOCUS_FEATURE). Would need clinical content review, not just a mesh swap. The architecture fits; the data and liability model would be new.
- **Production deployment:** static frontend (S3/Netlify) + containerized Spring Boot + managed Postgres + env-based CORS + API gateway rate limits + no public OpenAI key.
- **AR / WebXR:** out of scope of current Canvas setup.

Do not implement these as part of this documentation task.

---

## Part 20 — Final cheat sheet

### Architecture

SPA (Vite/React) ↔ Spring Boot REST ↔ PostgreSQL catalog; Spring Boot ↔ OpenAI; React executes validated actions on an existing R3F viewer.

### Frontend

`App` orchestrates. `useProduct` loads catalog. `ProductViewer` Canvas. `SmartphoneModel` meshes. `AiAssistant` chat.

### Backend

`ProductController` / `AiController` / `HealthController`. `ProductService` + JPA. `AiService` + `OpenAiChatProvider`.

### Database

`products`, `product_colors`, `product_features`, `feature_specifications`. Flyway V1/V2. JPA validate.

### AI

Catalog-stuffed system prompt, `json_object`, allowlisted actions, feature ID resolution, no chat memory, key server-side.

### 3D

Procedural phone, OrbitControls, CameraRig lerp, ExplodedLayer, Html hotspots, internals ghosting, flash point light. No GLTF loader in code.

### APIs

`GET /api/health`, `GET /api/products`, `GET /api/products/{id}`, `GET .../features`, `GET .../features/{id}`, `POST /api/ai/chat`.

### Security

`OPENAI_API_KEY` backend only; CORS localhost:5173; validation + allowlist; log redaction; no auth.

### Testing

Spring tests + real Postgres; RecordingAiProvider; OpenAI adapter tests with HttpServer; no frontend tests.

### Major bugs fixed

Hotspot hit targets; pin/camera framing; explode spacing; internals visibility; flash focus vs toggle; OrbitControls minDistance; explode+focus sequencing; feature ID resolve; API key placement; 429 vs timeout diagnosis; provider timeouts and sanitized logs.

### Current capabilities

Interactive smartphone 3D + catalog AI + four viewer actions; TV/fridge catalog + Q&A only.

### Current limitations

No memory, no RAG, no voice, no TV/fridge 3D, no auth, stale README, unused GLB, tests need local Postgres, 401/429 share 502.

### Next steps

Chat context, capabilities in data, frontend tests, Testcontainers, real 3D for other products, production hardening.

---

*Generated from the repository as of `main` / `fcc85a8`. If a behavior is marked "needs verification", it was not fully proven from tests or a live runtime in this documentation pass.*

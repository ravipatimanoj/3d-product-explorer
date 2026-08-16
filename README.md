# 3D Product Explorer

A production-quality portfolio project for exploring products in an interactive 3D environment.

## Repository Structure

```
3d-product-explorer/
├── frontend/    # React + TypeScript + Vite application
└── backend/     # Java Spring Boot REST API
```

### `frontend/`

Contains the React application built with TypeScript and Vite. This is the client-facing UI where users browse and interact with products.

- **Three.js + React Three Fiber** power an interactive procedural smartphone viewer
- **3D models** will later be stored under `frontend/public/models/`
- **AI-controlled 3D actions** will be integrated later

### `backend/`

Java Spring Boot REST API (Java 17, Spring Boot 3.3.5, Maven) that serves product and feature data to the frontend.

- **In-memory mock data** is used for the product catalog in the current phase
- **PostgreSQL** will later replace in-memory storage for product and feature data
- **AI assistant integration** will be added later

## Product API

Base URL: `http://localhost:8080`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List all products |
| GET | `/api/products/{productId}` | Get a product by ID |
| GET | `/api/products/{productId}/features` | List features for a product |
| GET | `/api/products/{productId}/features/{featureId}` | Get a feature by ID |

### Example Requests

```bash
# Health check
curl http://localhost:8080/api/health

# List all products
curl http://localhost:8080/api/products

# Get one product
curl http://localhost:8080/api/products/smartphone-001

# List product features
curl http://localhost:8080/api/products/smartphone-001/features

# Get one feature
curl http://localhost:8080/api/products/smartphone-001/features/camera
```

### Example Responses

**GET `/api/health`**

```json
{
  "status": "UP"
}
```

**GET `/api/products`**

```json
[
  {
    "id": "smartphone-001",
    "name": "Premium Flagship Smartphone",
    "description": "A premium flagship smartphone concept designed for an interactive 3D product experience.",
    "category": "Smartphone",
    "defaultColor": "Natural",
    "availableColors": ["Natural", "Black", "Silver", "Blue"],
    "features": [ "..."]
  }
]
```

**GET `/api/products/smartphone-001/features/camera`**

```json
{
  "id": "camera",
  "name": "Camera System",
  "description": "Multi-lens rear camera array designed for versatile photography in varied lighting conditions.",
  "category": "Camera",
  "modelNodeName": "camera",
  "position": {
    "x": 0.25,
    "y": 1.2,
    "z": 0.1
  },
  "cameraPosition": {
    "x": 2.0,
    "y": 1.5,
    "z": 3.0
  },
  "specifications": [
    {
      "name": "Main Sensor",
      "value": "48 MP wide"
    },
    {
      "name": "Ultra Wide",
      "value": "12 MP"
    },
    {
      "name": "Optical Zoom",
      "value": "5x telephoto"
    }
  ]
}
```

**404 Not Found**

```json
{
  "status": 404,
  "message": "Product not found: missing-product"
}
```

### Data Storage

Product and feature data is currently served from an **in-memory catalog** inside the backend. This establishes a stable API contract for frontend development.

In a future phase, the same API shape will be backed by **PostgreSQL** using JPA repositories, without requiring frontend changes.

### CORS

The backend allows requests from the React development server at `http://localhost:5173`.

## Running the Backend

```bash
cd backend
export JAVA_HOME=/usr/local/Cellar/openjdk@17/17.0.20/libexec/openjdk.jdk/Contents/Home
mvn test
mvn spring-boot:run
```

## Running the Frontend

```bash
cd frontend
npm run dev
```

The Vite app runs at `http://localhost:5173` and expects the backend at `http://localhost:8080`.

## Status

Current phase: interactive 3D smartphone viewer with feature hotspots, camera focusing, component highlighting, and the existing Spring Boot product API. PostgreSQL, AI, exploded view, and color selection are later phases.

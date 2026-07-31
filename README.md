# SceneGo

SceneGo is a context-aware mobile translation application built with Expo (React Native) and Python. It automatically detects real-time travel contexts (airport taxi, dining allergen warnings, tax refunds, emergency SOS) using LBS geofencing and motion sensors, rendering high-contrast flash cards for instant local communication.

## Architecture

- **Frontend (`App.tsx`, `src/components/`)**: Single-page Expo (React Native) app with camera feed toggle, zero-search flash cards, TTS audio playback, and quick notes modal.
- **Backend Engine (`server/`)**: FastAPI server (`server/main.py`) providing location scenario inference (`server/engine/scene_detector.py`) and multilingual card templates (`server/engine/card_templates.py`).

## Directory Structure

```text
scenego/
├── App.tsx                     # Expo React Native App Entry Point
├── app.json                    # Expo Configuration & Permissions
├── package.json                # Frontend Node Dependencies
├── server/                     # Python Backend Engine & API
│   ├── main.py                 # FastAPI Application Server
│   ├── requirements.txt        # Python Dependencies
│   ├── engine/                 # Scenario Inference & Card Generator
│   │   ├── scene_detector.py
│   │   └── card_templates.py
│   └── tests/                  # Unit Tests
│       └── test_scene_engine.py
├── src/                        # Frontend Components
│   └── components/
│       ├── CameraBackground.tsx
│       ├── FlashCardView.tsx
│       ├── ControlBar.tsx
│       └── QuickNotesModal.tsx
└── docs/                       # Specifications & Strategy
    ├── PRODUCT_STRATEGY.md
    ├── PRD.md
    ├── ARCHITECTURE.md
    └── EXPO_PROJECT_MANAGEMENT.md
```

## Quick Start

### 1. Frontend (Expo / React Native)

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

### 2. Backend (FastAPI / Python Engine)

```bash
cd server
pip install -r requirements.txt
python3 main.py
```

### 3. Run Unit Tests

```bash
cd server
python3 -m pytest tests/
```

## Documentation

- [Product Strategy](docs/PRODUCT_STRATEGY.md)
- [Product Requirements (PRD)](docs/PRD.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Expo Engineering & Project Management Plan](docs/EXPO_PROJECT_MANAGEMENT.md)

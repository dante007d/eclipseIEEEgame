# Eclipse IEEE Game

A collaborative multiplayer / interactive game project.

## Project Structure

```text
.
├── client/          # Frontend / UI / UX (User Interface, Design, Assets, Client Logic)
│   ├── assets/      # Sprites, audio, fonts, UI mockups, icons
│   └── src/         # UI scripts, client components, views
├── server/          # Backend / Server Logic (API, Game Loops, State Management)
│   ├── config/      # Configuration and environment setup
│   ├── controllers/ # Request handlers / game controller logic
│   ├── models/      # Data models / schema definitions
│   ├── routes/      # Network endpoints / route definitions
│   └── src/         # Core server source code
├── shared/          # Shared types, constants, protocol schemas, and utilities
└── docs/            # Project documentation, design specs, and diagrams
```

## Team Responsibilities

- **UI / UX & Frontend (`/client`):** UI design, styling, assets, HUD, sound design, client-side interactions.
- **Server & Backend (`/server`):** Game server logic, backend APIs, state synchronization, database/persistence, security.
- **Shared (`/shared`):** Data contracts, constants, and shared types between client and server.

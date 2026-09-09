# 🫧 RageType — Bubbly Multiplayer Typing Battle

> A bubbly pink, fast-paced multiplayer frustration-release party game! Scream-type hilarious rants against friends or AI bots before your countdown runs out.


---

## ✨ Features

- **💥 High-Stakes Multiplayer Rooms:** Join or host private game rooms using 6-letter room codes. Compete with friends in real-time over low-latency WebSockets.
- **🤖 Autonomous AI Opponents:** Add dynamic AI bots with customizable personalities, lifelike typing speeds (40–85 WPM), and humorous rage tendencies.
- **🗣️ AI-Powered Frustration Rants:** Type out hilarious, relatable everyday rages generated dynamically using the Google Gemini API (with curated offline fallback phrases).
- **🦄 Custom Bubbly Avatars:** Personalize your avatar with playful accessories (Crowns 👑, Bows 🎀, Sunglasses 🕶️, Bunny Ears 🐰, Chef Hats 🧑‍🍳) and pastel color palettes.
- **⚡ Emergency Recovery Abilities:**
  - **Bubble Shield (+5s):** Cushion your active turn timer with an extra 5 seconds to finish your sentence.
  - **Frustration Scream:** Downscale a complex phrase to a short panic scream when time is running out.
- **🫧 Interactive Pop-It Canvas:** Pop decorative floating bubbles anywhere on screen to relieve stress with live local and global counters.
- **🎹 Web Audio Synthesizer & BGM:** Built-in procedural audio engine providing typewriter key pops, ability swells, victory chimes, and a toggleable bouncy 8-bit pentatonic background music loop.
- **💔 Heart/Life System:** Players start with 3 hearts. Fail a turn before the timer expires or mistype, and you lose a life. The last surviving typist takes the crown!

---

## 🎮 How to Play

1. **Enter Your Nickname & Avatar:** Choose your handle and customize your bubbly avatar with accessories and color palettes.
2. **Join or Create a Room:** Enter a custom room code or start a fresh match.
3. **Assemble Players & Bots:** Invite friends via your room code or spawn AI sparring bots to test your speed.
4. **Fast Typing Turn:** When it's your turn, type the highlighted rage sentence with 100% accuracy before the bomb timer explodes.
5. **Survive & Win:** Earn points with each completed rant, preserve your hearts, and climb to the top of the leaderboard!

---

## 🛠️ Technology Stack

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Styling & Motion:** [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/)
- **Backend & Realtime:** [Express 4](https://expressjs.com/), [ws](https://github.com/websockets/ws) (WebSocket server)
- **AI Rant Generation:** [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini Flash)
- **Sound & Effects:** Web Audio API procedural synthesizer (zero external audio file dependencies)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd ragetype
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (or use `.env.example` as a template):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Note: The game operates smoothly with built-in emergency rant collections even if no Gemini API key is supplied!)*

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Scripts

- `npm run dev`: Boots the full-stack Express server with integrated Vite middleware on port 3000.
- `npm run build`: Builds client assets with Vite and bundles the Node server with `esbuild` into `dist/server.cjs`.
- `npm run start`: Launches the compiled production server.
- `npm run lint`: Validates TypeScript types across the codebase.

---

## 📡 WebSocket Protocol Summary

Clients communicate with the server over WebSocket JSON packets:

| Direction | Action | Description |
|---|---|---|
| Client → Server | `join` | Connect to room with username & avatar metadata |
| Client → Server | `start` | Initiates game round from lobby |
| Client → Server | `typing` | Syncs current character typing progression |
| Client → Server | `use_ability` | Triggers Bubble Shield or Frustration Scream |
| Client → Server | `add_bot` | Spawns a bot opponent into the room |
| Client → Server | `pop_bubble` | Increments the global bubble-pop counter |
| Server → Client | `sync` | Full room state broadcast (turn, timer, players, phrase) |
| Server → Client | `bubble_popped_broadcast` | Broadcast of updated global bubble count |

---

## 📄 License

MIT License. Designed with 💖 for high-speed typists and frustration releases everywhere.

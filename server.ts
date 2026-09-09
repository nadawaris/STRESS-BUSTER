import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { Room, Player, ClientMessage, ServerMessage } from "./src/types.js";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Frustration venting phrases
const FRUSTRATION_PHRASES = [
  "WHY IS MY PACKET OF CHIPS NINETY PERCENT AIR?!",
  "YOU COULD HAVE EMAILED ME INSTEAD OF SCHEDULING A CALL",
  "I HATE WHEN PEOPLE LEAVE ONE SECOND ON THE MICROWAVE!",
  "WHY does the fitting room have thirty mirrors and zero flattering lights",
  "STILL WAITING FOR THE DISHWASHER TO EMPTY ITSELF",
  "PLEASE DO NOT COUGH DIRECTLY INTO MY PERSONAL SPACE",
  "I AM SENDING MY NINETIETH GENTLE REMINDER",
  "STOP REPLYING TO GROUP EMAILS WITH REPLY ALL",
  "I HATE WHEN DEODORANT LEAVES WHITE MARKS ON MY DARK SHIRT",
  "WHY is my phone battery at twenty percent after thirty minutes of scrolling",
  "NO I DONT WANT TO DOWNLOAD YOUR APP TO ORDER A CAPPUCCINO",
  "WHY DOES THE PRINTER CHOOSE THIS SPECIFIC MOMENT TO JAM",
  "THE CHECKOUT LANE IS ALWAYS SLOWER AS SOON AS I JOIN IT",
  "YES OF COURSE I FORGOT THE ONE INGREDIENT I CAME TO GET",
  "I WILL NOW AGGRESSIVELY TYPE THE REST OF THIS EMAIL WITH POWER",
  "CAPS LOCK IS NOT A LIFESTYLE BUT TODAY IT IS AN EXCEPTION",
  "DO YOU MIND NOT PLAYING TIKTOKS OUT LOUD ON THE BUS",
  "PLEASE DISRUPT MY FLOW WITH ANOTHER UNNECESSARY NOTIFICATION",
  "SURE GO AHEAD AND MAKE A U TURN IN THE MIDDLE OF THE STREET!",
  "I SPOKE ON MUTE FOR FIVE SOLID MINUTES TO A SILENT MEETING",
  "TAP TO UNLOCK BUT THE FACE UNLOCK NEVER RECOGNIZES MY BED HEAD",
  "PLEASE LEAVE ME ALONE I AM JUST TRYING TO MERGE TRANSITIONS",
  "STOP WALKING SO SLOWLY IN THE MIDDLE OF THE SIDEWALK",
  "THE PASSWORD MUST CONTAIN A HIEROGLYPH AND A FRESH TWIG",
  "I SAVED THE ENTIRE EXCEL FILE AS READ ONLY BY ACCIDENT",
  "COULD NOT RESOLVE DEPENDENCY TREE RUN WITH FORCE",
  "WHY DOES THE AUTOMATIC SINK STREAM COLD WATER FOR TWO SECONDS",
  "I JUST SPILLED TEA DIRECTLY ONTO MY SPACEBAR",
  "THE BLUETOOTH CONNECTED TO SPARKLE SPEAKER COFFEE AND CHAIR",
  "HOW DID I LOSE BOTH OF MY AIRPODS IN THE SAME TOWEL"
];

// Server state
const rooms = new Map<string, Room>();
const clientConnections = new Map<WebSocket, { roomId: string; playerId: string }>();

// Global bubble pop stat
let globalBubblesPopped = 0;

// Setup custom WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Attach WS upgrade handling
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Helper: Broadcast to all players in a room
function broadcastToRoom(roomId: string, message: ServerMessage) {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const [ws, info] of clientConnections.entries()) {
    if (info.roomId === roomId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Helper: Pick a random, fresh frustration phrase
function getRandomPhrase(exclude?: string): string {
  const options = exclude ? FRUSTRATION_PHRASES.filter(p => p !== exclude) : FRUSTRATION_PHRASES;
  return options[Math.floor(Math.random() * options.length)];
}

// Game Logic: Start turn for next player in room
function startNextTurn(room: Room) {
  // Find all players still alive
  const alivePlayers = room.players.filter(p => p.isAlive);
  
  if (alivePlayers.length === 0) {
    // Everyone is out!
    room.status = "ended";
    room.currentTurnPlayerId = null;
    room.winnerPlayerId = null;
    room.lastActionMessage = "Game Over! Everybody lost all their lives!";
    return;
  }

  // If only 1 player remains and there were more to begin with, they win!
  if (alivePlayers.length === 1 && room.players.length > 1) {
    room.status = "ended";
    room.currentTurnPlayerId = null;
    room.winnerPlayerId = alivePlayers[0].id;
    room.lastActionMessage = `🎉 ${alivePlayers[0].name} wins the frustration battle! 🎉`;
    alivePlayers[0].score += 1500; // winner bonus
    return;
  }

  // Choose next turn.
  let nextIndex = 0;
  if (room.currentTurnPlayerId) {
    const currentIndex = room.players.findIndex(p => p.id === room.currentTurnPlayerId);
    // Find next alive player with round robin
    let found = false;
    for (let i = 1; i <= room.players.length; i++) {
      const idx = (currentIndex + i) % room.players.length;
      if (room.players[idx].isAlive) {
        nextIndex = idx;
        found = true;
        break;
      }
    }
    if (!found) nextIndex = currentIndex;
  } else {
    // Start with the first alive player
    nextIndex = room.players.findIndex(p => p.isAlive);
  }

  const nextPlayer = room.players[nextIndex];
  room.currentTurnPlayerId = nextPlayer.id;
  room.phraseToType = getRandomPhrase(room.phraseToType);
  room.roundNumber += 1;
  
  // Decrease timer limit as rounds progress to increase stress and speed!
  // Start with 12 seconds, drop by 1 second for every 3 rounds, minimum of 6 seconds
  const scaledTimer = Math.max(6, 12 - Math.floor(room.roundNumber / 3));
  room.timer = scaledTimer;
  room.maxTimer = scaledTimer;

  // Clear everyone's typed progress
  room.players.forEach(p => {
    p.typingProgress = "";
  });

  room.lastActionMessage = `👉 Turn started for ${nextPlayer.name}! Type fast!`;
}

// Rooms cleanup when inactive
setInterval(() => {
  const now = Date.now();
  // We can clean up empty rooms
  for (const [id, room] of rooms.entries()) {
    // If room has no human players (only bots or empty), cleanup
    const humanPlayers = room.players.filter(p => !p.isBot);
    if (humanPlayers.length === 0) {
      rooms.delete(id);
    }
  }
}, 60000);

// Active Rooms Game Loop tick (every 200ms for high-frequency updates / bots & timer)
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.status !== "playing") continue;

    const currentPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
    if (!currentPlayer || !currentPlayer.isAlive) {
      startNextTurn(room);
      broadcastToRoom(roomId, { type: "sync", room });
      continue;
    }

    // High frequency sub-second simulation for Bots
    if (currentPlayer.isBot) {
      const currentProgress = currentPlayer.typingProgress.length;
      const targetPhrase = room.phraseToType;
      
      if (currentProgress < targetPhrase.length) {
        // Bots type 1-4 chars depending on WPM settings
        // Average bot speed = 30-70 WPM. Let's make bot typing speed interactive.
        const charStep = currentPlayer.botSpeedWpm && currentPlayer.botSpeedWpm > 60 ? 3 : 2;
        // 40% probability per tick to type a step of text
        if (Math.random() < 0.4) {
          const nextLength = Math.min(targetPhrase.length, currentProgress + Math.round(Math.random() * charStep + 1));
          currentPlayer.typingProgress = targetPhrase.substring(0, nextLength);
          
          // Check if bot finished
          if (currentPlayer.typingProgress === targetPhrase) {
            // Success! Bot finished.
            currentPlayer.score += Math.round((room.timer / room.maxTimer) * 400) + 100;
            room.lastActionMessage = `🤖 ${currentPlayer.name} vented in time and survived!`;
            startNextTurn(room);
          }
          broadcastToRoom(roomId, { type: "sync", room });
        }
      }
    }
  }
}, 250);

// authoritative seconds loop (every 1000ms)
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.status !== "playing") continue;

    if (room.timer > 0) {
      room.timer -= 1;
      
      // If timer hits 0, automatic turn loss!
      if (room.timer === 0) {
        const currentPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
        if (currentPlayer) {
          currentPlayer.lives -= 1;
          currentPlayer.typingProgress = "";
          
          if (currentPlayer.lives <= 0) {
            currentPlayer.isAlive = false;
            room.lastActionMessage = `💥 Type-out! ${currentPlayer.name} ran out of time and ELIMINATED!`;
          } else {
            room.lastActionMessage = `⏳ Too slow! ${currentPlayer.name} ran out of time and lost a life! ❤️`;
          }
        }
        
        // Advance turn autonomously
        startNextTurn(room);
      }
      broadcastToRoom(roomId, { type: "sync", room });
    }
  }
}, 1000);

// WebSocket connection handling
wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (rawMessage: string) => {
    try {
      const msg: ClientMessage = JSON.parse(rawMessage);

      if (msg.type === "join") {
        const uppercaseRoomId = msg.roomId.trim().toUpperCase() || "LOBBY";
        const nickname = msg.name.trim() || `Rager_${Math.floor(100 + Math.random() * 900)}`;
        const playerId = `usr_${Math.random().toString(36).substr(2, 9)}`;

        let room = rooms.get(uppercaseRoomId);
        if (!room) {
          room = {
            id: uppercaseRoomId,
            players: [],
            status: "lobby",
            currentTurnPlayerId: null,
            phraseToType: getRandomPhrase(),
            timer: 12,
            maxTimer: 12,
            roundNumber: 0,
            winnerPlayerId: null,
            lastActionMessage: `Created room ${uppercaseRoomId}!`
          };
          rooms.set(uppercaseRoomId, room);
        }

        // Avoid name duplicates in same room
        const hasDuplicateName = room.players.some(p => p.name.toLowerCase() === nickname.toLowerCase());
        const uniqueName = hasDuplicateName ? `${nickname} #${room.players.length + 1}` : nickname;

        const newPlayer: Player = {
          id: playerId,
          name: uniqueName,
          score: 0,
          lives: 3,
          isBot: false,
          isAlive: true,
          typingProgress: "",
          isReady: false,
          avatarAccessory: msg.avatarAccessory || "Crown 👑",
          avatarColor: msg.avatarColor || "Pink 🌸",
          abilityUsed: false
        };

        room.players.push(newPlayer);
        clientConnections.set(ws, { roomId: uppercaseRoomId, playerId });

        room.lastActionMessage = `✨ ${uniqueName} slammed into the room!`;
        broadcastToRoom(uppercaseRoomId, { type: "sync", room });
      }

      const connection = clientConnections.get(ws);
      if (!connection) return;

      const { roomId, playerId } = connection;
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === playerId);

      if (msg.type === "add_bot" && player) {
        // Add a funny bot
        const botNames = [
          "Bubbly Bob 🫧",
          "Keyboard Smasher ⌨️",
          "Furious Fiona 😡",
          "Sassy Sam 💅",
          "Rage Monster 💀",
          "Coffee Jitter Jane ☕",
          "Mute Mic Mike 🎙️"
        ];
        
        // Filter out names already inside
        const existingNames = room.players.map(p => p.name);
        const availableNames = botNames.filter(name => !existingNames.includes(name));
        const finalBotName = availableNames.length > 0 ? availableNames[Math.floor(Math.random() * availableNames.length)] : `AI_Rager_${Math.floor(Math.random() * 100)}`;

        const BOT_ACCESSORIES = ["Crown 👑", "Heart Bow 🎀", "Sunglasses 🕶️", "Bubble Hat 🫧", "Floppy Ears 🐰"];
        const BOT_COLORS = ["Pink 🌸", "Peach 🍑", "Fuchsia 🔥", "Lavendar 🔮", "Sweet Melon 🍈"];

        const botPlayer: Player = {
          id: `bot_${Math.random().toString(36).substr(2, 9)}`,
          name: finalBotName,
          score: 0,
          lives: 3,
          isBot: true,
          botSpeedWpm: Math.floor(40 + Math.random() * 45), // 40-85 WPM speed
          isAlive: true,
          typingProgress: "",
          isReady: true,
          avatarAccessory: BOT_ACCESSORIES[Math.floor(Math.random() * BOT_ACCESSORIES.length)],
          avatarColor: BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)],
          abilityUsed: false
        };

        room.players.push(botPlayer);
        room.lastActionMessage = `🤖 Bot ${finalBotName} entered the chat to vent!`;
        broadcastToRoom(roomId, { type: "sync", room });
      }

      if (msg.type === "remove_player") {
        room.players = room.players.filter(p => p.id !== msg.id);
        
        // If current turn player was removed, restart turn
        if (room.currentTurnPlayerId === msg.id) {
          startNextTurn(room);
        }

        // If no non-bot players left, the room will be auto-cleaned
        room.lastActionMessage = `👋 A player was kicked or left.`;
        broadcastToRoom(roomId, { type: "sync", room });
      }

      if (msg.type === "start" && room.status !== "playing") {
        room.status = "playing";
        room.roundNumber = 0;
        room.winnerPlayerId = null;
        
        // Reset all player attributes
        room.players.forEach(p => {
          p.score = 0;
          p.lives = 3;
          p.isAlive = true;
          p.typingProgress = "";
          p.abilityUsed = false;
        });

        startNextTurn(room);
        room.lastActionMessage = "🔥 The Frustration Battle Has Begun! Get typing!";
        broadcastToRoom(roomId, { type: "sync", room });
      }

      if (msg.type === "typing" && player && room.status === "playing") {
        // Only active turn player can update state
        if (room.currentTurnPlayerId === player.id && player.isAlive) {
          player.typingProgress = msg.text;

          // Check if typing matches completely (case insensitive ignore trailing spaces for smooth play)
          const target = room.phraseToType.trim().toLowerCase();
          const typed = msg.text.trim().toLowerCase();

          if (typed === target) {
            // Success! Round matches perfectly
            // High scores based on speed remaining
            const timeElapsed = room.maxTimer - room.timer;
            const speedMultiplier = Math.max(1, 10 - timeElapsed); // higher if fast
            const pointsGained = speedMultiplier * 100 + 150;
            
            player.score += pointsGained;
            player.typingProgress = ""; // clear progress
            
            room.lastActionMessage = `✨ Success! ${player.name} vented successfully at speed! [+${pointsGained} pts]`;
            
            // Go to next turn
            startNextTurn(room);
          }
          broadcastToRoom(roomId, { type: "sync", room });
        }
      }

      if (msg.type === "reset_lobby") {
        room.status = "lobby";
        room.currentTurnPlayerId = null;
        room.winnerPlayerId = null;
        room.players.forEach(p => {
          p.score = 0;
          p.lives = 3;
          p.isAlive = true;
          p.typingProgress = "";
          p.abilityUsed = false;
        });
        room.lastActionMessage = "Lobby reset to preparation!";
        broadcastToRoom(roomId, { type: "sync", room });
      }

      if (msg.type === "pop_bubble") {
        globalBubblesPopped += msg.count;
        broadcastToRoom(roomId, { type: "bubble_popped_broadcast", total: globalBubblesPopped });
      }

      if (msg.type === "use_ability" && player && room.status === "playing") {
        if (room.currentTurnPlayerId === player.id && player.isAlive) {
          if (!player.abilityUsed) {
            player.abilityUsed = true;
            
            if (msg.abilityType === "shield") {
              // Bubble Shield adds 5 seconds to active turn countdown!
              room.timer = Math.min(18, room.timer + 5);
              room.lastActionMessage = `🫧 Bubble Bounce Activated! ${player.name} cushioned their timer (+5s)! 🛡️`;
            } else if (msg.abilityType === "screams") {
              // Frustration Scream registers shorter humorous random scream pattern phrase
              const funnyScreams = ["AAAAAARGH!", "BENT SCREAM!", "KAPOW!", "KEYSLAYER!", "SPLATTER!", "REEEEEEE!"];
              room.phraseToType = funnyScreams[Math.floor(Math.random() * funnyScreams.length)];
              player.typingProgress = "";
              room.lastActionMessage = `🗣️ Frustration Scream Activated! ${player.name} downscaled phrase difficulty!`;
            }
            
            broadcastToRoom(roomId, { type: "sync", room });
          }
        }
      }

    } catch (err) {
      console.error("WS error processing packet:", err);
    }
  });

  ws.on("close", () => {
    const info = clientConnections.get(ws);
    if (info) {
      const { roomId, playerId } = info;
      const room = rooms.get(roomId);
      if (room) {
        const p = room.players.find(x => x.id === playerId);
        room.players = room.players.filter(x => x.id !== playerId);
        
        if (p) {
          room.lastActionMessage = `💨 ${p.name} logged out in frustration.`;
        }

        // If the current turn player left, advance turn
        if (room.currentTurnPlayerId === playerId) {
          startNextTurn(room);
        }

        // Check winner status if players changed
        const activeAlives = room.players.filter(x => x.isAlive);
        if (room.status === "playing" && activeAlives.length <= 1) {
          // Trigger next turn logic to evaluate game ending condition
          startNextTurn(room);
        }

        broadcastToRoom(roomId, { type: "sync", room });
      }
      clientConnections.delete(ws);
    }
  });
});

// Serve API endpoints if any, e.g. health checks or state dumps
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", roomsCount: rooms.size, bubblesPopped: globalBubblesPopped });
});

// Configure Vite or Static Asset delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`RageType Server booting on http://0.0.0.0:${PORT}`);
  });
}

startServer();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, FormEvent, ChangeEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  Users,
  Trophy,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Smile,
  ShieldAlert,
  Hash,
  Heart,
  Plus,
  Send,
  Skull,
  User,
  LogOut,
  Keyboard,
  Info
} from "lucide-react";
import { Room, Player, ClientMessage, ServerMessage } from "./types";

// Dynamic sound synthesizer using modern Web Audio API
class AudioSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play a bouncy high pitch pop sound for a bubble burst
  playPop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sine";
      // Quick pitch sweep up & down
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Play brief satisfy typewriter key clicked pop
  playKeyPop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sine";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.02);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Ignored
    }
  }

  // Play Shield ability airy sparkly swell sounds
  playShield() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch (e) {
      // Ignored
    }
  }

  // Play Scream ability futuristic pitch sliding laser trigger
  playScream() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sawtooth";
      const now = this.ctx.currentTime;
      
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.28);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      // Ignored
    }
  }

  // Play a beautiful triumphant chime on successful typing completion
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.15, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Play a dramatic comic sliding failure note when running out of time
  playFailure() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sawtooth";
      const now = this.ctx.currentTime;
      
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.45);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // background music step loop scheduler
  private bgmInterval: any = null;
  private bgmTick = 0;
  public bgmRunning = false;

  toggleBGM() {
    this.initCtx();
    if (!this.ctx) return;

    if (this.bgmRunning) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  startBGM() {
    this.initCtx();
    if (!this.ctx) return;

    if (this.bgmRunning) return;
    this.bgmRunning = true;
    this.bgmTick = 0;

    // Pentatonic happy scale notes for bassline & arpeggio
    const bassline = [130.81, 146.83, 164.81, 196.00, 130.81, 146.83, 220.00, 196.00]; // C3, D3, E3, G3...
    const melody = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 261.63];

    // Tick sequencer interval: 175ms per step
    this.bgmInterval = setInterval(() => {
      if (!this.enabled || !this.bgmRunning || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.bgmTick % 16;

      try {
        // Play simple kick drum on beat 1, 5, 9, 13
        if (step % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          kickOsc.type = "triangle";
          kickOsc.frequency.setValueAtTime(150, now);
          kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
          kickGain.gain.setValueAtTime(0.22, now);
          kickGain.gain.linearRampToValueAtTime(0.001, now + 0.12);
          kickOsc.start(now);
          kickOsc.stop(now + 0.13);
        }

        // Play rolling bouncy bass elements
        if (step % 2 === 0) {
          const noteIndex = Math.floor(step / 2) % bassline.length;
          const bassFreq = bassline[noteIndex];

          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);
          bassOsc.type = "triangle";
          bassOsc.frequency.setValueAtTime(bassFreq, now);
          bassGain.gain.setValueAtTime(0.1, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          bassOsc.start(now);
          bassOsc.stop(now + 0.18);
        }

        // Play high bubbly arpeggios
        if (step % 8 === 2 || step % 8 === 5) {
          const melodyNote = melody[Math.floor(this.bgmTick / 2) % melody.length];
          const melOsc = this.ctx.createOscillator();
          const melGain = this.ctx.createGain();
          melOsc.connect(melGain);
          melGain.connect(this.ctx.destination);
          melOsc.type = "sine";
          melOsc.frequency.setValueAtTime(melodyNote * 1.5, now);
          melGain.gain.setValueAtTime(0.04, now);
          melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          melOsc.start(now);
          melOsc.stop(now + 0.13);
        }

        this.bgmTick++;
      } catch (e) {
        // Catch-all
      }
    }, 175);
  }

  stopBGM() {
    this.bgmRunning = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const synth = new AudioSynth();

// Accessories and color palettes options fitting the pink, bubbly aesthetics
export const AVATAR_ACCESSORIES = [
  { id: "Crown 👑", label: "Princess Crown 👑", emoji: "👑" },
  { id: "Heart Bow 🎀", label: "Sweetheart Bow 🎀", emoji: "🎀" },
  { id: "Sunglasses 🕶️", label: "Cool Sunglasses 🕶️", emoji: "🕶️" },
  { id: "Bubble Hat 🫧", label: "Bubble Cap 🫧", emoji: "🫧" },
  { id: "Floppy Ears 🐰", label: "Bunny Ears 🐰", emoji: "🐰" },
  { id: "Chef Hat 🧑‍🍳", label: "Spicy Chef 🧑‍🍳", emoji: "🧑‍🍳" },
  { id: "No Accessory 🦄", label: "Plain Unicorn 🦄", emoji: "" }
];

export const AVATAR_COLORS = [
  { id: "Pink 🌸", label: "Bubblegum Pink 🌸", bg: "bg-pink-100 border-pink-300 text-pink-700", ring: "ring-pink-200" },
  { id: "Peach 🍑", label: "Sandy Peach 🍑", bg: "bg-orange-100 border-orange-300 text-orange-700", ring: "ring-orange-200" },
  { id: "Fuchsia 🔥", label: "Fuchsia Flare 🔥", bg: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700", ring: "ring-fuchsia-200" },
  { id: "Midnight Blue 🔮", label: "Nebula Purple 🔮", bg: "bg-indigo-100 border-indigo-300 text-indigo-700", ring: "ring-indigo-200" },
  { id: "Sweet Melon 🍈", label: "Honey Melon 🍈", bg: "bg-emerald-100 border-emerald-300 text-emerald-700", ring: "ring-emerald-200" }
];

export const renderPlayerAvatar = (p: Player, sizeClass = "w-10 h-10 text-base") => {
  const isBot = p.isBot;
  const col = AVATAR_COLORS.find(c => c.id === p.avatarColor) || AVATAR_COLORS[0];
  const acc = AVATAR_ACCESSORIES.find(a => a.id === p.avatarAccessory) || AVATAR_ACCESSORIES[0];
  const smiley = isBot ? "🤖" : (p.lives <= 1 ? "😭" : "😄");

  return (
    <div className={`relative ${sizeClass} rounded-full flex items-center justify-center border-2 shadow-sm shrink-0 animate-wiggle select-none ${isBot ? "bg-purple-100 border-purple-300 text-purple-700" : col.bg}`}>
      {!isBot && acc.emoji && (
        <span className="absolute -top-3.5 text-base drop-shadow-sm select-none z-10 animate-pulse">
          {acc.emoji}
        </span>
      )}
      <span className="font-extrabold select-none">{smiley}</span>
    </div>
  );
};

// Hardcoded background bubble bubbles for decorative playground setup
interface FloatingBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

const INITIAL_DECORATIVE_BUBBLES: FloatingBubble[] = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 40 + 20,
  color: ["bg-pink-200/40", "bg-rose-200/40", "bg-red-200/30", "bg-pink-300/30"][Math.floor(Math.random() * 4)],
  speed: Math.random() * 8 + 5
}));

export default function App() {
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem("ragetype_name") || "";
  });
  const [avatarAccessory, setAvatarAccessory] = useState(() => {
    return localStorage.getItem("ragetype_accessory") || "Crown 👑";
  });
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem("ragetype_color") || "Pink 🌸";
  });
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [roomId, setRoomId] = useState("PEEVES");
  const [isJoined, setIsJoined] = useState(false);
  
  // Game synchronization state
  const [roomState, setRoomState] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [currentTotalBubbles, setCurrentTotalBubbles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active user typed key monitoring
  const [typedValue, setTypedValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Stress relief virtual bubble wrap component configuration
  const [localBubbles, setLocalBubbles] = useState(() => 
    Array.from({ length: 12 }).map((_, idx) => ({
      id: idx,
      popped: false,
      emoji: ["🤪", "😡", "😤", "🤬", "🤯", "🔥", "💢", "💔", "😮", "👾", "💀", "⏳"][idx % 12],
      wiggleDelay: Math.random() * 2
    }))
  );

  // Pop burst floating text visual effect state array
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const particleIdCounter = useRef(0);

  // Keep track of the last action message alert toast
  const [actionAlert, setActionAlert] = useState("");

  const activeTurnPlayer = roomState?.players.find(p => p.id === roomState.currentTurnPlayerId);
  const isMyTurn = roomState && roomState.status === "playing" && activeTurnPlayer && !activeTurnPlayer.isBot && 
                    roomState.players.find(p => p.name === nickname)?.id === roomState.currentTurnPlayerId;

  // Track the ID of local human player to distinguish easily
  const localPlayer = roomState?.players.find(p => p.name === nickname);

  // Stop background music on unmount
  useEffect(() => {
    return () => {
      synth.stopBGM();
    };
  }, []);

  // Handle setting up WebSocket loop
  useEffect(() => {
    if (!isJoined) return;

    // Connect automatically using appropriate protocols
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      // Immediately register matching user
      const joinMsg: ClientMessage = {
        type: "join",
        roomId: roomId.trim().toUpperCase(),
        name: nickname,
        avatarAccessory,
        avatarColor
      };
      socket.send(JSON.stringify(joinMsg));
    };

    socket.onmessage = (event) => {
      try {
        const payload: ServerMessage = JSON.parse(event.data);
        if (payload.type === "sync") {
          const oldState = roomState;
          setRoomState(payload.room);
          
          if (payload.room.lastActionMessage) {
            setActionAlert(payload.room.lastActionMessage);
          }

          // Trigger appropriate synthesizers upon event swaps
          if (oldState) {
            const oldTurn = oldState.currentTurnPlayerId;
            const newTurn = payload.room.currentTurnPlayerId;
            
            // Check success chime
            if (oldTurn !== newTurn && newTurn !== null) {
              const prevPlayer = oldState.players.find(p => p.id === oldTurn);
              const nextPlayer = payload.room.players.find(p => p.id === newTurn);
              
              if (prevPlayer && prevPlayer.isAlive) {
                // If turn passed and previous player is alive, they completed the phrase successfully!
                synth.playSuccess();
              }
            }
            
            // Look for sudden live deductions
            payload.room.players.forEach(newP => {
              const oldP = oldState.players.find(o => o.id === newP.id);
              if (oldP && newP.lives < oldP.lives) {
                synth.playFailure();
              }
            });
          }
        } else if (payload.type === "bubble_popped_broadcast") {
          setCurrentTotalBubbles(payload.total);
        } else if (payload.type === "error") {
          alert(`Server Error: ${payload.message}`);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      // Attempt reconnect with exponential backing
      const timeout = setTimeout(() => {
        setReconnectCount(c => c + 1);
      }, Math.min(10000, 1000 * (reconnectCount + 1)));
      return () => clearTimeout(timeout);
    };

    socket.onerror = (e) => {
      console.error("WS connection error occurred:", e);
    };

    return () => {
      socket.close();
    };
  }, [isJoined, reconnectCount]);

  // Focus typing box automatically when turn triggers
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
      setTypedValue("");
    }
  }, [isMyTurn]);

  // Keep nickname stored
  const saveNicknameAndLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    localStorage.setItem("ragetype_name", nickname.trim());
    setIsJoined(true);
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    
    // Bubbly character click feedback
    if (text.length > typedValue.length) {
      synth.playKeyPop();
    }
    setTypedValue(text);

    // Sync state over WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        text
      }));
    }
  };

  const useAbility = (abilityType: 'shield' | 'screams') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (abilityType === 'shield') {
        synth.playShield();
      } else {
        synth.playScream();
      }
      wsRef.current.send(JSON.stringify({
        type: "use_ability",
        abilityType
      }));
    }
  };

  const toggleMusic = () => {
    synth.toggleBGM();
    setBgmPlaying(synth.bgmRunning);
  };

  const addBot = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "add_bot" }));
    }
  };

  const startGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start" }));
    }
  };

  const resetLobby = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset_lobby" }));
    }
  };

  const leaveRoom = () => {
    setIsJoined(false);
    setRoomState(null);
    setTypedValue("");
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Stress-relief bubble wrap handler
  const popBubble = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    // Already popped? Let's resurrect it after 2 seconds to make it a continuous popping experience!
    const targetBubble = localBubbles.find(b => b.id === id);
    if (!targetBubble || targetBubble.popped) return;

    // Spark sound!
    synth.playPop();

    // Spawn floating emoji particle
    const rect = e.currentTarget.getBoundingClientRect();
    const newParticle = {
      id: particleIdCounter.current++,
      x: rect.left + rect.width / 2 - 12,
      y: rect.top - 15,
      text: targetBubble.emoji
    };
    setParticles(p => [...p, newParticle]);

    // Cleanup particle
    setTimeout(() => {
      setParticles(p => p.filter(x => x.id !== newParticle.id));
    }, 1200);

    // Modify local state
    setLocalBubbles(bubbles =>
      bubbles.map(b => (b.id === id ? { ...b, popped: true } : b))
    );

    // Set auto-regeneration timeout of 2.2 seconds for ultimate gameplay longevity
    setTimeout(() => {
      setLocalBubbles(bubbles =>
        bubbles.map(b => (b.id === id ? { ...b, popped: false } : b))
      );
    }, 2200);

    // Sync to server global ranking count
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "pop_bubble", count: 1 }));
    }
  };

  // Toggle sound synth helper
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    synth.enabled = nextState;
  };

  // Helper method: colorizes the target text compared to user typing
  const renderInteractivePrompt = (targetPhrase: string, userTyped: string) => {
    const letters = targetPhrase.split("");
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1 text-2xl font-extrabold tracking-wide text-center leading-relaxed font-sans max-w-full">
        {letters.map((char, index) => {
          let color = "text-pink-300"; // not typed
          let decoration = "";

          if (index < userTyped.length) {
            if (userTyped[index].toLowerCase() === char.toLowerCase()) {
              color = "text-pink-600 bg-pink-100 px-0.5 rounded"; // correct
            } else {
              color = "text-red-500 bg-red-100 px-0.5 rounded animate-pulse"; // incorrect
              decoration = "underline decoration-wavy decoration-red-600";
            }
          }

          // Active indicator
          const isActiveIndex = index === userTyped.length;

          return (
            <span
              key={index}
              className={`transition-all duration-100 ${color} ${decoration} ${
                isActiveIndex ? "border-b-4 border-fuchsia-600 inline-block scale-105" : ""
              }`}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div id="ragetype-wrapper" className="relative min-h-screen py-6 px-4 md:px-8 select-none bg-rose-50 text-slate-800 font-sans">
      
      {/* Decorative floating bubbles in background to keep design soft, pink, and absolutely bubbly */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {INITIAL_DECORATIVE_BUBBLES.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute rounded-full animate-wiggle opacity-20 ${bubble.color}`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.id * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Floaters of bubble burst emojis */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: p.y, scale: 0.8 }}
              animate={{ opacity: 0, y: p.y - 140, scale: 2.2, rotate: Math.random() * 60 - 30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute text-3xl font-bold select-none drop-shadow-md"
              style={{ left: p.x }}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Header Bar */}
      <header className="relative max-w-6xl mx-auto mb-6 flex items-center justify-between bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-pink-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div id="btn-logo-bounce" className="w-10 h-10 bg-gradient-to-tr from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-md cursor-pointer select-none animate-bubble-bounce">
            🫧
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 bg-clip-text text-transparent">
              RageType
            </h1>
            <p className="text-xs font-semibold text-rose-400">Venting Frustration at Lightspeed 🚀</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 bg-pink-100 text-pink-700 font-bold px-3 py-1 rounded-full text-xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>{currentTotalBubbles || 0} Bubbles Smacked!</span>
          </div>

          {/* Bubbly background loop selector */}
          <button
            id="btn-music-toggle"
            onClick={toggleMusic}
            className={`p-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              bgmPlaying
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 animate-wiggle"
                : "bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100"
            }`}
            title={bgmPlaying ? "Stop Bubbly Beats Loop" : "Play Bubbly Beats Loop"}
          >
            <span className={bgmPlaying ? "animate-spin inline-block" : "inline-block"}>🎵</span>
            <span className="hidden leading-none md:inline">{bgmPlaying ? "Beats On" : "Beats Loop"}</span>
          </button>
          
          <button
            id="btn-sound-toggle"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100 transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Game Sound FX" : "Enable Game Sound FX"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* App body switches content based on whether user has joined room */}
      <main className="relative max-w-6xl mx-auto grid grid-cols-1 z-10">
        <AnimatePresence mode="wait">
          {!isJoined ? (
            /* LOBBY REGISTER / ENTER SCREEN */
            <motion.div
              key="join-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto w-full bg-white/90 backdrop-blur-md p-8 rounded-3xl border-4 border-pink-200 shadow-xl flex flex-col items-center animate-fade-in"
            >
              {/* Dynamic live avatar preview */}
              <div className="mb-4">
                {renderPlayerAvatar({
                  id: "preview",
                  name: nickname || "AngryCoder 💅",
                  score: 0,
                  lives: 3,
                  isBot: false,
                  isAlive: true,
                  typingProgress: "",
                  isReady: true,
                  avatarAccessory,
                  avatarColor
                }, "w-24 h-24 text-3xl")}
              </div>

              <h2 className="text-3xl font-extrabold text-pink-900 text-center mb-1 tracking-tight">
                Got Frustrations?
              </h2>
              <p className="text-sm text-slate-500 text-center mb-5 px-4">
                Scream-type hilarious rants with friends! <span className="font-bold text-pink-500">Fastest typer wins</span>. Slow players automatically lose their turn and hearts!
              </p>

              <form onSubmit={saveNicknameAndLobby} className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-pink-600 uppercase tracking-widest mb-1 ml-1">
                    Your Nickname
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-pink-400" />
                    <input
                      id="input-nickname"
                      type="text"
                      maxLength={18}
                      placeholder="e.g. AngryCoder 💅"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-500 font-semibold bg-pink-50/50"
                      required
                    />
                  </div>
                </div>

                {/* ADORABLE CUSTOM BUBBLY AVATAR CONFIGURATION PANEL */}
                <div className="bg-pink-50/55 p-4 rounded-2xl border-2 border-pink-100 space-y-3">
                  <div className="text-xs font-black text-pink-700 tracking-wider uppercase text-center border-b border-pink-100 pb-1.5 mb-1">
                    🦄 CUSTOMIZE YOUR BUBBLY AVATAR 🦄
                  </div>
                  
                  {/* Accessories grid */}
                  <div>
                    <span className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1.5 text-center sm:text-left">
                      Bubbly Accessory
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {AVATAR_ACCESSORIES.map(acc => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setAvatarAccessory(acc.id);
                            localStorage.setItem("ragetype_accessory", acc.id);
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all hover:scale-105 cursor-pointer ${
                            avatarAccessory === acc.id
                              ? "bg-pink-500 border-pink-600 text-white scale-110 shadow-sm"
                              : "bg-white border-pink-200 hover:bg-pink-100/50 text-slate-700"
                          }`}
                          title={acc.label}
                        >
                          {acc.emoji || "❌"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors grid */}
                  <div>
                    <span className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1.5 text-center sm:text-left">
                      Avatar Color Palette
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {AVATAR_COLORS.map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            setAvatarColor(color.id);
                            localStorage.setItem("ragetype_color", color.id);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                            avatarColor === color.id
                              ? "bg-pink-500 text-white border-pink-600 scale-105 shadow-sm"
                              : `${color.bg} border-pink-200 hover:opacity-80`
                          }`}
                        >
                          {color.id.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-pink-600 uppercase tracking-widest mb-1 ml-1">
                    Room Code (Join / Create)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-3.5 w-5 h-5 text-pink-400" />
                    <input
                      id="input-roomid"
                      type="text"
                      maxLength={8}
                      placeholder="e.g. PEEVES"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-500 font-extrabold tracking-widest text-slate-700 bg-pink-50/50 uppercase"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-join-battle"
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 active:scale-[0.98] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2 text-lg border-b-4 border-pink-700 cursor-pointer"
                >
                  <Keyboard className="w-5 h-5" />
                  <span>SLYLY ENTER ROOM 👑</span>
                </button>
              </form>

              {/* Stress-buster interactive element located directly on entry for immediate relief */}
              <div className="mt-8 pt-6 w-full border-t-2 border-pink-50">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="text-xs font-extrabold text-pink-700 tracking-widest uppercase flex items-center gap-1">
                    <Smile className="w-4 h-4 text-pink-500" />
                    <span>Instant Anger Relief Bubble</span>
                  </h3>
                  <span className="text-xs font-bold text-rose-400">Tap to pop!</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {localBubbles.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      onClick={(e) => popBubble(b.id, e)}
                      disabled={b.popped}
                      className={`h-11 rounded-xl transition-all duration-150 flex items-center justify-center text-xl font-bold border ${
                        b.popped
                          ? "bg-pink-100/30 border-transparent text-pink-300 scale-90"
                          : "bg-pink-100 hover:bg-pink-200 border-pink-200 shadow-sm active:scale-90"
                      }`}
                    >
                      {b.popped ? "🫧" : b.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ACTIVE MULTIPLAYER PLAYGROUND CONTAINER */
            <motion.div
              key="game-playground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* LEFT SIDE: LOBBY & PLAYER ROSTER STATUS (Width 1 Column equivalent on desktop) */}
              <div className="lg:col-span-1 flex flex-col gap-5">
                <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border-2 border-pink-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-pink-500" />
                      <h2 className="font-extrabold text-slate-800 tracking-tight">Active Ragers</h2>
                    </div>
                    <span className="bg-rose-500 text-white font-extrabold px-2.5 py-0.5 rounded-full text-xs tracking-widest">
                      {roomState?.id || roomId}
                    </span>
                  </div>

                  {/* Player item mapping list */}
                  <div className="space-y-3 max-h-[290px] overflow-y-auto pr-2">
                    {roomState?.players.map((p) => {
                      const isActiveTurn = roomState.currentTurnPlayerId === p.id && roomState.status === "playing";
                      const isMe = p.name === nickname;

                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-150 ${
                            isActiveTurn
                              ? "bg-pink-50 border-pink-400 shadow-md ring-2 ring-pink-200 ring-offset-1"
                              : "bg-pink-50/30 border-pink-100"
                          } ${!p.isAlive ? "opacity-60 bg-gray-50 border-gray-100" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Customizable Bubbly Avatar rendering */}
                            {renderPlayerAvatar(p, "w-10 h-10")}

                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate ${isMe ? "text-rose-600 font-extrabold" : "text-slate-800"}`}>
                                {p.name} {isMe && "(You)"}
                              </p>
                              {/* Bottom WPM indicator or stats */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold text-rose-500 tracking-wide">
                                  🏆 {p.score} pts
                                </span>
                                {p.isBot && (
                                  <span className="text-[9px] px-1 bg-purple-50 text-purple-700 rounded border border-purple-200">
                                    {p.botSpeedWpm} WPM
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Lives visualization or status */}
                          <div className="flex items-center gap-1 shrink-0">
                            {p.isAlive ? (
                              Array.from({ length: 3 }).map((_, i) => (
                                <Heart
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < p.lives ? "fill-rose-500 text-rose-500" : "text-gray-300"
                                  }`}
                                />
                              ))
                            ) : (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500">
                                <Skull className="w-3.5 h-3.5 text-gray-400" /> ELIMINATED
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(!roomState || roomState.players.length === 0) && (
                      <p className="text-xs font-semibold text-slate-400 italic text-center py-4">No active players joined yet.</p>
                    )}
                  </div>

                  {/* Add simulated bot button in waiting or active game lobby states */}
                  {roomState && roomState.status !== "playing" && (
                    <button
                      id="btn-add-bot"
                      onClick={addBot}
                      className="mt-4 w-full border-2 border-dashed border-pink-300 text-pink-600 hover:border-pink-500 hover:bg-pink-50 rounded-2xl py-2 px-3 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>POFF! ADD AI BOT RAGER</span>
                    </button>
                  )}
                </div>

                {/* Connection helper panel and quick room leave/action logs */}
                <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border-2 border-pink-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-xs uppercase text-pink-500 tracking-widest mb-2">Room Diagnostics</h3>
                    <div className="space-y-1 text-xs">
                      <p className="flex justify-between font-semibold">
                        <span>Connection Status:</span>
                        <span className={`font-bold transition-all ${isConnected ? "text-emerald-500" : "text-rose-500 animate-pulse"}`}>
                          {isConnected ? "● ENGAGED" : "○ RECONNECTING..."}
                        </span>
                      </p>
                      <p className="flex justify-between font-semibold text-slate-500">
                        <span>Room size total:</span>
                        <span className="font-bold text-slate-700">{roomState?.players.length ?? 0} Players</span>
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-leave-room"
                    onClick={leaveRoom}
                    className="mt-4 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-rose-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>QUIT TO ENTRANCE</span>
                  </button>
                </div>
              </div>

              {/* CENTER WORKSPACE: GAME STATE & ACTIVE BOARD (Width 2 Columns equivalent) */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-4 border-pink-200 shadow-lg flex flex-col justify-between min-h-[450px]">
                  
                  {/* Active room states */}
                  {roomState && roomState.status === "lobby" && (
                    <div className="flex flex-col items-center justify-center text-center py-6 h-full my-auto space-y-6">
                      <div className="w-16 h-16 rounded-full bg-pink-100 border-2 border-pink-300 flex items-center justify-center text-3xl animate-bounce">
                        🎈
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-extrabold text-pink-950 mb-1">Welcome to the Vent Lobby!</h3>
                        <p className="text-sm text-slate-500 max-w-sm">
                          Invite friends to join room <span className="font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">{roomId}</span> or test your raw speed against bots!
                        </p>
                      </div>

                      {/* Action trigger button */}
                      <button
                        id="btn-start-game"
                        onClick={startGame}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-lg py-4 px-12 rounded-2xl shadow-lg border-b-4 border-pink-700 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        <span>START MULTIPLAYER BATTLE 🏁</span>
                      </button>

                      <div className="text-xs bg-rose-50 text-rose-700 font-semibold px-4 py-2.5 rounded-xl border border-rose-100 max-w-sm">
                        🚨 <span className="font-bold">Rule of Thumb:</span> Make sure you match the casing and spelling EXACTLY under the strict countdown. Type slow = Lose turn automatically!
                      </div>
                    </div>
                  )}

                  {roomState && roomState.status === "playing" && (
                    <div className="space-y-6 h-full flex flex-col justify-between">
                      {/* Active Heading Banner */}
                      <div className="flex items-center justify-between border-b-2 border-pink-50 pb-4">
                        <div>
                          <span className="text-[10px] bg-pink-100 border border-pink-200 text-pink-700 font-extrabold tracking-widest px-2.5 py-1 rounded-full uppercase">
                            ROUND {roomState.roundNumber} OF VENTING
                          </span>
                          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mt-1">
                            {isMyTurn ? (
                              <span className="text-rose-600 animate-pulse flex items-center gap-1.5">
                                <Zap className="w-5 h-5 fill-rose-500 text-rose-500" />
                                YOUR TURN! RELEASE YOUR ANGER!
                              </span>
                            ) : (
                              <span>
                                Active Typer: <span className="text-pink-600 font-extrabold">{activeTurnPlayer?.name || "Initializing..."}</span>
                              </span>
                            )}
                          </h3>
                        </div>

                        {/* Top WPM display or similar */}
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-slate-400">Survival Timer</span>
                          <span className="text-2xl font-extrabold text-pink-600 tracking-tighter">
                            ⏱️ {roomState.timer}s
                          </span>
                        </div>
                      </div>

                      {/* Autorun countdown graphical element */}
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full ${
                            roomState.timer > 6
                              ? "bg-gradient-to-r from-emerald-400 to-green-500"
                              : roomState.timer > 3
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                              : "bg-gradient-to-r from-rose-500 to-red-600 animate-pulse"
                          }`}
                          style={{ width: `${(roomState.timer / roomState.maxTimer) * 100}%` }}
                        />
                      </div>

                      {/* Display of Sentence Target to Type with colorful letters */}
                      <div className="my-3 py-6 px-4 bg-pink-50/50 rounded-2xl border-2 border-dashed border-pink-100 flex items-center justify-center min-h-[140px] shadow-inner relative overflow-hidden">
                        <div className="absolute top-2 left-3 text-[10px] font-extrabold uppercase text-pink-400 tracking-widest">
                          QUICKLY TYPE THIS RANT IN COGNIZANTE:
                        </div>
                        {renderInteractivePrompt(roomState.phraseToType, isMyTurn ? typedValue : activeTurnPlayer?.typingProgress || "")}
                      </div>

                      {/* Multiplayer view representing typing progress bar for all live participants as they type */}
                      <div className="space-y-2 bg-pink-50/20 p-4 rounded-xl border border-pink-100">
                        <div className="text-xs font-bold text-pink-700 uppercase tracking-widest mb-1">
                          Live Progress Tracker 👁️
                        </div>
                        {roomState.players.filter(p => p.isAlive).map((p) => {
                          const percentage = Math.min(
                            100,
                            Math.round(
                              ((p.id === roomState.currentTurnPlayerId
                                ? (isMyTurn ? typedValue : p.typingProgress).length
                                : p.typingProgress.length) /
                                (roomState.phraseToType.length || 1)) *
                                100
                            )
                          );

                          return (
                            <div key={p.id} className="flex items-center gap-3 text-xs">
                              {renderPlayerAvatar(p, "w-8 h-8")}
                              <span className="font-bold text-slate-700 w-20 truncate shrink-0">{p.name}</span>
                              <div className="grow bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-pink-500 rounded-full transition-all duration-200"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="font-bold text-pink-600 text-[10px] w-8 text-right shrink-0">
                                {percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Interactive text typing field section */}
                      <div className="pt-2">
                        {isMyTurn ? (
                          <div className="space-y-1">
                            <input
                              id="input-game-phrase-type"
                              ref={inputRef}
                              type="text"
                              value={typedValue}
                              onChange={handleTypingChange}
                              placeholder="MATCH THE CASE EXACTLY... GO GO GO!"
                              className="w-full text-lg font-bold text-center px-4 py-3.5 rounded-2xl border-4 border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-200 bg-white placeholder-pink-300 shadow-md text-slate-800"
                              autoFocus
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                            />
                            <p className="text-[11px] text-rose-500 font-extrabold text-center tracking-widest uppercase animate-bounce mt-1">
                              ⚠️ QUICK! Match capitals and punctuation exactly to claim victory!
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm text-slate-500 italic font-semibold">
                            <span>
                              ⏳ Hang tight! <span className="font-extrabold text-pink-600">{activeTurnPlayer?.name}</span> is currently typing under high stress...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Special Abilities Bento Section */}
                      {roomState && localPlayer && localPlayer.isAlive && !localPlayer.abilityUsed && (
                        <div className="bg-pink-100/40 p-4 border-2 border-dashed border-pink-300 rounded-3xl mt-4 flex flex-col items-center animate-wiggle">
                          <span className="text-[10px] font-black text-pink-700 tracking-widest uppercase mb-2">
                            🦄 RECOVER FRUSTRATION SPECIAL ACTION (1x PER ROUND)
                          </span>
                          <div className="grid grid-cols-2 gap-3 w-full">
                            <button
                              id="btn-use-shield"
                              onClick={() => useAbility('shield')}
                              className="p-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold rounded-2xl text-xs flex flex-col items-center text-center gap-1 border-b-2 border-pink-600 active:scale-95 shadow-sm cursor-pointer"
                            >
                              <span className="text-xl">🫧</span>
                              <span>BUBBLE SHIELD (+5s)</span>
                            </button>
                            <button
                              id="btn-use-scream"
                              onClick={() => useAbility('screams')}
                              className="p-3 bg-gradient-to-r from-rose-400 to-fuchsia-400 hover:from-rose-500 hover:to-fuchsia-500 text-white font-extrabold rounded-2xl text-xs flex flex-col items-center text-center gap-1 border-b-2 border-rose-600 active:scale-95 shadow-sm cursor-pointer"
                            >
                              <span className="text-xl">🗣️</span>
                              <span>FRUSTRATION SCREAM</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {roomState && roomState.status === "ended" && (
                    <div className="flex flex-col items-center justify-center text-center py-6 h-full my-auto space-y-6">
                      <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-5xl mb-2 animate-bounce border-2 border-pink-200">
                        🏆
                      </div>

                      {roomState.winnerPlayerId ? (
                        <div>
                          <h3 className="text-3xl font-black text-pink-900 tracking-tight">
                            We Have A Champ!
                          </h3>
                          <p className="text-base font-bold text-rose-500 mt-1">
                            👑 {roomState.players.find(p => p.id === roomState.winnerPlayerId)?.name} dominated the key slammer arena!
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-3xl font-black text-rose-950 tracking-tight">
                            Double Elimination!
                          </h3>
                          <p className="text-sm font-semibold text-slate-500 mt-1">
                            Everyone was simply too slow and got bonked or lost all their hearts!
                          </p>
                        </div>
                      )}

                      {/* Final Scoreboard Roster list */}
                      <div className="bg-pink-50/50 p-4 border border-pink-100 rounded-2xl w-full max-w-sm text-left">
                        <div className="flex items-center gap-1 text-pink-800 font-extrabold text-xs tracking-wider uppercase mb-2 border-b border-pink-100 pb-1.5 justify-center">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span>Final Rage Battle Scoreboard</span>
                        </div>
                        <div className="space-y-2">
                          {roomState.players
                            .sort((a, b) => b.score - a.score)
                            .map((p, idx) => (
                              <div key={p.id} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-pink-50 last:border-none">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-black text-pink-400">#{idx + 1}</span>
                                  {renderPlayerAvatar(p, "w-7 h-7")}
                                  <span className={`truncate ${idx === 0 ? "text-pink-700 font-extrabold text-sm" : "text-slate-600"}`}>
                                    {p.name} {p.isBot && "(AI)"}
                                  </span>
                                </div>
                                <span className="font-black text-slate-700 shrink-0">{p.score} pts</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <button
                          id="btn-play-again"
                          onClick={startGame}
                          className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-extrabold py-3 px-4 rounded-xl shadow transition-transform active:scale-95 text-sm"
                        >
                          PLAY AGAIN 🔁
                        </button>
                        <button
                          id="btn-back-lobby-reset"
                          onClick={resetLobby}
                          className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-xl shadow transition-transform active:scale-95 text-sm"
                        >
                          BACK TO LOBBY
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom interactive action toast feedback ticker */}
                {actionAlert && (
                  <div className="bg-pink-900 text-pink-50 px-4 py-3 rounded-2xl border-2 border-pink-950 font-bold text-xs tracking-wide shadow flex items-center justify-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-pink-300 animate-pulse" />
                    <span className="truncate">{actionAlert}</span>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: BUBBLE WRAP & EXTRA SHENANIGANS STRESS RELEASE TOOL (Width 1 Column equivalent) */}
              <div className="lg:col-span-1 flex flex-col gap-5">
                
                {/* Bubble wrap widget card */}
                <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-5 rounded-3xl border-2 border-pink-200 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Smile className="w-4.5 h-4.5 text-pink-600" />
                      <h3 className="font-extrabold text-sm text-pink-950 tracking-tight">Anger Release Bubble-Wrap</h3>
                    </div>
                    <p className="text-[11px] font-medium text-pink-700 mb-4 tracking-normal leading-normal">
                      Are you currently stressed, frustrated or waiting for your turn? Smash, pop or stomp on these cute smiley bubbles below! They regenerate magically in seconds!
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {localBubbles.map((b) => (
                        <button
                          key={b.id}
                          onClick={(e) => popBubble(b.id, e)}
                          disabled={b.popped}
                          className={`h-14 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all bg-white shadow-sm border border-pink-200 cursor-pointer active:scale-90 select-none ${
                            b.popped
                              ? "bg-rose-100/30 border-transparent text-pink-300 scale-90 duration-300 select-none pointer-events-none"
                              : "hover:bg-rose-50 active:bg-rose-100 animate-pulse"
                          }`}
                          style={{
                            animationDelay: `${b.wiggleDelay}s`,
                            animationDuration: "3s"
                          }}
                        >
                          {b.popped ? "🫧" : b.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-pink-300/40 text-center">
                    <span className="text-[10px] font-extrabold text-pink-800 tracking-widest uppercase">
                      Worldwide Popped Stat
                    </span>
                    <p className="text-3xl font-black text-rose-600 tracking-tight mt-0.5">
                      {currentTotalBubbles || 0}
                    </p>
                    <span className="text-[9px] font-bold text-pink-700/70">
                      Popped collaboratively by players
                    </span>
                  </div>
                </div>

                {/* Funny Frustration quotes widget advice board */}
                <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border-2 border-pink-100 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                    <h3 className="font-extrabold text-xs text-rose-900 uppercase tracking-wider">Antidote to Keyboard Smash</h3>
                  </div>
                  <ul className="space-y-2 text-[11px] leading-relaxed text-slate-500 font-semibold list-disc pl-3">
                    <li>Type immediately when the turn alerts! Slow play gets you timed-out at once.</li>
                    <li>Bots type with high focus—do not underestimate human-vs-machine battles!</li>
                    <li>Slamming keys might ruin your laptop spacebar—smack the bubbles in the column instead!</li>
                  </ul>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Humble footer */}
      <footer className="mt-12 text-center text-[11px] text-rose-400 font-semibold select-none">
        <p>RageType is a playful, private and free fast-typing playground constructed with pink bubbly magic.</p>
        <p className="mt-1">© 2026 RageType Inc. Make keystrokes, not quiet resentment. 🫧</p>
      </footer>

    </div>
  );
}

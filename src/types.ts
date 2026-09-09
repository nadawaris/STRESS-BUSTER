export interface Player {
  id: string;
  name: string;
  score: number;
  lives: number;
  isBot: boolean;
  botSpeedWpm?: number;
  isAlive: boolean;
  typingProgress: string; // The text typed so far
  isReady: boolean;
  avatarAccessory?: string; // e.g., 'crown', 'sunglasses', 'bubbly_hat'
  avatarColor?: string; // Tailwind color class name or hex code representation
  abilityUsed?: boolean; // track if player has used ability this match
}

export interface Room {
  id: string;
  players: Player[];
  status: 'lobby' | 'playing' | 'ended';
  currentTurnPlayerId: string | null;
  phraseToType: string;
  timer: number;
  maxTimer: number;
  roundNumber: number;
  winnerPlayerId: string | null;
  lastActionMessage: string;
}

export type ClientMessage =
  | { type: 'join'; roomId: string; name: string; avatarAccessory?: string; avatarColor?: string }
  | { type: 'start' }
  | { type: 'typing'; text: string }
  | { type: 'add_bot'; botName: string }
  | { type: 'remove_player'; id: string }
  | { type: 'reset_lobby' }
  | { type: 'pop_bubble'; count: number }
  | { type: 'use_ability'; abilityType: 'shield' | 'screams' };

export type ServerMessage =
  | { type: 'sync'; room: Room }
  | { type: 'error'; message: string }
  | { type: 'bubble_popped_broadcast'; total: number };

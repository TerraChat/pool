
export type BallType = 'cue' | 'solid' | 'stripe' | '8ball';

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  num: number;
  type: BallType;
  inPocket: boolean;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export type GameMode = 'local' | 'robot' | 'online';
export type PlayerRole = 'host' | 'guest' | null;

export interface GameState {
  currentTurn: 1 | 2;
  balls: Ball[];
  p1Type: BallType | null;
  p2Type: BallType | null;
  tableOpen: boolean;
  status: string;
  gameOver: boolean;
  winner: 1 | 2 | null;
}

export interface RoomData {
  players: string[];
  status: 'waiting' | 'playing';
  turn: 1 | 2;
  shot?: {
    vx: number;
    vy: number;
    angle: number;
    t: number;
  };
}

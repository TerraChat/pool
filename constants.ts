
export const TABLE_WIDTH = 900;
export const TABLE_HEIGHT = 480;
export const RAIL_SIZE = 36;
export const PLAY_AREA_W = TABLE_WIDTH - (RAIL_SIZE * 2);
export const PLAY_AREA_H = TABLE_HEIGHT - (RAIL_SIZE * 2);

export const BALL_RADIUS = 13;
export const POCKET_RADIUS = 30;

// Physics Tunings
export const SUB_STEPS = 12;
export const RESTITUTION = 0.98; // High bounciness
export const RAIL_RESTITUTION = 0.75;
export const FRICTION = 0.985; // Drag per frame (approx)
export const DRAG_PER_STEP = 0.006; 
export const STOP_VELOCITY = 0.05;
export const MAX_POWER = 55;

export const THEME_COLOR = '#06b6d4'; // Electric Cyan

export const BALL_COLORS: Record<number, string> = {
  0: '#ffffff', // Cue
  1: '#facc15', // Yellow (Standard)
  2: '#2563eb', // Blue
  3: '#dc2626', // Red
  4: '#7c3aed', // Purple
  5: '#ea580c', // Orange
  6: '#16a34a', // Green
  7: '#991b1b', // Maroon
  8: '#111111', // Black
  9: '#facc15', // Stripes
  10: '#2563eb',
  11: '#dc2626',
  12: '#7c3aed',
  13: '#ea580c',
  14: '#16a34a',
  15: '#991b1b',
};

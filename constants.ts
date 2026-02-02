
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

export const BALL_COLORS: Record<number, string> = {
  0: '#ffffff', // Cue
  1: '#ffcc00', // Yellow
  2: '#0066cc', // Blue
  3: '#cc2200', // Red
  4: '#6600aa', // Purple
  5: '#ff7700', // Orange
  6: '#008800', // Green
  7: '#882222', // Maroon
  8: '#111111', // Black
  9: '#ffcc00', // Stripes start
  10: '#0066cc',
  11: '#cc2200',
  12: '#6600aa',
  13: '#ff7700',
  14: '#008800',
  15: '#882222',
};

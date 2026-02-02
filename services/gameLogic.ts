
import { Ball, BallType, GameState } from '../types.ts';
import { BALL_RADIUS, TABLE_WIDTH, TABLE_HEIGHT, RAIL_SIZE, BALL_COLORS } from '../constants.ts';

export const initialGameState = (): GameState => ({
  currentTurn: 1,
  balls: rackBalls(),
  p1Type: null,
  p2Type: null,
  tableOpen: true,
  status: 'YOUR BREAK',
  gameOver: false,
  winner: null
});

function rackBalls(): Ball[] {
  const balls: Ball[] = [];
  balls.push({
    id: 0,
    x: TABLE_WIDTH * 0.25 + RAIL_SIZE,
    y: TABLE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: '#ffffff',
    num: 0,
    type: 'cue',
    inPocket: false
  });

  const startX = TABLE_WIDTH * 0.7;
  const startY = TABLE_HEIGHT / 2;
  const rack = [
    { n: 1, t: 'solid' as BallType },
    { n: 10, t: 'stripe' as BallType }, { n: 2, t: 'solid' as BallType },
    { n: 3, t: 'solid' as BallType }, { n: 8, t: '8ball' as BallType }, { n: 11, t: 'stripe' as BallType },
    { n: 12, t: 'stripe' as BallType }, { n: 5, t: 'solid' as BallType }, { n: 13, t: 'stripe' as BallType }, { n: 4, t: 'solid' as BallType },
    { n: 6, t: 'solid' as BallType }, { n: 14, t: 'stripe' as BallType }, { n: 9, t: 'stripe' as BallType }, { n: 15, t: 'stripe' as BallType }, { n: 7, t: 'solid' as BallType }
  ];

  let idx = 0;
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row <= col; row++) {
      const b = rack[idx++];
      if (!b) continue;
      const x = startX + col * (BALL_RADIUS * 1.732);
      const y = startY + (row * (BALL_RADIUS * 2)) - (col * BALL_RADIUS);
      balls.push({
        id: b.n,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: BALL_COLORS[b.n],
        num: b.n,
        type: b.t,
        inPocket: false
      });
    }
  }
  return balls;
}


import { Ball, Pocket } from '../types.ts';
import { 
  SUB_STEPS, 
  RESTITUTION, 
  RAIL_RESTITUTION, 
  DRAG_PER_STEP, 
  STOP_VELOCITY, 
  BALL_RADIUS, 
  RAIL_SIZE, 
  TABLE_WIDTH, 
  TABLE_HEIGHT 
} from '../constants.ts';

export const updateBallPhysics = (ball: Ball, dt: number): boolean => {
  if (ball.inPocket) return false;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  let speed = Math.hypot(ball.vx, ball.vy);
  if (speed > 0) {
    speed = Math.max(0, speed - DRAG_PER_STEP);
    if (speed < STOP_VELOCITY) {
      ball.vx = 0;
      ball.vy = 0;
    } else {
      const angle = Math.atan2(ball.vy, ball.vx);
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
    }
  }

  return Math.abs(ball.vx) > 0 || Math.abs(ball.vy) > 0;
};

export const resolveRailCollisions = (ball: Ball, pockets: Pocket[]) => {
  if (ball.inPocket) return;

  const inPocketZone = (x: number, y: number) => {
    return pockets.some(p => Math.hypot(x - p.x, y - p.y) < p.radius + 10);
  };

  const left = RAIL_SIZE + BALL_RADIUS;
  const right = TABLE_WIDTH - RAIL_SIZE - BALL_RADIUS;
  const top = RAIL_SIZE + BALL_RADIUS;
  const bottom = TABLE_HEIGHT - RAIL_SIZE - BALL_RADIUS;

  if (ball.x < left && !inPocketZone(ball.x, ball.y)) {
    ball.x = left;
    ball.vx = Math.abs(ball.vx) * RAIL_RESTITUTION;
  } else if (ball.x > right && !inPocketZone(ball.x, ball.y)) {
    ball.x = right;
    ball.vx = -Math.abs(ball.vx) * RAIL_RESTITUTION;
  }

  if (ball.y < top && !inPocketZone(ball.x, ball.y)) {
    ball.y = top;
    ball.vy = Math.abs(ball.vy) * RAIL_RESTITUTION;
  } else if (ball.y > bottom && !inPocketZone(ball.x, ball.y)) {
    ball.y = bottom;
    ball.vy = -Math.abs(ball.vy) * RAIL_RESTITUTION;
  }
};

export const resolveBallCollisions = (balls: Ball[]): Ball | null => {
  let firstHit: Ball | null = null;
  const cueBall = balls.find(b => b.type === 'cue');

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i];
      const b2 = balls[j];
      if (b1.inPocket || b2.inPocket) continue;

      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const distSq = dx * dx + dy * dy;
      const minDist = BALL_RADIUS * 2;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if ((b1 === cueBall || b2 === cueBall) && !firstHit) {
          firstHit = b1 === cueBall ? b2 : b1;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) / 2;
        b1.x -= overlap * nx;
        b1.y -= overlap * ny;
        b2.x += overlap * nx;
        b2.y += overlap * ny;

        const rvx = b2.vx - b1.vx;
        const rvy = b2.vy - b1.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal > 0) continue;

        let impulse = -(1 + RESTITUTION) * velAlongNormal;
        impulse /= 2;

        b1.vx -= impulse * nx;
        b1.vy -= impulse * ny;
        b2.vx += impulse * nx;
        b2.vy += impulse * ny;
      }
    }
  }
  return firstHit;
};

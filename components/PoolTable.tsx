
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  TABLE_WIDTH, 
  TABLE_HEIGHT, 
  RAIL_SIZE, 
  BALL_RADIUS, 
  POCKET_RADIUS, 
  SUB_STEPS, 
  MAX_POWER,
  PLAY_AREA_W,
  PLAY_AREA_H
} from '../constants';
import { Ball, Pocket, GameMode, PlayerRole, GameState } from '../types';
import { updateBallPhysics, resolveBallCollisions, resolveRailCollisions } from '../services/physicsEngine';
import { initialGameState } from '../services/gameLogic';
import HUD from './HUD';

interface PoolTableProps {
  gameMode: GameMode;
  role: PlayerRole;
  roomCode: string | null;
  onExit: () => void;
}

const PoolTable: React.FC<PoolTableProps> = ({ gameMode, role, roomCode, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [isAiming, setIsAiming] = useState(true);
  const [isCharging, setIsCharging] = useState(false);
  const [aimAngle, setAimAngle] = useState(0);
  const [shotPower, setShotPower] = useState(0);
  const [chargeStartDist, setChargeStartDist] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const pockets: Pocket[] = [
    { x: RAIL_SIZE, y: RAIL_SIZE, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH / 2, y: RAIL_SIZE - 5, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH - RAIL_SIZE, y: RAIL_SIZE, radius: POCKET_RADIUS },
    { x: RAIL_SIZE, y: TABLE_HEIGHT - RAIL_SIZE, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - RAIL_SIZE + 5, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH - RAIL_SIZE, y: TABLE_HEIGHT - RAIL_SIZE, radius: POCKET_RADIUS },
  ];

  // Ref for mutable state to avoid closure traps in the loop
  const ballsRef = useRef<Ball[]>(gameState.balls);
  const firstHitRef = useRef<Ball | null>(null);
  const pottedThisTurnRef = useRef<Ball[]>([]);

  // Textures
  const woodPatternRef = useRef<CanvasPattern | null>(null);
  const feltPatternRef = useRef<CanvasPattern | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate Textures
    const wCanvas = document.createElement('canvas');
    wCanvas.width = 128; wCanvas.height = 128;
    const wCtx = wCanvas.getContext('2d')!;
    wCtx.fillStyle = '#2a1810';
    wCtx.fillRect(0,0,128,128);
    for(let i=0; i<40; i++) {
        wCtx.fillStyle = `rgba(0,0,0,${0.05 + Math.random()*0.1})`;
        wCtx.fillRect(0, Math.random()*128, 128, Math.random()*4);
    }
    woodPatternRef.current = ctx.createPattern(wCanvas, 'repeat');

    const fCanvas = document.createElement('canvas');
    fCanvas.width = 256; fCanvas.height = 256;
    const fCtx = fCanvas.getContext('2d')!;
    fCtx.fillStyle = '#0a3d12';
    fCtx.fillRect(0,0,256,256);
    for(let i=0; i<4000; i++) {
        fCtx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
        fCtx.fillRect(Math.random()*256, Math.random()*256, 1, 1);
    }
    feltPatternRef.current = ctx.createPattern(fCanvas, 'repeat');
  }, []);

  const handleTurnEnd = useCallback(() => {
    setGameState(prev => {
      let nextTurn = prev.currentTurn;
      let nextP1Type = prev.p1Type;
      let nextP2Type = prev.p2Type;
      let nextTableOpen = prev.tableOpen;
      let nextGameOver = prev.gameOver;
      let turnChange = true;
      let scratch = false;

      const cueBall = ballsRef.current.find(b => b.type === 'cue')!;
      const potted = pottedThisTurnRef.current;
      const hit = firstHitRef.current;

      // Rules Check
      if (cueBall.inPocket) {
        scratch = true;
        cueBall.inPocket = false;
        cueBall.x = TABLE_WIDTH * 0.25 + RAIL_SIZE;
        cueBall.y = TABLE_HEIGHT / 2;
        cueBall.vx = 0; cueBall.vy = 0;
      }

      const eightPotted = potted.find(b => b.type === '8ball');
      if (eightPotted) {
        // Logic for win/loss
        const myType = prev.currentTurn === 1 ? nextP1Type : nextP2Type;
        const remaining = ballsRef.current.filter(b => !b.inPocket && b.type === myType).length;
        if (remaining === 0) {
           nextGameOver = true;
           return { ...prev, gameOver: true, winner: prev.currentTurn };
        } else {
           nextGameOver = true;
           return { ...prev, gameOver: true, winner: prev.currentTurn === 1 ? 2 : 1 };
        }
      }

      if (nextTableOpen) {
        const firstColored = potted.find(b => b.type === 'solid' || b.type === 'stripe');
        if (firstColored) {
          nextTableOpen = false;
          if (prev.currentTurn === 1) {
            nextP1Type = firstColored.type;
            nextP2Type = firstColored.type === 'solid' ? 'stripe' : 'solid';
          } else {
            nextP2Type = firstColored.type;
            nextP1Type = firstColored.type === 'solid' ? 'stripe' : 'solid';
          }
          turnChange = false;
        }
      } else {
        const myType = prev.currentTurn === 1 ? nextP1Type : nextP2Type;
        const pottedMyBall = potted.some(b => b.type === myType);
        const correctHit = hit && hit.type === myType;

        if (pottedMyBall && correctHit && !scratch) {
          turnChange = false;
        }
      }

      if (turnChange) nextTurn = prev.currentTurn === 1 ? 2 : 1;

      // Reset turn local state
      firstHitRef.current = null;
      pottedThisTurnRef.current = [];
      setIsMoving(false);
      setIsAiming(true);

      return {
        ...prev,
        currentTurn: nextTurn as 1 | 2,
        p1Type: nextP1Type,
        p2Type: nextP2Type,
        tableOpen: nextTableOpen,
        status: turnChange ? 'NEXT PLAYER' : 'STILL YOUR TURN'
      };
    });
  }, []);

  const fireShot = useCallback((power: number, angle: number) => {
    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (!cueBall) return;
    cueBall.vx = Math.cos(angle) * power;
    cueBall.vy = Math.sin(angle) * power;
    setIsAiming(false);
    setIsMoving(true);
  }, []);

  // CPU Turn Logic
  useEffect(() => {
    if (gameMode === 'robot' && gameState.currentTurn === 2 && !isMoving && !gameState.gameOver) {
      const timer = setTimeout(() => {
        const cueBall = ballsRef.current.find(b => b.type === 'cue')!;
        const targets = ballsRef.current.filter(b => !b.inPocket && b.type !== 'cue');
        const target = targets[Math.floor(Math.random() * targets.length)];
        const dx = target.x - cueBall.x;
        const dy = target.y - cueBall.y;
        fireShot(20 + Math.random() * 15, Math.atan2(dy, dx));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameMode, isMoving, gameState.gameOver, fireShot]);

  // Main Loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const frame = () => {
      // 1. Physics
      let anyMoving = false;
      for (let s = 0; s < SUB_STEPS; s++) {
        ballsRef.current.forEach(ball => {
          if (updateBallPhysics(ball, 1 / SUB_STEPS)) anyMoving = true;
          resolveRailCollisions(ball, pockets);
          pockets.forEach(p => {
            if (!ball.inPocket && Math.hypot(ball.x - p.x, ball.y - p.y) < p.radius) {
              ball.inPocket = true;
              ball.vx = 0; ball.vy = 0;
              pottedThisTurnRef.current.push({ ...ball });
            }
          });
        });
        const hit = resolveBallCollisions(ballsRef.current);
        if (hit && !firstHitRef.current) firstHitRef.current = hit;
      }

      if (isMoving && !anyMoving) {
        handleTurnEnd();
      }

      // 2. Render
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      
      // Draw Table
      ctx.fillStyle = woodPatternRef.current || '#2a1810';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      ctx.fillStyle = feltPatternRef.current || '#0a3d12';
      ctx.fillRect(RAIL_SIZE, RAIL_SIZE, PLAY_AREA_W, PLAY_AREA_H);

      // Pockets
      pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.4, p.x, p.y, p.radius);
        grad.addColorStop(0, '#111');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Balls
      ballsRef.current.forEach(ball => {
        if (ball.inPocket) return;
        // Shadow
        ctx.beginPath();
        ctx.arc(ball.x + 3, ball.y + 3, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
        // Body
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        
        if (ball.type === 'stripe') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = '#fff';
          ctx.fillRect(ball.x - BALL_RADIUS, ball.y - 7, BALL_RADIUS * 2, 14);
          ctx.restore();
        }

        // Highlight
        const grad = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 1, ball.x - 4, ball.y - 4, 8);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI*2); ctx.fill();
      });

      // Cue & Aim Guide
      const cueBall = ballsRef.current.find(b => b.type === 'cue');
      if (cueBall && isAiming && !isMoving && !gameState.gameOver && (gameMode === 'local' || gameState.currentTurn === 1)) {
        // Aim Guide Line
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(cueBall.x, cueBall.y);
        const guideEndX = cueBall.x + Math.cos(aimAngle) * 600;
        const guideEndY = cueBall.y + Math.sin(aimAngle) * 600;
        ctx.lineTo(guideEndX, guideEndY);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Advanced Prediction (Ghost Ball)
        let closest = null;
        let minDist = Infinity;
        ballsRef.current.forEach(b => {
          if (b.id === 0 || b.inPocket) return;
          const dx = b.x - cueBall.x;
          const dy = b.y - cueBall.y;
          const dot = dx * Math.cos(aimAngle) + dy * Math.sin(aimAngle);
          if (dot > 0) {
            const perpDist = Math.abs(dx * Math.sin(aimAngle) - dy * Math.cos(aimAngle));
            if (perpDist < BALL_RADIUS * 2) {
              const impactDist = dot - Math.sqrt((BALL_RADIUS * 2) ** 2 - perpDist ** 2);
              if (impactDist < minDist) {
                minDist = impactDist;
                closest = b;
              }
            }
          }
        });

        if (closest) {
          const impactX = cueBall.x + Math.cos(aimAngle) * minDist;
          const impactY = cueBall.y + Math.sin(aimAngle) * minDist;
          
          // Ghost Ball
          ctx.beginPath();
          ctx.arc(impactX, impactY, BALL_RADIUS, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.setLineDash([]);
          ctx.stroke();

          // Target Ball Direction (Tangent)
          const targetAngle = Math.atan2(closest.y - impactY, closest.x - impactX);
          ctx.beginPath();
          ctx.moveTo(closest.x, closest.y);
          ctx.lineTo(closest.x + Math.cos(targetAngle) * 100, closest.y + Math.sin(targetAngle) * 100);
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();

        // Visual Cue Stick
        ctx.save();
        ctx.translate(cueBall.x, cueBall.y);
        ctx.rotate(aimAngle + Math.PI);
        const pullback = 20 + shotPower * 4;
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(pullback, -4, 300, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(pullback, -4, 10, 8);
        ctx.restore();
      }

      animationId = requestAnimationFrame(frame);
    };

    animationId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationId);
  }, [isAiming, aimAngle, isMoving, shotPower, gameState.gameOver, handleTurnEnd, gameMode, gameState.currentTurn]);

  // Input Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAiming || isMoving || (gameMode !== 'local' && gameState.currentTurn !== 1)) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cueBall = ballsRef.current.find(b => b.id === 0)!;
    setChargeStartDist(Math.hypot(x - cueBall.x, y - cueBall.y));
    setIsCharging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAiming || isMoving || (gameMode !== 'local' && gameState.currentTurn !== 1)) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cueBall = ballsRef.current.find(b => b.id === 0)!;

    if (!isCharging) {
      setAimAngle(Math.atan2(y - cueBall.y, x - cueBall.x));
    } else {
      const dist = Math.hypot(x - cueBall.x, y - cueBall.y);
      setShotPower(Math.max(0, Math.min((dist - chargeStartDist) / 4, MAX_POWER)));
    }
  };

  const handleMouseUp = () => {
    if (isCharging) {
      if (shotPower > 2) {
        fireShot(shotPower, aimAngle);
      }
      setIsCharging(false);
      setShotPower(0);
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      <HUD gameState={gameState} onExit={onExit} />
      
      <div className="relative mt-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border-4 border-neutral-800">
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-neutral-900 cursor-crosshair"
        />

        {/* Power Meter Overlay */}
        <div className="absolute left-4 bottom-8 w-6 h-48 bg-black/40 border border-white/20 rounded-full overflow-hidden">
          <div 
            className="absolute bottom-0 w-full transition-all duration-75"
            style={{ 
              height: `${(shotPower / MAX_POWER) * 100}%`,
              background: 'linear-gradient(to top, #22c55e, #eab308, #ef4444)'
            }}
          />
        </div>
      </div>

      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in duration-700">
          <h1 className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-lg tracking-tighter">
            {gameState.winner === 1 ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS'}
          </h1>
          <p className="text-white/60 mb-8 uppercase tracking-widest font-semibold">Table Cleared</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all hover:scale-105"
          >
            MAIN MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default PoolTable;

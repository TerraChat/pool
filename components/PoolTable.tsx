
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
  const [isMoving, setIsMoving] = useState(false);
  const [connecting, setConnecting] = useState(gameMode === 'online');
  
  const aimAngleRef = useRef(0);
  const shotPowerRef = useRef(0);
  const isChargingRef = useRef(false);
  const isAimingRef = useRef(true);
  const chargeStartDistRef = useRef(0);
  const ballsRef = useRef<Ball[]>(gameState.balls);
  const firstHitRef = useRef<Ball | null>(null);
  const pottedThisTurnRef = useRef<Ball[]>([]);
  const isMounted = useRef(true);

  const woodPatternRef = useRef<CanvasPattern | null>(null);
  const feltPatternRef = useRef<CanvasPattern | null>(null);

  const pockets: Pocket[] = [
    { x: RAIL_SIZE, y: RAIL_SIZE, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH / 2, y: RAIL_SIZE - 5, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH - RAIL_SIZE, y: RAIL_SIZE, radius: POCKET_RADIUS },
    { x: RAIL_SIZE, y: TABLE_HEIGHT - RAIL_SIZE, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - RAIL_SIZE + 5, radius: POCKET_RADIUS },
    { x: TABLE_WIDTH - RAIL_SIZE, y: TABLE_HEIGHT - RAIL_SIZE, radius: POCKET_RADIUS },
  ];

  useEffect(() => {
    isMounted.current = true;
    if (gameMode === 'online') {
      setTimeout(() => isMounted.current && setConnecting(false), 1500);
    }
    return () => { isMounted.current = false; };
  }, [gameMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const wCanvas = document.createElement('canvas');
    wCanvas.width = 128; wCanvas.height = 128;
    const wCtx = wCanvas.getContext('2d')!;
    wCtx.fillStyle = '#111111';
    wCtx.fillRect(0,0,128,128);
    for(let i=0; i<30; i++) {
        wCtx.fillStyle = `rgba(255,255,255,${0.02 + Math.random()*0.02})`;
        wCtx.fillRect(0, Math.random()*128, 128, Math.random()*2);
    }
    woodPatternRef.current = ctx.createPattern(wCanvas, 'repeat');

    const fCanvas = document.createElement('canvas');
    fCanvas.width = 256; fCanvas.height = 256;
    const fCtx = fCanvas.getContext('2d')!;
    fCtx.fillStyle = '#052c14';
    fCtx.fillRect(0,0,256,256);
    for(let i=0; i<6000; i++) {
        fCtx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
        fCtx.fillRect(Math.random()*256, Math.random()*256, 1, 1);
    }
    feltPatternRef.current = ctx.createPattern(fCanvas, 'repeat');
  }, []);

  const handleTurnEnd = useCallback(() => {
    if (!isMounted.current) return;
    setGameState(prev => {
      let nextTurn = prev.currentTurn;
      let nextP1Type = prev.p1Type;
      let nextP2Type = prev.p2Type;
      let nextTableOpen = prev.tableOpen;
      let turnChange = true;
      let scratch = false;

      const cueBall = ballsRef.current.find(b => b.type === 'cue')!;
      const potted = pottedThisTurnRef.current;
      const hit = firstHitRef.current;

      if (cueBall.inPocket) {
        scratch = true;
        cueBall.inPocket = false;
        cueBall.x = TABLE_WIDTH * 0.25 + RAIL_SIZE;
        cueBall.y = TABLE_HEIGHT / 2;
        cueBall.vx = 0; cueBall.vy = 0;
      }

      const eightPotted = potted.find(b => b.type === '8ball');
      if (eightPotted) {
        const myType = prev.currentTurn === 1 ? nextP1Type : nextP2Type;
        const remaining = ballsRef.current.filter(b => !b.inPocket && b.type === myType).length;
        return { ...prev, gameOver: true, winner: (remaining === 0 ? prev.currentTurn : (prev.currentTurn === 1 ? 2 : 1)), status: 'GAME OVER' };
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
        if (pottedMyBall && correctHit && !scratch) turnChange = false;
      }

      if (turnChange) nextTurn = prev.currentTurn === 1 ? 2 : 1;
      firstHitRef.current = null;
      pottedThisTurnRef.current = [];
      setIsMoving(false);
      isAimingRef.current = true;

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
    isAimingRef.current = false;
    setIsMoving(true);
  }, []);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const frame = () => {
      // Physics
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

      if (isMoving && !anyMoving) handleTurnEnd();

      // Table Render
      ctx.fillStyle = woodPatternRef.current || '#111';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      ctx.fillStyle = feltPatternRef.current || '#052c14';
      ctx.fillRect(RAIL_SIZE, RAIL_SIZE, PLAY_AREA_W, PLAY_AREA_H);

      pockets.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000'; ctx.fill();
      });

      // Balls Render
      ballsRef.current.forEach(ball => {
        if (ball.inPocket) return;
        
        // Shadow
        ctx.beginPath(); ctx.arc(ball.x + 2, ball.y + 2, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

        // Ball Body
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = ball.color; ctx.fill();
        
        // Stripe Overlay
        if (ball.type === 'stripe') {
          ctx.save();
          ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ball.x - BALL_RADIUS, ball.y - 7, BALL_RADIUS * 2, 14);
          ctx.restore();
        }

        // Ball Numbering
        if (ball.type !== 'cue') {
            // White circle for number
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Numeral
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${BALL_RADIUS * 0.6}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.num.toString(), ball.x, ball.y + 0.5);
        }

        // 3D Highlight
        const grad = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 1, ball.x - 4, ball.y - 4, 8);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI*2); ctx.fill();
      });

      // Aiming UI
      const cueBall = ballsRef.current.find(b => b.type === 'cue');
      if (cueBall && isAimingRef.current && !isMoving && !gameState.gameOver && !connecting) {
        const curAngle = aimAngleRef.current;
        let closest = null;
        let minDist = Infinity;
        ballsRef.current.forEach(b => {
          if (b.id === 0 || b.inPocket) return;
          const dx = b.x - cueBall.x; const dy = b.y - cueBall.y;
          const dot = dx * Math.cos(curAngle) + dy * Math.sin(curAngle);
          if (dot > 0) {
            const perpDist = Math.abs(dx * Math.sin(curAngle) - dy * Math.cos(curAngle));
            if (perpDist < BALL_RADIUS * 2) {
              const impactDist = dot - Math.sqrt((BALL_RADIUS * 2) ** 2 - perpDist ** 2);
              if (impactDist < minDist) { minDist = impactDist; closest = b; }
            }
          }
        });

        const impactDist = closest ? minDist : 800;
        const impactX = cueBall.x + Math.cos(curAngle) * impactDist;
        const impactY = cueBall.y + Math.sin(curAngle) * impactDist;

        ctx.save();
        ctx.beginPath(); ctx.setLineDash([5, 5]);
        ctx.moveTo(cueBall.x, cueBall.y); ctx.lineTo(impactX, impactY);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();

        if (closest) {
          ctx.beginPath(); ctx.arc(impactX, impactY, BALL_RADIUS, 0, Math.PI * 2);
          ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();

          const targetAngle = Math.atan2(closest.y - impactY, closest.x - impactX);
          ctx.beginPath(); ctx.moveTo(closest.x, closest.y);
          ctx.lineTo(closest.x + Math.cos(targetAngle) * 100, closest.y + Math.sin(targetAngle) * 100);
          ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.stroke();

          const cueAngle = targetAngle + Math.PI/2 * (Math.sin(curAngle - targetAngle) > 0 ? 1 : -1);
          ctx.beginPath(); ctx.setLineDash([2, 4]);
          ctx.moveTo(impactX, impactY); ctx.lineTo(impactX + Math.cos(cueAngle) * 60, impactY + Math.sin(cueAngle) * 60);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
        }
        ctx.restore();

        // Cue Stick
        ctx.save();
        ctx.translate(cueBall.x, cueBall.y); ctx.rotate(curAngle + Math.PI);
        const pullback = 25 + shotPowerRef.current * 3.5;
        ctx.fillStyle = '#333'; ctx.fillRect(pullback, -4, 280, 8);
        ctx.fillStyle = '#22d3ee'; ctx.fillRect(pullback, -4, 12, 8);
        ctx.restore();
      }

      animationId = requestAnimationFrame(frame);
    };

    animationId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationId);
  }, [isMoving, gameState.gameOver, connecting, handleTurnEnd]);

  const handleInputMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMounted.current || isMoving || gameState.gameOver || connecting) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const cueBall = ballsRef.current.find(b => b.id === 0)!;
    if (!isChargingRef.current) aimAngleRef.current = Math.atan2(clientY - rect.top - cueBall.y, clientX - rect.left - cueBall.x);
    else shotPowerRef.current = Math.max(0, Math.min((Math.hypot(clientX - rect.left - cueBall.x, clientY - rect.top - cueBall.y) - chargeStartDistRef.current) / 3, MAX_POWER));
  };

  const handleInputStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMounted.current || isMoving || gameState.gameOver || connecting) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const cueBall = ballsRef.current.find(b => b.id === 0)!;
    chargeStartDistRef.current = Math.hypot(clientX - rect.left - cueBall.x, clientY - rect.top - cueBall.y);
    isChargingRef.current = true;
  };

  const handleInputEnd = () => {
    if (isChargingRef.current) {
      if (shotPowerRef.current > 1.5) fireShot(shotPowerRef.current, aimAngleRef.current);
      isChargingRef.current = false; shotPowerRef.current = 0;
    }
  };

  useEffect(() => {
    if (gameMode === 'robot' && gameState.currentTurn === 2 && !isMoving && !gameState.gameOver) {
      const timer = setTimeout(() => {
        if (!isMounted.current) return;
        const cueBall = ballsRef.current.find(b => b.type === 'cue')!;
        const targets = ballsRef.current.filter(b => !b.inPocket && b.type !== 'cue');
        const target = targets[Math.floor(Math.random() * targets.length)];
        fireShot(15 + Math.random() * 20, Math.atan2(target.y - cueBall.y, target.x - cueBall.x));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameMode, isMoving, gameState.gameOver, fireShot]);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-5xl px-4">
      {gameMode === 'online' && (
        <div className="w-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 py-2 px-6 rounded-xl mb-4 flex justify-between items-center animate-in fade-in slide-in-from-top duration-500">
           <span className="text-xs font-black tracking-widest uppercase">Room: {roomCode}</span>
           <span className="text-xs font-bold bg-cyan-500 text-black px-2 py-0.5 rounded">CONNECTED</span>
        </div>
      )}

      <HUD gameState={gameState} onExit={onExit} />
      
      <div className="relative mt-4 shadow-[0_50px_100px_rgba(0,0,0,1)] rounded-3xl overflow-hidden border-[6px] border-neutral-800 touch-none">
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onMouseDown={handleInputStart}
          onMouseMove={handleInputMove}
          onMouseUp={handleInputEnd}
          onMouseLeave={handleInputEnd}
          onTouchStart={handleInputStart}
          onTouchMove={handleInputMove}
          onTouchEnd={handleInputEnd}
          className="bg-black cursor-crosshair max-w-full h-auto"
        />

        {connecting && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-black text-white tracking-widest">CONNECTING TO ROOM...</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-8 items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex flex-col items-center">
           <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Drag to aim</div>
           <div className="w-6 h-6 rounded-full border border-neutral-700 flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full" />
           </div>
        </div>
        <div className="flex flex-col items-center">
           <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Power Meter</div>
           <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-1/3" />
           </div>
        </div>
      </div>

      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
          <h1 className="text-7xl font-black text-cyan-400 italic drop-shadow-[0_0_20px_#22d3ee66]">
            {gameState.winner === 1 ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS'}
          </h1>
          <button 
            onClick={() => window.location.reload()}
            className="mt-12 px-12 py-5 bg-cyan-500 text-black font-black rounded-2xl hover:bg-cyan-400 transition-all hover:scale-110 active:scale-95 shadow-[0_10px_40px_rgba(34,211,238,0.3)]"
          >
            RETURN TO MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default PoolTable;

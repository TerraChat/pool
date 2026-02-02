
import React from 'react';
import { GameState } from '../types';

interface HUDProps {
  gameState: GameState;
  onExit: () => void;
}

const HUD: React.FC<HUDProps> = ({ gameState, onExit }) => {
  return (
    <div className="w-full max-w-4xl flex items-center justify-between px-6 py-4 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
      <div className={`flex flex-col ${gameState.currentTurn === 1 ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`}>
        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Player 1</span>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight">YOU</span>
          {gameState.p1Type && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${gameState.p1Type === 'solid' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-orange-400 border-orange-400/30 bg-orange-400/10'} uppercase`}>
              {gameState.p1Type}S
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          {gameState.status}
        </span>
        <div className="flex gap-2">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${gameState.currentTurn === 1 ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-neutral-800'}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${gameState.currentTurn === 2 ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-neutral-800'}`} />
        </div>
      </div>

      <div className={`flex flex-col items-end ${gameState.currentTurn === 2 ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`}>
        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Player 2</span>
        <div className="flex items-center gap-3">
          {gameState.p2Type && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${gameState.p2Type === 'solid' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-orange-400 border-orange-400/30 bg-orange-400/10'} uppercase`}>
              {gameState.p2Type}S
            </span>
          )}
          <span className="text-xl font-black tracking-tight">OPPONENT</span>
        </div>
      </div>
      
      <button 
        onClick={onExit}
        className="ml-8 p-2 text-neutral-600 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  );
};

export default HUD;

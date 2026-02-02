
import React from 'react';
import { GameState } from '../types';

interface HUDProps {
  gameState: GameState;
  onExit: () => void;
}

const HUD: React.FC<HUDProps> = ({ gameState, onExit }) => {
  return (
    <div className="w-full max-w-4xl flex items-center justify-between px-6 py-4 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5">
      <div className={`flex flex-col ${gameState.currentTurn === 1 ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Player 1</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-black">YOU</span>
          {gameState.p1Type && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 ${gameState.p1Type === 'solid' ? 'text-blue-400' : 'text-orange-400'}`}>
              {gameState.p1Type.toUpperCase()}S
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">
          {gameState.status}
        </span>
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full ${gameState.currentTurn === 1 ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-neutral-800'}`} />
          <div className={`w-2 h-2 rounded-full ${gameState.currentTurn === 2 ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-neutral-800'}`} />
        </div>
      </div>

      <div className={`flex flex-col items-end ${gameState.currentTurn === 2 ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Player 2</span>
        <div className="flex items-center gap-2">
          {gameState.p2Type && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 ${gameState.p2Type === 'solid' ? 'text-blue-400' : 'text-orange-400'}`}>
              {gameState.p2Type.toUpperCase()}S
            </span>
          )}
          <span className="text-xl font-black">OPPONENT</span>
        </div>
      </div>
      
      <button 
        onClick={onExit}
        className="ml-6 p-2 text-neutral-600 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  );
};

export default HUD;

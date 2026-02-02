
import React, { useState } from 'react';

interface LobbyProps {
  onBack: () => void;
  onJoin: (code: string, isHost: boolean) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onBack, onJoin }) => {
  const [code, setCode] = useState('');

  const generateCode = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    onJoin(newCode, true);
  };

  return (
    <div className="flex flex-col items-center max-w-sm w-full p-8 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">MULTIPLAYER</h2>
      
      <button 
        onClick={generateCode}
        className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl hover:bg-yellow-400 transition-all mb-4"
      >
        CREATE NEW ROOM
      </button>

      <div className="flex items-center gap-4 w-full my-6 text-neutral-600">
        <div className="h-px bg-neutral-800 flex-1" />
        <span className="text-xs font-bold uppercase">OR JOIN ROOM</span>
        <div className="h-px bg-neutral-800 flex-1" />
      </div>

      <div className="flex gap-3 w-full">
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          maxLength={4}
          className="flex-1 bg-neutral-900 border border-neutral-800 text-yellow-500 text-2xl font-black text-center rounded-2xl outline-none focus:border-yellow-500/50 transition-all"
        />
        <button 
          onClick={() => code && onJoin(code, false)}
          className="px-6 bg-neutral-800 text-white font-bold rounded-2xl hover:bg-neutral-700"
        >
          GO
        </button>
      </div>

      <button 
        onClick={onBack}
        className="mt-12 text-neutral-500 hover:text-white transition-colors text-sm font-bold"
      >
        CANCEL
      </button>
    </div>
  );
};

export default Lobby;

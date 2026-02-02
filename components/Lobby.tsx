
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
      <h2 className="text-3xl font-black text-white mb-8 tracking-tight italic">MULTIPLAYER</h2>
      
      <button 
        onClick={generateCode}
        className="w-full py-5 bg-cyan-500 text-black font-black rounded-2xl hover:bg-cyan-400 transition-all mb-4 shadow-[0_10px_30px_rgba(34,211,238,0.2)]"
      >
        CREATE NEW ROOM
      </button>

      <div className="flex items-center gap-4 w-full my-6 text-neutral-700">
        <div className="h-px bg-neutral-800 flex-1" />
        <span className="text-[10px] font-black uppercase tracking-widest">OR JOIN ROOM</span>
        <div className="h-px bg-neutral-800 flex-1" />
      </div>

      <div className="flex gap-3 w-full">
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          maxLength={4}
          className="flex-1 bg-neutral-900 border border-neutral-800 text-cyan-400 text-2xl font-black text-center rounded-2xl outline-none focus:border-cyan-500/50 transition-all"
        />
        <button 
          onClick={() => code && onJoin(code, false)}
          className="px-6 bg-neutral-800 text-white font-bold rounded-2xl hover:bg-neutral-700 transition-colors"
        >
          GO
        </button>
      </div>

      <button 
        onClick={onBack}
        className="mt-12 text-neutral-500 hover:text-white transition-colors text-xs font-black tracking-widest uppercase"
      >
        GO BACK
      </button>
    </div>
  );
};

export default Lobby;

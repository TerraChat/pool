
import React from 'react';

interface MainMenuProps {
  onLocal: () => void;
  onRobot: () => void;
  onOnline: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onLocal, onRobot, onOnline }) => {
  return (
    <div className="flex flex-col items-center text-center p-8">
      <div className="mb-12">
        <h1 className="text-8xl font-black italic text-yellow-500 tracking-tighter drop-shadow-2xl">
          8 BALL
        </h1>
        <div className="h-1 w-full bg-yellow-500/50 mt-2" />
        <p className="text-white/40 mt-4 tracking-widest font-bold uppercase">Pro Elite Simulator</p>
      </div>

      <div className="flex flex-col gap-4 w-72">
        <MenuButton onClick={onLocal} primary>Local Play</MenuButton>
        <MenuButton onClick={onRobot}>Vs Computer</MenuButton>
        <MenuButton onClick={onOnline}>Online Rooms</MenuButton>
      </div>
      
      <p className="text-neutral-600 mt-16 text-xs font-mono uppercase">v2.0.4 - Ultra Performance</p>
    </div>
  );
};

const MenuButton: React.FC<{ onClick: () => void, children: React.ReactNode, primary?: boolean }> = ({ onClick, children, primary }) => (
  <button
    onClick={onClick}
    className={`
      w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider transition-all
      ${primary 
        ? 'bg-yellow-500 text-black hover:bg-yellow-400' 
        : 'bg-neutral-900 text-white/80 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'}
      active:scale-95
    `}
  >
    {children}
  </button>
);

export default MainMenu;

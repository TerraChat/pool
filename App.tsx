
import React, { useState, useEffect } from 'react';
import PoolTable from './components/PoolTable';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';
import HUD from './components/HUD';
import { GameMode, GameState, PlayerRole } from './types';
import { initialGameState } from './services/gameLogic';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [role, setRole] = useState<PlayerRole>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const handleStartLocal = () => {
    setGameMode('local');
    setRole(null);
    setScreen('game');
  };

  const handleStartRobot = () => {
    setGameMode('robot');
    setRole(null);
    setScreen('game');
  };

  const handleOnlineLobby = () => {
    setScreen('lobby');
  };

  const handleJoinRoom = (code: string, isHost: boolean) => {
    setRoomCode(code);
    setRole(isHost ? 'host' : 'guest');
    setGameMode('online');
    setScreen('game');
  };

  const handleGameOver = () => {
    // We can show an overlay here or just reset
  };

  return (
    <div className="relative w-full h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
      {screen === 'menu' && (
        <MainMenu 
          onLocal={handleStartLocal} 
          onRobot={handleStartRobot} 
          onOnline={handleOnlineLobby} 
        />
      )}

      {screen === 'lobby' && (
        <Lobby 
          onBack={() => setScreen('menu')} 
          onJoin={handleJoinRoom} 
        />
      )}

      {screen === 'game' && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          <PoolTable 
            gameMode={gameMode} 
            role={role} 
            roomCode={roomCode} 
            onExit={() => setScreen('menu')}
          />
        </div>
      )}
    </div>
  );
};

export default App;

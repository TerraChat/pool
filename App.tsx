
import React, { useState, useCallback } from 'react';
import PoolTable from './components/PoolTable';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';
import { GameMode, PlayerRole } from './types';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [role, setRole] = useState<PlayerRole>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const resetToMenu = useCallback(() => {
    setScreen('menu');
    setRoomCode(null);
    setRole(null);
  }, []);

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
          onBack={resetToMenu} 
          onJoin={handleJoinRoom} 
        />
      )}

      {screen === 'game' && (
        <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-700">
          <PoolTable 
            key={roomCode || 'single'} // Key ensures full remount if game changes
            gameMode={gameMode} 
            role={role} 
            roomCode={roomCode} 
            onExit={resetToMenu}
          />
        </div>
      )}
    </div>
  );
};

export default App;

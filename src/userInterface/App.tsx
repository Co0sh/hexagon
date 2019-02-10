import React, { FunctionComponent, useState, useCallback } from 'react';
import './App.css';
import Game from './Game';
import UI from './UI';
import MainMenu from './MainMenu';
import Settings from '../data/Settings';

const App: FunctionComponent = (): JSX.Element => {
  const [game, setGame] = useState<Settings | null>(null);
  const startGame = useCallback((settings: Settings) => {
    setGame(settings);
  }, []);
  const endGame = useCallback(() => {
    setGame(null);
  }, []);

  return (
    <div className="app">
      {game ? (
        <>
          <Game settings={game} />
          <UI settings={game} endGame={endGame} />
        </>
      ) : (
        <MainMenu startGame={startGame} />
      )}
    </div>
  );
};

export default App;

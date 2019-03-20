import React, { FunctionComponent, useCallback, useState } from 'react';
import { Store } from 'redux';
import useStore from '../logic/useStore';
import './App.css';
import Content from './Content';
import Game from './Game';
import UI from './UI';

interface Props {
  store: Store;
}

const App: FunctionComponent<Props> = (): JSX.Element => {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  const endGame = useCallback(() => setReady(false), []);
  const game = useStore(s => s.game);

  return (
    <div className="App-root">
      {game ? (
        <>
          <Game settings={game.settings} onReady={handleReady} />
          <UI endGame={endGame} ready={ready} />
        </>
      ) : (
        <Content />
      )}
    </div>
  );
};

export default App;

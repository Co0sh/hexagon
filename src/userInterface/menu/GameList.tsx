import React, { FunctionComponent, memo } from 'react';
import './GameList.css';
import Menu from './Menu';
import useStore from '../../logic/useStore';
import Button from '../components/Button';
import useRequest from '../../logic/useRequest';
import Axios from 'axios';
import useDispatch from '../../logic/useDispatch';
import Unit from '../../data/Unit';
import { defaultSettings } from '../../data/Settings';
import Map from '../../data/Map';
import ErrorText from '../components/ErrorText';

const GameList: FunctionComponent = () => {
  const games = useStore(s => s.user!.games);

  const dispatch = useDispatch();
  const [fetchGame, loading, error] = useRequest(
    (id: string) =>
      Axios.post(`/api/game/message/${id}`, {
        message: 'get_data',
      }),
    res => {
      const map = res.data as Map;
      const units: Unit[] = [
        { id: 0, type: 'WARRIOR', position: { x: 1, y: 1 } },
        { id: 1, type: 'WARRIOR', position: { x: 1, y: 2 } },
        { id: 2, type: 'WARRIOR', position: { x: 1, y: 3 } },
      ];
      dispatch({ type: 'load_map', map, units });
      dispatch({
        type: 'start_game',
        gameData: {
          settings: {
            mapWidth: map.width,
            mapHeight: map.height,
            ...defaultSettings,
          },
        },
      });
    },
    []
  );

  return (
    <Menu title="Games" loading={loading}>
      <ErrorText error={error} />
      {games.map(game => (
        <Button
          key={game.id}
          disabled={!game.online}
          color="secondary"
          onClick={() => fetchGame(game.id)}
          className="GameList-button"
        >
          {game.id}
        </Button>
      ))}
    </Menu>
  );
};

export default memo(GameList);

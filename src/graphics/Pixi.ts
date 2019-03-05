import { Application, Container } from 'pixi.js';
import { Store } from 'redux';
import Settings from '../data/Settings';
import {
  MOVE_UNIT,
  RESET,
  SELECT_TILE,
  SELECT_UNIT,
  DESELECT,
} from '../store/actions';
import MoveUnitAction from '../store/actions/moveUnitAction';
import SelectUnitAction from '../store/actions/selectUnitAction';
import { RootState } from '../store/reducers';
import BackgroundLayer from './BackgroundLayer';
import DimensionsProvider from './DimensionsProvider';
import FpsCounter from './FpsCounter';
import MapDrawer from './MapDrawer';
import TextureManager from './TextureManager';
import TileLayer from './TileLayer';
import UnitLayer from './UnitLayer';
import UnderlayLayer from './UnderlayLayer';
import Controller from './Controller';
import AStar from '../logic/movement/AStar';
import InfantryMovement from '../logic/movement/InfantryMovement';

type Kill = () => void;

const app = new Application({
  autoDensity: true,
  resolution: devicePixelRatio,
  width: window.innerWidth,
  height: window.innerHeight,
});

const textureManager = new TextureManager(app.loader, app.renderer);

const launch = (
  { mapWidth, mapHeight, maxZoom, minZoom, size }: Settings,
  div: HTMLElement,
  onReady: () => void,
  store: Store<RootState>
): Kill => {
  const setup = (): (() => void) => {
    const container = new Container();
    app.stage.addChild(container);
    app.stage.interactive = true;

    const dp = new DimensionsProvider(
      size,
      { width: div.clientWidth, height: div.clientHeight },
      { width: mapWidth, height: mapHeight },
      { x: 0, y: 0 },
      minZoom,
      maxZoom
    );

    const backgroundContainer = new Container();
    const tileContainer = new Container();
    const underlayContainer = new Container();
    const unitContainer = new Container();
    container.addChild(
      backgroundContainer,
      tileContainer,
      underlayContainer,
      unitContainer
    );

    const layers = [
      new BackgroundLayer(backgroundContainer, dp),
      new TileLayer(tileContainer, textureManager, store.getState, dp),
      new UnderlayLayer(underlayContainer, textureManager, store.getState, dp),
      new UnitLayer(unitContainer, textureManager, store.getState, dp),
    ];

    const drawer = new MapDrawer(
      layers,
      container,
      () => store.getState().map!,
      dp,
      size,
      div.clientWidth,
      div.clientHeight
    );

    const storeUnsubscribe = store.subscribe(() => {
      layers.forEach(layer => layer.update());
    });

    const onTick = (): void => {
      layers.forEach(layer => layer.animate());
    };
    app.ticker.add(onTick);

    const controller = new Controller(app.ticker, app.stage)
      .registerPrimaryListener(({ x, y }) => {
        const local = dp.toLocalPoint({ x, y });
        const hex = dp.toHex(local);
        if (hex.x < 0 || hex.x >= mapWidth || hex.y < 0 || hex.y >= mapHeight) {
          return;
        }
        const tile = store.getState().map!.tiles[hex.x][hex.y];
        if (!tile) {
          return;
        }
        store.dispatch({ type: SELECT_TILE, tile, position: hex });
        const selectedUnit = store.getState().selectedUnit;
        const currentUnits = store.getState().units;
        const currentUnitsArray = Object.keys(currentUnits).map(
          key => currentUnits[Number(key)]
        );
        const unit = currentUnitsArray.find(
          unit => unit.position.x === hex.x && unit.position.y === hex.y
        );
        if (unit) {
          store.dispatch<SelectUnitAction>({ type: SELECT_UNIT, unit });
        } else {
          if (selectedUnit) {
            const pathfinder = new AStar(
              store.getState().map!,
              new InfantryMovement(),
              selectedUnit.position,
              2,
              2
            );
            const route = pathfinder.getPath({ x: hex.x, y: hex.y });
            if (route.length > 0) {
              store.dispatch<MoveUnitAction>({
                type: MOVE_UNIT,
                unit: selectedUnit,
                movement: route,
              });
            }
          }
        }
      })
      .registerSecondaryListener(() => {
        store.dispatch({ type: DESELECT });
      })
      .registerPrimaryDragListener(({ x, y }) => drawer.moveBy(x, y))
      .registerZoomListener((zoom, point) => drawer.zoom(zoom, point));

    const counter = new FpsCounter(app);

    const resize = (): void => {
      app.renderer.resize(div.clientWidth, div.clientHeight);
      drawer.resize(div.clientWidth, div.clientHeight);
    };
    window.addEventListener('resize', resize);
    resize();

    const tearDown = (): void => {
      app.ticker.remove(onTick);
      storeUnsubscribe();
      store.dispatch({ type: RESET });
      window.removeEventListener('resize', resize);
      controller.stop();
      counter.stop();
      app.stage.removeChildren();
      container.destroy();
    };

    onReady();

    return tearDown;
  };

  const loaded = textureManager.load().then(setup);

  div.appendChild(app.view);

  return () => {
    loaded.then(tearDown => {
      tearDown();
      div.removeChild(app.view);
    });
  };
};

export default launch;

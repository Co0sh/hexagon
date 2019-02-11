import { Application, Container } from 'pixi.js';
import Settings from '../data/Settings';
import DimensionsProvider from './DimensionsProvider';
import Drag from './Drag';
import Drawer from './Drawer';
import FpsCounter from './FpsCounter';
import { DefaultMap } from './Map';
import TextureManager from './TextureManager';
import TileRenderer from './TileRenderer';
import Zoom from './Zoom';
import Click from './Click';
import { TileData } from '../userInterface/UI';

type Kill = () => void;

const launch = (
  { mapWidth, mapHeight, maxZoom, minZoom, size }: Settings,
  div: HTMLElement,
  onReady: () => void,
  onSelect: (tileData: TileData) => void
): Kill => {
  const app = new Application({
    autoDensity: true,
    resolution: devicePixelRatio,
    width: div.clientWidth,
    height: div.clientHeight,
    resizeTo: div,
  });

  const textureManager = new TextureManager(app.loader, app.renderer);

  const setup = (): (() => void) => {
    const container = new Container();
    app.stage.addChild(container);
    app.stage.interactive = true;

    const dp = new DimensionsProvider();
    const tileRenderer = new TileRenderer(textureManager, dp);
    const map = new DefaultMap(mapWidth, mapHeight);
    const drawer = new Drawer(
      tileRenderer,
      container,
      map,
      dp,
      div.clientWidth,
      div.clientHeight,
      size,
      maxZoom,
      minZoom
    );

    const click = new Click(app.stage).addListener((x, y) => {
      const local = dp.toLocalPoint({ x, y });
      const hex = dp.toHex(local);
      if (hex.x < 0 || hex.x >= mapWidth || hex.y < 0 || hex.y >= mapHeight) {
        return;
      }
      const tile = map.tiles[hex.x][hex.y];
      if (!tile) {
        return;
      }
      onSelect({ tile, position: hex });
    });
    const drag = new Drag(app.ticker, app.stage).addListener((x, y) =>
      drawer.moveMapBy(x, y)
    );
    const zoom = new Zoom(app.stage).addListener((zoom, point) =>
      drawer.zoom(zoom, point)
    );
    const counter = new FpsCounter(app);

    const resize = (): void => {
      app.renderer.resize(div.clientWidth, div.clientHeight);
      drawer.resize(div.clientWidth, div.clientHeight);
    };
    window.addEventListener('resize', resize);
    resize();

    const tearDown = (): void => {
      window.removeEventListener('resize', resize);
      click.stop();
      drag.stop();
      zoom.stop();
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
      textureManager.cleanup();
      div.removeChild(app.view);
      app.destroy();
    });
  };
};

export default launch;

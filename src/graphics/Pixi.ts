import Drawer from './Drawer';
import Drag from './Drag';
import { DefaultMap } from './Map';
import Zoom from './Zoom';
import FpsCounter from './FpsCounter';
import { Application, Container, Loader } from 'pixi.js';
import TextureManager from './TextureManager';
import TileRenderer from './TileRenderer';

const app = new Application({
  autoDensity: true,
  resolution: devicePixelRatio,
  width: window.innerWidth,
  height: window.innerHeight,
});

const setup = (): void => {
  const container = new Container();
  app.stage.addChild(container);
  app.stage.interactive = true;

  const map = new DefaultMap(128, 80);
  const drawer = new Drawer(new TileRenderer(app.renderer), container, map);

  new Drag(app.ticker, app.stage).addListener((x, y) => drawer.moveMapBy(x, y));
  new Zoom(app.stage).addListener((zoom, point) => drawer.zoom(zoom, point));
  new FpsCounter(app);

  const resize = (): void => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    drawer.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resize);
  resize();
};

TextureManager.load(Loader.shared).then(setup);

export default app;

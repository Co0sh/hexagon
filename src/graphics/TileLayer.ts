import { DisplayObject, Container } from 'pixi.js';
import TileRenderer from './TileRenderer';
import Map from '../data/Map';
import DimensionsProvider from './DimensionsProvider';
import MapLayer from './MapLayer';
import { Position } from '../userInterface/TileInfo';

export default class TileLayer implements MapLayer {
  protected tiles: (DisplayObject | null)[][] = [];
  protected previousMap: Map;

  public constructor(
    protected readonly container: Container,
    protected readonly tileRenderer: TileRenderer,
    protected readonly map: () => Map,
    protected readonly dp: DimensionsProvider
  ) {
    this.previousMap = map();
    this.tiles = [];
    map().tiles.forEach(column => {
      this.tiles.push(new Array(column.length).fill(null));
    });
  }

  public draw = (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      this.emptyTiles();
    }

    this.mapIterator().forEach((x, y) => {
      if (this.isHidden(x, y)) {
        this.removeTile(x, y);
      } else {
        this.createTile(x, y);
      }
    });

    this.container.sortChildren();

    return this.container;
  };

  public update = (): void => {
    const currentMap = this.map();
    if (currentMap !== this.previousMap) {
      const changed: Position[] = [];
      const { tiles, width, height } = currentMap;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (this.previousMap.tiles[x][y] !== tiles[x][y]) {
            changed.push({ x, y });
          }
        }
      }
      changed.forEach(position => this.updateTile(position));
    }
    this.previousMap = currentMap;
  };

  protected updateTile = (position: Position) => {
    const { x, y } = position;
    if (!this.isHidden(x, y)) {
      this.removeTile(x, y);
      this.createTile(x, y);
    }
    this.container.sortChildren();
  };

  protected mapIterator = () => ({
    forEach: (fn: (xIndex: number, yIndex: number) => void) => {
      for (let xIndex = 0; xIndex < this.map().width; xIndex++) {
        for (let yIndex = 0; yIndex < this.map().height; yIndex++) {
          fn(xIndex, yIndex);
        }
      }
    },
  });

  protected isHidden = (xIndex: number, yIndex: number) => {
    const { minX, maxX, minY, maxY } = this.dp.getTileIndexBoundaries();
    return xIndex < minX || xIndex > maxX || yIndex < minY || yIndex > maxY;
  };

  protected emptyTiles = () => {
    this.mapIterator().forEach((x, y) => this.removeTile(x, y));
  };

  protected removeTile = (xIndex: number, yIndex: number) => {
    let renderedTile = this.tiles[xIndex][yIndex];
    if (renderedTile) {
      this.container.removeChild(renderedTile);
    }
    this.tiles[xIndex][yIndex] = null;
  };

  protected createTile = (xIndex: number, yIndex: number) => {
    if (this.tiles[xIndex][yIndex]) {
      return;
    }
    const tile = this.map().tiles[xIndex][yIndex];
    if (!tile) {
      return;
    }
    const renderedTile = this.tileRenderer.drawTile(tile);
    const { x, y } = this.dp.getTileCoordinates(xIndex, yIndex);
    renderedTile.position.set(x, y);
    renderedTile.zIndex = this.map().height * yIndex + xIndex;
    this.container.addChild(renderedTile);
    this.tiles[xIndex][yIndex] = renderedTile;
  };
}

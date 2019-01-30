import Tile, { DefaultTile } from "./Tile";

export default interface Map {
  width: number;
  height: number;
  tiles: Tile[][];
}

export class DefaultMap implements Map {
  public tiles: Tile[][] = [];

  constructor(public width: number, public height: number) {
    for (let xIndex = 0; xIndex < width; xIndex++) {
      this.tiles[xIndex] = [];
      for (let yIndex = 0; yIndex < height; yIndex++) {
        this.tiles[xIndex][yIndex] = new DefaultTile(
          Math.floor(0xff0000),
          xIndex,
          yIndex
        );
      }
    }
  }
}

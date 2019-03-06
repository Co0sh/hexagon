import { GroundFeature } from '../data/GroundFeature';
import { GroundType } from '../data/GroundType';
import Tile from '../data/Tile';

export class DefaultTile implements Tile {
  public visible: boolean = false;
  public discovered: boolean = false;

  public constructor(
    public groundType: GroundType,
    public hill: boolean,
    public groundFeature: GroundFeature | null = null
  ) {}
}

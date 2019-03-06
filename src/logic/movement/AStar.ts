import Pathfinder from './Pathfinder';
import { Position } from '../../userInterface/UnitInfo';
import Map from '../../data/Map';
import MovementCosts from './MovementCosts';
import distance from '../distance';
import getNeighbors from './getNeighbors';
import Tile from '../../data/Tile';

interface Node {
  totalCost: number;
  fromStart: number;
  movementLeft: number;
  toEnd: number;
  parent: Node | null;
  position: Position;
  tile: Tile;
}

const isSame = (target: Position): ((node: Node) => boolean) => node => {
  const { x: tX, y: tY } = target;
  const { x: nX, y: nY } = node.position;
  return tX === nX && tY === nY;
};

class DefNode implements Node {
  public readonly totalCost: number;
  public readonly fromStart: number;
  public readonly movementLeft: number;
  public readonly toEnd: number;

  public constructor(
    protected readonly map: Map,
    protected readonly costs: MovementCosts,
    protected readonly totalMovement: number,
    protected readonly target: Position,
    public readonly parent: Node,
    public readonly position: Position,
    public readonly tile: Tile
  ) {
    const { x: pX, y: pY } = parent.position;
    const parentTile = map.tiles[pX][pY];
    const { x: cX, y: cY } = position;
    const currentTile = map.tiles[cX][cY];
    const availableMoves =
      parent.movementLeft === 0 ? totalMovement : parent.movementLeft;
    const fromParentCost = costs.getCost(
      parentTile,
      currentTile,
      availableMoves
    );
    if (!fromParentCost) {
      throw new Error('Impassable tile');
    }
    this.fromStart = parent.fromStart + fromParentCost;
    this.movementLeft = availableMoves - fromParentCost;
    this.toEnd = distance(position, target);
    this.totalCost = this.fromStart + this.toEnd;
  }
}

const removeSmallest = <T>(
  arr: T[],
  comp: (comparisionBase: T, thisIsSmaller: T) => boolean
): T | undefined => {
  if (arr.length === 0) {
    return undefined;
  }
  let index = 0;
  let smallest: T = arr[index];
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    if (comp(smallest, current)) {
      index = i;
      smallest = current;
    }
  }
  arr.splice(index, 1);
  return smallest;
};

export default class AStar implements Pathfinder {
  public constructor(
    protected readonly map: Map,
    protected readonly costs: MovementCosts,
    protected readonly start: Position,
    protected readonly startMovement: number,
    protected readonly totalMovement: number
  ) {}

  public getPath = (target: Position): Position[] => {
    const start: Node = {
      fromStart: 0,
      movementLeft: this.startMovement,
      parent: null,
      position: this.start,
      tile: this.map.tiles[target.x][target.y],
      toEnd: distance(this.start, target),
      totalCost: distance(this.start, target),
    };
    const openList: Node[] = [start];
    const closedList: Node[] = [];

    let loops = 0;

    while (loops < 1000) {
      loops++;
      const current = removeSmallest(
        openList,
        (a, b) => a.totalCost > b.totalCost
      );
      if (!current) {
        // open list is empty, there's no way to the target
        return [];
      }

      closedList.push(current);
      if (isSame(target)(current)) {
        return this.generatePath(current);
      }

      getNeighbors(current.position, this.map.width, this.map.height).forEach(
        neighbor => {
          const toNode = this.newNode(target, current, neighbor);
          if (!toNode) {
            return;
          }
          if (closedList.find(isSame(toNode.position))) {
            return;
          }
          const duplicate = openList.findIndex(isSame(toNode.position));
          if (duplicate < 0) {
            openList.push(toNode);
          } else if (openList[duplicate].fromStart > toNode.fromStart) {
            openList[duplicate] = toNode;
          }
        }
      );
    }

    return [];
  };

  protected generatePath = (node: Node): Position[] => {
    const result = [node.position];
    let prev = node.parent;
    // break the loop before `start` location is added, we don't want it
    while (prev && prev.parent !== null) {
      result.push(prev.position);
      prev = prev.parent;
    }
    return result.reverse();
  };

  /**
   * Helper method which quickly returns a new node or null if it's not walkable.
   */
  protected newNode = (
    target: Position,
    parent: Node,
    position: Position
  ): Node | null => {
    try {
      return new DefNode(
        this.map,
        this.costs,
        this.totalMovement,
        target,
        parent,
        position,
        this.map.tiles[position.x][position.y]
      );
    } catch (error) {
      return null;
    }
  };
}

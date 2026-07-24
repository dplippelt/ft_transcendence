import { Direction } from "./procedural";
import { type weight } from "./math";

export enum WallType {
	Moss,
	MoreMoss,
	ThinA,
	ThinB,
	Thick,
}

export enum FloorType {
 	Clean,
	SmallCracksA,
	SmallCracksB,
	Cracked,
	Damaged,
	Broken,
}

export enum Foilage {
  RedMushroom,
  PurpleMushroom,
  Weeds
}

export enum Props {
  Barrel,
  Chest,
  Box,
  Jugs,
}

export enum PassageType {
  StairwayUp,
  StairwayDown,
  DoorFrontClosed,
  DoorFrontOpen,
  DoorSidewayClosed,
  DoorSidewayOpen,
  FramedDoorOpen,
  FramedDoorClosed,
}

type CornerDirection = Direction.TopLeft | Direction.TopRight | Direction.DownLeft | Direction.DownRight;
type WallDirection = Direction.Top | Direction.Right | Direction.Down | Direction.Left;

export interface TileSetMap {
  corners: Record<CornerDirection, number>;
  innerCorners: Record<CornerDirection, number>;
  walls: Record<WallDirection, Partial<Record<WallType, number>>>;
  floor: Record<FloorType, weight>;
  passages: Record<PassageType, number>
}

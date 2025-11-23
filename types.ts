export type Coordinate = {
  x: number;
  y: number;
};

export enum CellType {
  EMPTY = 'EMPTY',
  WALL = 'WALL',
  FISH = 'FISH', // The Reward
  AGENT = 'AGENT',
}

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  value: number; // The calculated V(s)
  stepsToReward: number;
  isPath: boolean; // If it's on the shortest path
}

export const GRID_SIZE = 12;
export const REWARD_VALUE = 100;
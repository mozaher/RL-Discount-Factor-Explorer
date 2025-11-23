import { Coordinate, GridCell, GRID_SIZE, CellType, REWARD_VALUE } from '../types';

// Directions for movement (Up, Down, Left, Right)
const DIRECTIONS = [
  { dx: 0, dy: -1 }, // Up
  { dx: 0, dy: 1 },  // Down
  { dx: -1, dy: 0 }, // Left
  { dx: 1, dy: 0 },  // Right
];

/**
 * Calculates the value of every cell in the grid based on the distance to the nearest fish
 * and the discount factor gamma.
 */
export const calculateGridValues = (
  walls: Set<string>,
  fishes: Coordinate[],
  gamma: number
): GridCell[][] => {
  // Initialize grid
  const grid: GridCell[][] = Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      x,
      y,
      type: CellType.EMPTY, // Default, will be overridden by renderer logic for static items
      value: 0,
      stepsToReward: Infinity,
      isPath: false,
    }))
  );

  // Breadth-First Search to find shortest path from ANY fish to all cells
  // We start from all fishes simultaneously
  const queue: { x: number; y: number; steps: number }[] = [];
  const visited = new Set<string>();

  fishes.forEach((fish) => {
    queue.push({ x: fish.x, y: fish.y, steps: 0 });
    visited.add(`${fish.x},${fish.y}`);
    // The fish itself has value = REWARD_VALUE * gamma^0 = REWARD_VALUE
    grid[fish.y][fish.x].stepsToReward = 0;
    grid[fish.y][fish.x].value = REWARD_VALUE;
  });

  while (queue.length > 0) {
    const { x, y, steps } = queue.shift()!;

    for (const dir of DIRECTIONS) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const key = `${nx},${ny}`;

      // Check bounds
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        // Check walls and visited
        if (!walls.has(key) && !visited.has(key)) {
          visited.add(key);
          
          const newSteps = steps + 1;
          const discountedValue = REWARD_VALUE * Math.pow(gamma, newSteps);

          grid[ny][nx].stepsToReward = newSteps;
          grid[ny][nx].value = discountedValue;

          queue.push({ x: nx, y: ny, steps: newSteps });
        }
      }
    }
  }

  return grid;
};

/**
 * Find shortest path from Agent to nearest Fish for visualization
 */
export const findShortestPath = (
  start: Coordinate,
  fishes: Coordinate[],
  walls: Set<string>
): Set<string> => {
  const pathSet = new Set<string>();
  if (fishes.length === 0) return pathSet;

  // BFS to find target
  const queue: { x: number; y: number; path: Coordinate[] }[] = [];
  const visited = new Set<string>();
  
  queue.push({ x: start.x, y: start.y, path: [] });
  visited.add(`${start.x},${start.y}`);

  let nearestPath: Coordinate[] | null = null;

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;

    // Check if current node is a fish
    if (fishes.some(f => f.x === x && f.y === y)) {
      nearestPath = path;
      break; // Found nearest because BFS guarantees shortest path
    }

    for (const dir of DIRECTIONS) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const key = `${nx},${ny}`;

      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        if (!walls.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
        }
      }
    }
  }

  if (nearestPath) {
    nearestPath.forEach(p => pathSet.add(`${p.x},${p.y}`));
  }
  
  return pathSet;
};
import React from 'react';
import { Coordinate, GridCell, CellType, REWARD_VALUE } from '../types';
import { Fish, Waves, Anchor, User } from 'lucide-react';

interface GridBoardProps {
  gridData: GridCell[][];
  agentPos: Coordinate;
  walls: Set<string>;
  fishes: Coordinate[];
  pathCells: Set<string>;
  onCellClick: (x: number, y: number) => void;
  mode: 'move' | 'wall' | 'fish';
}

export const GridBoard: React.FC<GridBoardProps> = ({
  gridData,
  agentPos,
  walls,
  fishes,
  pathCells,
  onCellClick,
  mode,
}) => {
  
  const getCellColor = (cell: GridCell, isWall: boolean, isAgent: boolean, isFish: boolean) => {
    if (isWall) return 'bg-slate-800 border-slate-700 shadow-inner';
    if (isFish) return 'bg-emerald-500/20 border-emerald-400';
    
    // Heatmap logic based on value
    const intensity = cell.value / REWARD_VALUE; // 0 to 1
    
    if (intensity <= 0) return 'bg-blue-950 border-blue-900/50'; // Unreachable or too far

    // Interpolate between Deep Blue and Bright Teal/Cyan
    // Using HSLA for cleaner gradients
    // Low value: 220 deg (Blue)
    // High value: 170 deg (Teal)
    // Lightness increases with value
    const hue = 220 - (intensity * 50); 
    const lightness = 15 + (intensity * 40); 
    const alpha = 0.4 + (intensity * 0.6);

    return `border-blue-800/30 transition-colors duration-300`;
  };

  const getInlineStyle = (cell: GridCell, isWall: boolean): React.CSSProperties => {
    if (isWall || cell.value === 0) return {};
    const intensity = cell.value / REWARD_VALUE;
    // Using pure CSS for dynamic background color to avoid Tailwind class explosion
    return {
      backgroundColor: `hsla(${210 - intensity * 40}, 80%, ${20 + intensity * 30}%, ${0.3 + intensity * 0.7})`
    };
  };

  return (
    <div 
      className="grid gap-1 p-1 bg-slate-900/50 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm select-none"
      style={{ gridTemplateColumns: `repeat(${gridData.length}, minmax(0, 1fr))` }}
    >
      {gridData.map((row, y) =>
        row.map((cell, x) => {
          const key = `${x},${y}`;
          const isWall = walls.has(key);
          const isAgent = agentPos.x === x && agentPos.y === y;
          const isFish = fishes.some(f => f.x === x && f.y === y);
          const isPath = pathCells.has(key);

          return (
            <div
              key={key}
              onClick={() => onCellClick(x, y)}
              style={getInlineStyle(cell, isWall)}
              className={`
                aspect-square relative flex items-center justify-center rounded-md 
                cursor-pointer transition-all duration-200
                ${getCellColor(cell, isWall, isAgent, isFish)}
                ${isPath && !isAgent && !isFish ? 'ring-2 ring-yellow-400/30' : ''}
                ${mode === 'move' && !isWall ? 'hover:bg-white/10' : ''}
                ${mode === 'wall' ? 'hover:bg-slate-700' : ''}
                ${mode === 'fish' ? 'hover:bg-emerald-900/50' : ''}
              `}
            >
              {/* Background Decoration for Water */}
              {!isWall && !isAgent && !isFish && (
                <span className="absolute text-[8px] text-blue-400/10 pointer-events-none font-mono">
                  {cell.value > 0 ? cell.value.toFixed(1) : ''}
                </span>
              )}

              {/* Path Indicator (Breadcrumbs) */}
              {isPath && !isAgent && !isFish && (
                <div className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-50 animate-pulse" />
              )}

              {/* Icons */}
              {isWall && <Waves className="w-3/4 h-3/4 text-slate-600" />}
              
              {isFish && (
                 <div className="relative w-3/4 h-3/4 animate-bounce-slow">
                   <Fish className="w-full h-full text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" fill="currentColor" />
                 </div>
              )}
              
              {isAgent && (
                <div className="relative w-3/4 h-3/4 z-10 transition-transform duration-200">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.6)]">
                    <path d="M12 2C7.58172 2 4 5.58172 4 10C4 14.4183 7.58172 18 12 18C16.4183 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
                    <path d="M7 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="9" cy="10" r="1" fill="white"/>
                    <circle cx="15" cy="10" r="1" fill="white"/>
                  </svg>
                </div>
              )}

              {/* Overlay text for the example provided in prompt */}
              {isAgent && (
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg z-20 pointer-events-none">
                    Value: {cell.value.toFixed(1)}
                 </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
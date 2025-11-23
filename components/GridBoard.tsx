import React from 'react';
import { Coordinate, GridCell, CellType, REWARD_VALUE } from '../types';
import { Fish, Waves } from 'lucide-react';

interface GridBoardProps {
  gridData: GridCell[][];
  agentPos: Coordinate;
  walls: Set<string>;
  fishes: Coordinate[];
  pathCells: Set<string>;
  onCellClick: (x: number, y: number) => void;
  mode: 'move' | 'wall' | 'fish';
  gamma: number;
}

export const GridBoard: React.FC<GridBoardProps> = ({
  gridData,
  agentPos,
  walls,
  fishes,
  pathCells,
  onCellClick,
  mode,
  gamma,
}) => {
  
  const getCellColor = (cell: GridCell, isWall: boolean, isAgent: boolean, isFish: boolean) => {
    if (isWall) return 'bg-slate-800 border-slate-700 shadow-inner';
    if (isFish) return 'bg-red-500/30 border-red-500'; // Red background for fish
    
    // Heatmap logic based on V(s) (proximity to fish)
    const intensity = cell.value / REWARD_VALUE; // 0 to 1
    
    if (intensity <= 0) return 'bg-blue-950 border-blue-900/50';

    // Interpolate between Deep Blue and Bright Teal/Cyan
    return `border-blue-800/30 transition-colors duration-300`;
  };

  const getInlineStyle = (cell: GridCell, isWall: boolean): React.CSSProperties => {
    if (isWall || cell.value === 0) return {};
    const intensity = cell.value / REWARD_VALUE;
    // Using pure CSS for dynamic background color
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

          // Calculate what text to show
          // On boxes: steps from start
          // On fish: value from start
          let cellText = '';
          let isValueText = false;
          
          if (!isWall) {
             if (isFish) {
                 // Value = R * gamma ^ stepsFromStart
                 if (cell.stepsFromStart !== Infinity) {
                    const val = REWARD_VALUE * Math.pow(gamma, cell.stepsFromStart);
                    cellText = val.toFixed(1);
                    isValueText = true;
                 } else {
                    cellText = '0';
                 }
             } else {
                 // Show steps
                 cellText = cell.stepsFromStart !== Infinity ? cell.stepsFromStart.toString() : '';
             }
          }

          return (
            <div
              key={key}
              onClick={() => onCellClick(x, y)}
              style={getInlineStyle(cell, isWall)}
              className={`
                aspect-square relative flex items-center justify-center rounded-md 
                cursor-pointer transition-all duration-200 overflow-hidden
                ${getCellColor(cell, isWall, isAgent, isFish)}
                ${isPath && !isAgent && !isFish ? 'ring-2 ring-yellow-400/30' : ''}
                ${mode === 'move' && !isWall ? 'hover:bg-white/10' : ''}
                ${mode === 'wall' ? 'hover:bg-slate-700' : ''}
                ${mode === 'fish' ? 'hover:bg-red-900/50' : ''}
              `}
            >
              {/* Path Indicator */}
              {isPath && !isAgent && !isFish && (
                <div className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-50 animate-pulse" />
              )}

              {/* Icons */}
              {isWall && <Waves className="w-3/4 h-3/4 text-slate-600" />}
              
              {isFish && (
                 <div className="absolute inset-0 flex items-center justify-center animate-bounce-slow opacity-80">
                   <Fish className="w-3/4 h-3/4 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" fill="currentColor" />
                 </div>
              )}
              
              {/* Text Overlay */}
              {!isWall && !isAgent && (
                <span className={`absolute z-10 font-mono font-bold pointer-events-none select-none
                  ${isValueText 
                      ? 'text-[10px] text-white bg-red-900/80 px-1 rounded shadow-sm border border-red-400/50 bottom-1' 
                      : 'text-[10px] text-blue-200/30'
                  }
                `}>
                  {cellText}
                </span>
              )}

              {/* Agent */}
              {isAgent && (
                <div className="relative w-3/4 h-3/4 z-20 transition-transform duration-200">
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
            </div>
          );
        })
      )}
    </div>
  );
};

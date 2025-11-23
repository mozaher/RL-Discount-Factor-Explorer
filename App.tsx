import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GRID_SIZE, Coordinate, REWARD_VALUE } from './types';
import { calculateGridValues, findShortestPath } from './utils/rlLogic';
import { GridBoard } from './components/GridBoard';
import { Settings, RotateCcw, Map, MousePointer2, Fish as FishIcon, BrickWall, HelpCircle, Info } from 'lucide-react';

// Preset Scenario from the user's image
const INITIAL_WALLS = [
    "2,1","3,1","4,1","5,1","7,1","8,1",
    "2,2","5,2","7,2",
    "2,3","3,3","7,3",
    "2,4","2,5","2,6","2,7","2,8",
    "8,2","8,3","8,4","8,5","8,6","8,7","8,8",
    "3,7","4,7","5,7","6,7"
];

// 100 points 20 steps away -> 12.2 => 100 * gamma^20 = 12.2 => gamma^20 = 0.122 => gamma approx 0.9
const DEFAULT_GAMMA = 0.9;

function App() {
  // --- State ---
  const [agentPos, setAgentPos] = useState<Coordinate>({ x: 1, y: 1 });
  const [walls, setWalls] = useState<Set<string>>(new Set(INITIAL_WALLS));
  const [fishes, setFishes] = useState<Coordinate[]>([{ x: 9, y: 5 }, { x: 3, y: 2 }]);
  const [gamma, setGamma] = useState<number>(DEFAULT_GAMMA);
  const [interactionMode, setInteractionMode] = useState<'move' | 'wall' | 'fish'>('move');
  const [showInfo, setShowInfo] = useState(true);

  // --- Derived State (RL Logic) ---
  const gridData = useMemo(() => {
    return calculateGridValues(walls, fishes, gamma);
  }, [walls, fishes, gamma]);

  const pathCells = useMemo(() => {
    return findShortestPath(agentPos, fishes, walls);
  }, [agentPos, fishes, walls]);

  const currentCell = gridData[agentPos.y]?.[agentPos.x];
  const currentValue = currentCell ? currentCell.value : 0;
  const stepsToReward = currentCell ? currentCell.stepsToReward : Infinity;

  // --- Handlers ---
  
  const handleReset = () => {
    setWalls(new Set(INITIAL_WALLS));
    setFishes([{ x: 9, y: 5 }, { x: 3, y: 2 }]);
    setAgentPos({ x: 1, y: 1 });
    setGamma(0.9);
  };

  const handleCellClick = (x: number, y: number) => {
    const key = `${x},${y}`;
    
    if (interactionMode === 'wall') {
      // Toggle Wall
      const newWalls = new Set(walls);
      if (newWalls.has(key)) newWalls.delete(key);
      else newWalls.add(key);
      
      // Ensure we don't place wall on agent or fish
      if (agentPos.x === x && agentPos.y === y) return;
      if (fishes.some(f => f.x === x && f.y === y)) return;
      
      setWalls(newWalls);
    } 
    else if (interactionMode === 'fish') {
      // Toggle Fish
      const existingFishIndex = fishes.findIndex(f => f.x === x && f.y === y);
      if (existingFishIndex >= 0) {
        const newFishes = [...fishes];
        newFishes.splice(existingFishIndex, 1);
        setFishes(newFishes);
      } else {
        if (walls.has(key)) return; // Can't place on wall
        if (agentPos.x === x && agentPos.y === y) return; // Can't place on agent
        setFishes([...fishes, { x, y }]);
      }
    } 
    else if (interactionMode === 'move') {
      // Move Agent (Teleport)
      if (!walls.has(key)) {
        setAgentPos({ x, y });
      }
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp') dy = -1;
    if (e.key === 'ArrowDown') dy = 1;
    if (e.key === 'ArrowLeft') dx = -1;
    if (e.key === 'ArrowRight') dx = 1;

    if (dx === 0 && dy === 0) return;

    const nx = agentPos.x + dx;
    const ny = agentPos.y + dy;
    const key = `${nx},${ny}`;

    // Check bounds and walls
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !walls.has(key)) {
      setAgentPos({ x: nx, y: ny });
    }
  }, [agentPos, walls]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar / Controls */}
      <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-8 md:h-screen overflow-y-auto z-10 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Discount Factor (<span className="font-serif italic">γ</span>)
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Explore how immediate rewards are valued higher than distant ones in Reinforcement Learning.
          </p>
        </div>

        {/* Main Formula Display */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Value Function</div>
          <div className="text-xl font-mono text-center py-2">
            V(s) = R × γ<sup className="text-sm">t</sup>
          </div>
          <div className="mt-4 space-y-2 text-sm font-mono">
            <div className="flex justify-between border-b border-slate-700 pb-1">
              <span className="text-emerald-400">R (Reward)</span>
              <span>{REWARD_VALUE}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-1">
              <span className="text-cyan-400">γ (Gamma)</span>
              <span>{gamma.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-1">
              <span className="text-yellow-400">t (Steps)</span>
              <span>{stepsToReward === Infinity ? '∞' : stepsToReward}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-lg">
              <span>Value</span>
              <span className="text-orange-400">{currentValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="flex justify-between text-sm font-medium mb-2">
              <span>Discount Factor (Gamma)</span>
              <span className="bg-slate-800 px-2 rounded text-cyan-400">{gamma.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.99"
              step="0.01"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.1 (Myopic)</span>
              <span>0.99 (Farsighted)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setInteractionMode('move')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                interactionMode === 'move' 
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <MousePointer2 size={18} />
              <span className="text-xs">Move</span>
            </button>
            <button
              onClick={() => setInteractionMode('wall')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                interactionMode === 'wall' 
                  ? 'bg-slate-600/20 border-slate-400 text-slate-300' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <BrickWall size={18} />
              <span className="text-xs">Wall</span>
            </button>
            <button
              onClick={() => setInteractionMode('fish')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                interactionMode === 'fish' 
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <FishIcon size={18} />
              <span className="text-xs">Reward</span>
            </button>
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={handleReset}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <RotateCcw size={16} /> Reset Board
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 p-4 md:p-12 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600 rounded-full blur-[128px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600 rounded-full blur-[128px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl aspect-square">
           <GridBoard 
             gridData={gridData}
             agentPos={agentPos}
             walls={walls}
             fishes={fishes}
             pathCells={pathCells}
             onCellClick={handleCellClick}
             mode={interactionMode}
           />
        </div>

        {/* Instructions Overlay */}
        {showInfo && (
          <div className="absolute top-4 right-4 max-w-xs bg-slate-900/90 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur text-sm z-50">
            <div className="flex justify-between items-start mb-2">
               <h3 className="font-bold text-cyan-400 flex items-center gap-2"><Info size={16}/> How to use</h3>
               <button onClick={() => setShowInfo(false)} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            <ul className="space-y-2 text-slate-300 list-disc list-inside">
              <li>Use <strong>Arrow Keys</strong> or click to move the Agent.</li>
              <li>Observe the <strong>Value</strong> decrease as you move away from the fish.</li>
              <li>Adjust <strong>Gamma (γ)</strong> to see how "patience" affects value. High γ means distant rewards are still valuable.</li>
              <li>Select <strong>Wall</strong> or <strong>Reward</strong> mode to customize the map.</li>
            </ul>
          </div>
        )}
        
        {!showInfo && (
           <button 
             onClick={() => setShowInfo(true)}
             className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 text-cyan-400 rounded-full transition-colors"
           >
             <HelpCircle size={24} />
           </button>
        )}

      </div>
    </div>
  );
}

export default App;
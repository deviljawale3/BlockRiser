// BlockRiser Game Engine
// Fully Modularized TypeScript Implementation

import { gameLoop } from './render';

// --- TYPES ---
export interface Theme {
    id: string;
    name: string;
    unlock: number;
}

export interface Upgrade {
    id: 'magnet' | 'insurance' | 'eye';
    name: string;
    desc: string;
    maxLevel: number;
    costs: number[];
}

export interface City {
    id: string;
    name: string;
    unlockCost: number;
    gridSize: number; // e.g., 8 for 8x8, 10 for 10x10
    bonus: number; // Score multiplier
    style: string;
}

export interface GameEvent {
    id: 'goldRush' | 'sabotage' | 'bullMarket' | 'crash';
    name: string;
    desc: string;
    duration: number; // in turns/moves
}

export interface Shape {
    id: string;
    map: number[][];
}

export interface HQLevel {
    id: string;
    name: string;
    incomeRate: number; // coins per hour
    cost: number;
}

export interface Policy {
    id: 'aggressive' | 'taxShield' | 'leanStartup';
    name: string;
    desc: string;
    icon: string;
}

export interface AdventureLevel {
    id: number;
    title: string;
    goalType: 'lines' | 'score' | 'blocks' | 'gems' | 'boss';
    target: number;
    moves: number;
    desc: string;
    board?: (number | string | null)[][];
    bossDefeatedThisSession?: boolean;
}

export interface Acquisition {
    id: string;
    name: string;
    desc: string;
    requirement: number; // Total points
    icon: string;
}

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    check: (stats: any) => boolean;
}

export interface Inventory {
    hammer: number;
    bomb: number;
    reroll: number;
    undo: number;
}

// --- CONSTANTS & CONFIG ---
export const COLS = 8;
export const ROWS = 8;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1200;
export const GRID_OFFSET_X = 60; // Narrower board to save vertical space
export const GRID_OFFSET_Y = 160;
export const CELL_SIZE = (CANVAS_WIDTH - (GRID_OFFSET_X * 2)) / COLS;
export const QUEUE_Y = GRID_OFFSET_Y + (ROWS * CELL_SIZE) + 30; // Closer to grid
export const QUEUE_HEIGHT = 160;

export const STORAGE_KEY = 'blockriser-highscore';
export const STATE_KEY = 'blockriser-state';
export const STATS_KEY = 'blockriser-global-stats';
export const LEADERBOARD_KEY = 'blockriser-leaderboard';

export const PALETTES = [
    // Block Blast Primary (Vibrant & Glossy)
    ['#FF3B30', '#4CD964', '#007AFF', '#FFCC00', '#FF9500', '#5856D6', '#5AC8FA', '#FF2D55'],
    // Pastel Paint
    ['#E57373', '#81C784', '#64B5F6', '#FFF176', '#FFB74D', '#BA68C8', '#4DD0E1'],
    // Dark Stain
    ['#B71C1C', '#1B5E20', '#0D47A1', '#F57F17', '#E65100', '#4A148C', '#006064'],
    // Nordic Wood (Monochrome + Accent)
    ['#8D6E63', '#A1887F', '#D7CCC8', '#FF7043', '#5D4037'],
    // Retro Paint
    ['#F44336', '#4CAF50', '#2196F3', '#FFEB3B', '#FF9800']
];

export const THEMES: Theme[] = [
    { id: 'classic', name: 'Oak', unlock: 0 },
    { id: 'pixel', name: 'Pine', unlock: 2000 },
    { id: 'neon', name: 'Mahogany', unlock: 5000 },
    { id: 'midnight', name: 'Ebony', unlock: 8000 },
    { id: 'obsidian', name: 'Walnut', unlock: 10000 },
    { id: 'eclipse', name: 'Cherry', unlock: 15000 },
    { id: 'abyss', name: 'Teak', unlock: 20000 },
    { id: 'inferno', name: 'Birch', unlock: 25000 },
    { id: 'spectral', name: 'Maple', unlock: 30000 }
];

export const SHAPES: Shape[] = [
    { id: '1x1', map: [[1]] },
    { id: '2x1', map: [[1], [1]] },
    { id: '1x2', map: [[1, 1]] },
    { id: '3x1', map: [[1], [1], [1]] },
    { id: '1x3', map: [[1, 1, 1]] },
    { id: '4x1', map: [[1], [1], [1], [1]] },
    { id: '1x4', map: [[1, 1, 1, 1]] },
    { id: '5x1', map: [[1], [1], [1], [1], [1]] },
    { id: '1x5', map: [[1, 1, 1, 1, 1]] },
    { id: '2x2', map: [[1, 1], [1, 1]] },
    { id: '3x3', map: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
    // T-Piece orientations
    { id: 'T2', map: [[1, 1, 1], [0, 1, 0]] },
    { id: 'T4', map: [[0, 1, 0], [1, 1, 1]] },
    { id: 'T1', map: [[0, 1], [1, 1], [0, 1]] },
    { id: 'T3', map: [[1, 0], [1, 1], [1, 0]] },
    // L-Piece orientations
    { id: 'L1', map: [[1, 0], [1, 0], [1, 1]] },
    { id: 'L2', map: [[1, 1, 1], [1, 0, 0]] },
    { id: 'L3_v2', map: [[1, 1], [0, 1], [0, 1]] },
    { id: 'L4', map: [[0, 0, 1], [1, 1, 1]] },
    // J-Piece orientations
    { id: 'J1', map: [[0, 1], [0, 1], [1, 1]] },
    { id: 'J2', map: [[1, 0, 0], [1, 1, 1]] },
    { id: 'J3', map: [[1, 1], [1, 0], [1, 0]] },
    { id: 'J4', map: [[1, 1, 1], [0, 0, 1]] },
    // S-Piece orientations
    { id: 'S1', map: [[0, 1, 1], [1, 1, 0]] },
    { id: 'S2', map: [[1, 0], [1, 1], [0, 1]] },
    // Z-Piece orientations
    { id: 'Z1', map: [[1, 1, 0], [0, 1, 1]] },
    { id: 'Z2', map: [[0, 1], [1, 1], [1, 0]] },
    // Small Corner (L3) orientations
    { id: 'SC1', map: [[1, 1], [1, 0]] },
    { id: 'SC2', map: [[1, 1], [0, 1]] },
    { id: 'SC3', map: [[1, 0], [1, 1]] },
    { id: 'SC4', map: [[0, 1], [1, 1]] },
    // Large Corner (L5) orientations
    { id: 'LC1', map: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    { id: 'LC2', map: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
    { id: 'LC3', map: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
    { id: 'LC4', map: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
    { id: 'Plus', map: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] }
];

export const ADVENTURE_LEVELS: AdventureLevel[] = [
    {
        id: 0, title: "Sunny Start", goalType: 'gems', target: 5, moves: 30, desc: "Collect 5 Gems", board: [
            [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 'G', 0, 0, 'G', 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 'G', 0, 0, 'G', 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 'G', 0, 0, 0, 0]
        ]
    },
    {
        id: 1, title: "Color Bloom", goalType: 'lines', target: 5, moves: 25, desc: "Clear 5 Lines", board: [
            [0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 2, title: "Blocky Suburbs", goalType: 'score', target: 2500, moves: 25, desc: "Score 2,500 Pts", board: [
            [1, 0, 0, 1, 1, 0, 0, 1], [0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0], [0, 1, 1, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 1, 1, 0, 0, 1]
        ]
    },
    {
        id: 3, title: "Puzzle Peaks", goalType: 'blocks', target: 40, moves: 20, desc: "Place 40 Blocks", board: [
            [1, 1, 1, 0, 0, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 0, 0], [1, 0, 1, 1, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 0, 0, 1, 1, 1]
        ]
    },
    {
        id: 4, title: "Treasure Hunt", goalType: 'gems', target: 15, moves: 30, desc: "Collect 15 Gems", board: [
            ['G', 1, 0, 0, 0, 0, 1, 'G'], [1, 1, 0, 0, 0, 0, 1, 1], [0, 0, 'G', 1, 1, 'G', 0, 0], [0, 0, 1, 'G', 'G', 1, 0, 0],
            [0, 0, 1, 'G', 'G', 1, 0, 0], [0, 0, 'G', 1, 1, 'G', 0, 0], [1, 1, 0, 0, 0, 0, 1, 1], ['G', 1, 0, 0, 0, 0, 1, 'G']
        ]
    },
    {
        id: 5, title: "Metal Works", goalType: 'blocks', target: 50, moves: 25, desc: "Place 50 Blocks", board: [
            [1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 0, 0, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 1], [1, 0, 0, 1, 1, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        id: 6, title: "Robot Factory", goalType: 'lines', target: 8, moves: 25, desc: "Clear 8 Lines", board: [
            [0, 1, 0, 1, 0, 1, 0, 1], [1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 1], [0, 1, 0, 0, 0, 0, 1, 0], [1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 0, 1]
        ]
    },
    {
        id: 7, title: "Jungle Gym", goalType: 'gems', target: 20, moves: 30, desc: "Collect 20 Gems", board: [
            [0, 1, 0, 'G', 'G', 0, 1, 0], [1, 1, 1, 0, 0, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0], ['G', 0, 'G', 0, 0, 'G', 0, 'G'],
            ['G', 0, 'G', 0, 0, 'G', 0, 'G'], [0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 0, 0, 1, 1, 1], [0, 1, 0, 'G', 'G', 0, 1, 0]
        ]
    },
    {
        id: 8, title: "High Score Hero", goalType: 'score', target: 10000, moves: 35, desc: "Score 10,000 Pts", board: [
            [1, 0, 0, 1, 1, 0, 0, 1], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [1, 0, 0, 1, 1, 0, 0, 1]
        ]
    },
    {
        id: 9, title: "Toy Master's Lair", goalType: 'boss', target: 1, moves: 40, desc: "Defeat Toy Master", board: [
            [1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 'G', 'G', 'G', 'G', 0, 1], [1, 0, 'G', 1, 1, 'G', 0, 1],
            [1, 0, 'G', 1, 1, 'G', 0, 1], [1, 0, 'G', 'G', 'G', 'G', 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        id: 10, title: "MECHANIC: ICE 🧊", goalType: 'lines', target: 8, moves: 30, desc: "Ice needs 2 hits!", board: [
            [0, 0, 0, 0, 0, 0, 0, 0], [0, 'I', 'I', 0, 0, 'I', 'I', 0], [0, 'I', 'I', 0, 0, 'I', 'I', 0], [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 'I', 'I', 0, 0, 0], [0, 0, 0, 'I', 'I', 0, 0, 0], [0, 'I', 'I', 0, 0, 'I', 'I', 0], [0, 0, 0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 11, title: "MECHANIC: CHAINS ⛓️", goalType: 'gems', target: 5, moves: 25, desc: "Linked: Break one, break all!", board: [
            ['G', 0, 0, 'C', 'C', 0, 0, 'G'], [0, 0, 0, 0, 0, 0, 0, 0], [0, 'C', 0, 0, 0, 0, 'C', 0], [0, 0, 0, 'G', 'G', 0, 0, 0],
            [0, 0, 0, 'G', 'G', 0, 0, 0], [0, 'C', 0, 0, 0, 0, 'C', 0], [0, 0, 0, 0, 0, 0, 0, 0], ['G', 0, 0, 'C', 'C', 0, 0, 'G']
        ]
    },
    {
        id: 12, title: "ULTIMATE TEST 🏆", goalType: 'score', target: 5000, moves: 35, desc: "Ice & Chains together!", board: [
            ['I', 'C', 'I', 'C', 'I', 'C', 'I', 'C'], [0, 0, 0, 0, 0, 0, 0, 0], ['C', 'I', 'C', 'I', 'C', 'I', 'C', 'I'], [0, 0, 0, 0, 0, 0, 0, 0],
            ['I', 0, 0, 0, 0, 0, 0, 'I'], [0, 0, 0, 0, 0, 0, 0, 0], ['C', 0, 0, 0, 0, 0, 0, 'C'], [0, 0, 0, 0, 0, 0, 0, 0]
        ]
    },
    {
        id: 13, title: "Diamond Vault", goalType: 'gems', target: 70, moves: 40, desc: "Collect 70 Gems", board: [
            [1, 1, 1, 'G', 'G', 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 'G', 'G', 'G', 'G', 0, 1], ['G', 0, 'G', 1, 1, 'G', 0, 'G'],
            ['G', 0, 'G', 1, 1, 'G', 0, 'G'], [1, 0, 'G', 'G', 'G', 'G', 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 'G', 'G', 1, 1, 1]
        ]
    },
    {
        id: 14, title: "Toy Master", goalType: 'boss', target: 1, moves: 50, desc: "Final Showdown!", board: [
            [1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 'G', 'G', 'G', 'G', 0, 1], [1, 0, 'G', 1, 1, 'G', 0, 1],
            [1, 0, 'G', 1, 1, 'G', 0, 1], [1, 0, 'G', 'G', 'G', 'G', 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1]
        ]
    }
];


export const ACQUISITIONS: Acquisition[] = [
    { id: 'vintage', name: 'Vintage Robot', desc: 'Classic 90s Toy. +1% Income.', requirement: 10000, icon: '🤖' },
    { id: 'train', name: 'Model Train', desc: 'Electric Set. +2% Score.', requirement: 50000, icon: '🚂' },
    { id: 'console', name: 'Retro Console', desc: 'High Score Glitch. +1 Move/Game.', requirement: 150000, icon: '🕹️' },
    { id: 'castle', name: 'Dream Castle', desc: 'Magical Playset. +5% Income.', requirement: 500000, icon: '🏰' },
    { id: 'rocket', name: 'Moon Rocket', desc: 'To Infinity! +10% Multiplier.', requirement: 1000000, icon: '🚀' }
];

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'novice', name: 'Novice Builder', desc: 'Place 50 Blocks', icon: '🧱', check: s => s.blocksPlaced >= 50 },
    { id: 'expert', name: 'Master Architect', desc: 'Place 1000 Blocks', icon: '🏗️', check: s => s.blocksPlaced >= 1000 },
    { id: 'cleaner', name: 'Housekeeper', desc: 'Clear 100 Lines', icon: '🧹', check: s => s.linesCleared >= 100 },
    { id: 'bomber', name: 'Demolition Expert', desc: 'Use 20 Power-ups', icon: '💥', check: s => (s.hammersUsed + s.bombsUsed) >= 20 },
    { id: 'veteran', name: 'Veteran', desc: 'Play 50 Games', icon: '🎖️', check: s => s.gamesPlayed >= 50 }
];

export const UPGRADES: Upgrade[] = [
    { id: 'magnet', name: 'Magnet', desc: 'Increases Gold block spawn rate', maxLevel: 5, costs: [500, 1000, 2000, 4000, 8000] },
    { id: 'insurance', name: 'Insurance', desc: 'Chance to save your Undo charge', maxLevel: 5, costs: [1000, 2000, 4000, 8000, 15000] },
    { id: 'eye', name: 'Architect Eye', desc: 'Advanced visual placement helper', maxLevel: 3, costs: [2000, 5000, 10000] },
    { id: 'combo', name: 'Combo King', desc: '+10% Combo score per level', maxLevel: 5, costs: [3000, 6000, 12000, 25000, 50000] },
    { id: 'frenzy', name: 'Frenzy Master', desc: '+1 Move of Frenzy per level', maxLevel: 5, costs: [4000, 8000, 16000, 32000, 64000] }
];

export const CITIES: City[] = [
    { id: 'suburbs', name: 'Blocky Suburbs', unlockCost: 0, gridSize: 8, bonus: 1, style: 'default' },
    { id: 'neon', name: 'Neon Downtown', unlockCost: 5000, gridSize: 9, bonus: 1.2, style: 'neon' },
    { id: 'obsidian', name: 'Obsidian Valley', unlockCost: 15000, gridSize: 10, bonus: 1.5, style: 'obsidian' }
];

export const HQ_UPGRADES: HQLevel[] = [
    { id: 'box', name: 'Cardboard Box', incomeRate: 10, cost: 500 },
    { id: 'chest', name: 'Wooden Chest', incomeRate: 50, cost: 2000 },
    { id: 'room', name: 'Play Room', incomeRate: 200, cost: 10000 },
    { id: 'vault', name: 'Toy Paradise', incomeRate: 1000, cost: 50000 }
];

export const POLICIES: Policy[] = [
    { id: 'aggressive', name: 'Mega Blocks', desc: 'Pieces 20% larger | 2x Score', icon: '🧱' },
    { id: 'taxShield', name: 'Safety Net', desc: '3 Extra Lives (Board Clears)', icon: '🕸️' },
    { id: 'leanStartup', name: 'Quick Sort', desc: '1 Queue Slot | 3x Passive Income', icon: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#ffeb3b" stroke="#f57f17" stroke-width="2" stroke-linejoin="round"/></svg>' }
];

export const EVENTS: GameEvent[] = [
    { id: 'goldRush', name: 'SUGAR RUSH!', desc: '50% Gold Blocks!', duration: 15 },
    { id: 'sabotage', name: 'MESSY ROOM!', desc: 'Rival blocks spawning!', duration: 1 },
    { id: 'bullMarket', name: 'PLAY TIME!', desc: '2x Multiplier | High Speed!', duration: 20 },
    { id: 'crash', name: 'CLEAN UP!', desc: 'Queue Reset!', duration: 1 }
];

export const DAILY_REWARDS = [
    { day: 1, type: 'coin', val: 100, icon: '🟡' },
    { day: 2, type: 'hammer', val: 1, icon: '🔨' },
    { day: 3, type: 'coin', val: 300, icon: '🟡' },
    { day: 4, type: 'reroll', val: 2, icon: '🔄' },
    { day: 5, type: 'coin', val: 1000, icon: '💰' },
    { day: 6, type: 'bomb', val: 1, icon: '💣' },
    { day: 7, type: 'coin', val: 2000, icon: '💎' }
];



// --- CLASSES ---

export class Piece {
    shapeId: string;
    map: number[][];
    color: string;
    rows: number;
    cols: number;
    x: number = 0;
    y: number = 0;
    scale: number = 0;
    targetScaleQueue: number = 0.6;
    baseX: number = 0;
    baseY: number = 0;
    isDragging: boolean = false;
    rotated: boolean = false;
    visualRotation: number = 0;
    timer: number = 0; // For inflation/crypto

    type: 'normal' | 'gold' | 'metal' | 'multiplier' | 'inflation' | 'liquid' | 'crypto' = 'normal';
    multiplierType?: 'square' | 'cross';

    constructor(lvl: number = 1, sid: string | null = null) {
        let s = sid ? SHAPES.find(x => x.id === sid) : SHAPES[Math.floor(Math.random() * SHAPES.length)];
        if (!s) s = SHAPES[0];
        this.shapeId = s.id;
        this.map = s.map.map(r => [...r]);
        const currentPalette = PALETTES[Math.min(lvl - 1, PALETTES.length - 1)];
        this.color = currentPalette[Math.floor(Math.random() * currentPalette.length)];
        this.rows = this.map.length;
        this.cols = this.map[0].length;

        // Enhanced special block spawning
        const magnetLvl = GlobalStats.upgrades.magnet;
        const goldChance = (magnetLvl * 0.08) + 0.02; // Base 2% + 8% per magnet level

        if (Math.random() < goldChance) {
            this.type = 'gold';
            this.color = '#FFD700';
        } else if (lvl > 3 && Math.random() < 0.08) { // Lowered from lvl 5, increased chance
            this.type = 'metal';
            this.color = '#A0A0A0';
        } else if (Math.random() < 0.06) { // Increased from 0.03
            this.type = 'multiplier';
            this.multiplierType = Math.random() > 0.5 ? 'square' : 'cross';
            // Visual indicator for multiplier blocks
            this.color = this.multiplierType === 'square' ? '#FF6B6B' : '#4ECDC4';
        } else if (lvl > 6 && Math.random() < 0.05) { // Lowered from lvl 8
            this.type = 'inflation';
        } else if (lvl > 4 && Math.random() < 0.05) { // Lowered from lvl 6
            this.type = 'liquid';
        } else if (lvl > 8 && Math.random() < 0.04) { // Lowered from lvl 10
            this.type = 'crypto';
        }

        // Mega Blocks Cosmetic Logic (Senior Stability Fix)
        if (State.activePolicy === 'aggressive' && Math.random() > 0.5) {
            // Cosmetic only: slightly brighter color or special flag
            this.color = '#FF8A65'; // Vibrant orange for Mega Pieces
        }
    }

    rotate() {
        // Rotation disabled to match Block Blast mechanics
        showToast("Rotation not allowed!");
        return;
    }
}

// --- STATE MANAGEMENT ---

export const GlobalStats = {
    gamesPlayed: 0,
    linesCleared: 0,
    blocksPlaced: 0,
    hammersUsed: 0,
    bombsUsed: 0,
    unlockedAchievements: ACHIEVEMENTS.map(a => a.id),
    unlockedAcquisitions: ACQUISITIONS.map(a => a.id),
    totalScore: 0,
    adventureMaxLevel: 10,
    coins: 9999, // Bonus coins for design/testing
    dailyStreak: 0,
    lastLogin: null as string | null,
    inventory: { hammer: 99, bomb: 99, reroll: 99, undo: 99, merger: 99, takeover: 99, taxHaven: 99 } as Inventory,
    upgrades: { magnet: 1, insurance: 1, eye: 1, combo: 0, frenzy: 0 },
    hqLevel: 4,
    currentCity: 'suburbs',
    unlockedCities: ['suburbs', 'neon', 'obsidian'],
    lastPassiveCollection: Date.now(),
    leagueRank: 4,
    bossDefeated: 0,
    // NEW ANALYTICS
    totalGoldEarned: 0,
    maxCombo: 0,
    maxStreak: 0,
    timePlayed: 0, // in seconds
    allTimeHighScore: 0
};

export const LEAGUES = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];



export const State = {
    grid: [] as (any | null)[][],
    score: 0,
    displayedScore: 0,
    highScore: 0,
    level: 1,
    linesClearedTotal: 0,
    streak: 0,
    queue: [] as (Piece | null)[],
    floatingTexts: [] as any[],
    leaderboard: [] as any[],
    draggedPieceIndex: -1,
    touchStartTime: 0,
    touchStartPos: { x: 0, y: 0 },
    particles: [] as any[],
    bgShapes: [] as any[],
    isClearing: false,
    clearingRows: [] as number[],
    clearingCols: [] as number[],
    isGameOver: false,
    isEnding: false,
    isPaused: false,
    gameMode: 'classic',
    bombCounter: 0,
    currentTheme: 'classic',
    activeCity: 'suburbs',
    activeTool: null as string | null,
    adventure: { levelId: 0, progress: 0, sessionBlocks: 0, sessionLines: 0, sessionGems: 0, movesLeft: 0, maxMoves: 0, bossDefeatedThisSession: false },
    tutorial: { active: false, step: 0 },
    settings: { highQuality: true, vibration: true, gameSpeed: 0, music: true, sfx: true },
    screenShake: 0,
    clearStartTime: 0,
    previousMove: null as any | null,
    gameRunning: false,
    investor: { active: false, type: 'lines', target: 0, progress: 0, movesLeft: 0, reward: 0 },
    frenzy: { moves: 0, mult: 1 },
    moveCount: 0,
    boss: { active: false, name: '', health: 100, maxHealth: 100, movesLeft: 20 },
    comboHeat: 0,
    activePolicy: null as 'aggressive' | 'taxShield' | 'leanStartup' | null,
    bailoutsLeft: 0,
    activeEvent: null as GameEvent | null,
    eventTimer: 0,
    taxHavenMoves: 0,
    phantomPos: null as { x: number, y: number, gx: number, gy: number } | null,
    blockSkin: 'default' as 'default' | 'crystal' | 'neon' | 'wood',
    effects: [] as any[]
};

// --- AUDIO SYSTEM ---

export const AudioSys = {
    ctx: null as AudioContext | null,
    musicInterval: null as any,
    init() {
        if (!this.ctx) {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideTo: number | null = null) {
        if (!State.settings.sfx || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.1);
    },
    startMusic() {
        if (!State.settings.music || !this.ctx || this.musicInterval) return;
        let step = 0;
        const melody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C Major arpeggio
        const playBeat = () => {
            if (!State.settings.music || !this.ctx) return;
            const t = this.ctx.currentTime;

            // Bass pulse
            const bass = this.ctx.createOscillator(), bg = this.ctx.createGain();
            bass.type = 'sine';
            bass.frequency.setValueAtTime(step % 4 === 0 ? 65.41 : 49.00, t); // C1 or G0
            bg.gain.setValueAtTime(0.04, t);
            bg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            bass.connect(bg); bg.connect(this.ctx.destination);
            bass.start(); bass.stop(t + 0.5);

            // Melody
            if (step % 2 === 0) {
                const mel = this.ctx.createOscillator(), mg = this.ctx.createGain();
                mel.type = 'triangle';
                mel.frequency.setValueAtTime(melody[Math.floor(step / 2) % melody.length], t);
                mg.gain.setValueAtTime(0.02, t);
                mg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
                mel.connect(mg); mg.connect(this.ctx.destination);
                mel.start(); mel.stop(t + 0.8);
            }
            step++;
        };
        playBeat();
        this.musicInterval = setInterval(playBeat, 500);
    },
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    },
    // Human Voice Feedback System
    speak: (text: string, pitch: number = 1.0, rate: number = 1.0) => {
        try {
            if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = pitch;
            utterance.rate = rate;
            utterance.volume = 0.6;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.log('Voice feedback unavailable');
        }
    },
    sfx: {
        pickup: () => AudioSys.playTone(400, 'sine', 0.15, 0.1),
        rotate: () => AudioSys.playTone(800, 'triangle', 0.1, 0.05, 1200),
        place: (col: number = 0) => {
            const n = [261, 293, 329, 392, 440, 523, 587, 659];
            AudioSys.playTone(n[col % 8], 'sine', 0.15, 0.2);
            // Add subtle click sound
            AudioSys.playTone(1200, 'square', 0.05, 0.05);
        },
        invalid: () => AudioSys.playTone(150, 'sawtooth', 0.2, 0.1, 100),
        clear: (c: number) => {
            // Enhanced cascading clear sound
            for (let i = 0; i < Math.min(c, 6); i++) {
                setTimeout(() => {
                    AudioSys.playTone(700 * (1 + i * 0.1), 'sine', 0.15, 0.4);
                    AudioSys.playTone(350 * (1 + i * 0.1), 'triangle', 0.1, 0.3);
                }, i * 40);
            }

            // Human voice feedback based on lines cleared
            if (c >= 4) {
                setTimeout(() => AudioSys.speak('Excellent!', 1.2, 1.1), 200);
            } else if (c === 3) {
                setTimeout(() => AudioSys.speak('Amazing!', 1.1, 1.0), 200);
            } else if (c === 2) {
                setTimeout(() => AudioSys.speak('Cool!', 1.0, 1.0), 200);
            } else if (c === 1) {
                setTimeout(() => AudioSys.speak('Nice!', 0.9, 1.0), 200);
            }
        },
        levelup: () => {
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            notes.forEach((n, i) => setTimeout(() => {
                AudioSys.playTone(n, 'triangle', 0.4, 0.3);
                AudioSys.playTone(n / 2, 'sine', 0.5, 0.2);
            }, i * 70));
            setTimeout(() => AudioSys.speak('Level Up!', 1.3, 1.0), 300);
        },
        gameover: () => {
            if (!AudioSys.ctx) return;
            const t = AudioSys.ctx.currentTime;
            const o = AudioSys.ctx.createOscillator(), g = AudioSys.ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(120, t);
            o.frequency.exponentialRampToValueAtTime(10, t + 1.2);
            g.gain.setValueAtTime(0.6, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
            o.connect(g); g.connect(AudioSys.ctx.destination);
            o.start(); o.stop(t + 1.3);
        },
        powerup: () => AudioSys.playTone(880, 'sine', 0.4, 0.3, 220),
        smash: () => {
            // Enhanced hammer smash with impact
            AudioSys.playTone(120, 'square', 0.4, 0.3);
            AudioSys.playTone(80, 'sawtooth', 0.3, 0.2);
            setTimeout(() => AudioSys.playTone(200, 'triangle', 0.2, 0.1), 50);
        },
        tada: () => {
            AudioSys.playTone(523, 'triangle', 0.3);
            setTimeout(() => AudioSys.playTone(659, 'triangle', 0.5), 120);
            setTimeout(() => AudioSys.speak('Awesome!', 1.2, 1.0), 200);
        },
        coin: () => {
            AudioSys.playTone(1500, 'sine', 0.12, 0.3);
            setTimeout(() => AudioSys.playTone(2000, 'sine', 0.2, 0.2), 40);
        },
        reroll: () => {
            for (let i = 0; i < 4; i++)
                setTimeout(() => AudioSys.playTone(700 + i * 250, 'triangle', 0.12, 0.15), i * 80);
        },
        tier: (t: number) => {
            const freq = [523, 659, 783, 1046, 1318, 1567];
            const base = freq[Math.min(t, 5)];
            for (let i = 0; i < 4; i++) {
                setTimeout(() => AudioSys.playTone(base * (1 + i * 0.04), 'sine', 0.2, 0.4), i * 50);
            }
        },
        combo: () => {
            AudioSys.playTone(300, 'sawtooth', 0.3, 0.2, 800);
            setTimeout(() => AudioSys.speak('Combo!', 1.4, 1.2), 100);
        },
        // New TNT explosion sound
        explosion: () => {
            AudioSys.playTone(60, 'sawtooth', 0.6, 0.4);
            setTimeout(() => AudioSys.playTone(100, 'square', 0.5, 0.3), 50);
            setTimeout(() => AudioSys.playTone(150, 'triangle', 0.4, 0.2), 100);
            setTimeout(() => AudioSys.speak('Boom!', 0.8, 0.9), 150);
        },
        iceCrack: () => {
            AudioSys.playTone(1200, 'triangle', 0.1, 0.2, 400);
            setTimeout(() => AudioSys.playTone(800, 'sawtooth', 0.05, 0.1), 30);
        }
    }
};

// --- SAVE MANAGER (Phase 2) ---

export const SaveManager = {
    loadGlobalStats() {
        try {
            const saved = localStorage.getItem(STATS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(GlobalStats, parsed);
                // Ensure inventory exists
                if (!GlobalStats.inventory) GlobalStats.inventory = { hammer: 3, bomb: 1, reroll: 1, undo: 1, merger: 1, takeover: 1, taxHaven: 1 } as Inventory;
                if (!GlobalStats.upgrades) GlobalStats.upgrades = { magnet: 1, insurance: 1, eye: 1, combo: 0, frenzy: 0 };
                if (GlobalStats.upgrades.combo === undefined) GlobalStats.upgrades.combo = 0;
                if (GlobalStats.upgrades.frenzy === undefined) GlobalStats.upgrades.frenzy = 0;
                if (GlobalStats.totalScore === undefined) GlobalStats.totalScore = 0;

                // FORCE UNLOCK FOR DESIGN REVIEW
                GlobalStats.adventureMaxLevel = 10;
                GlobalStats.unlockedCities = ['suburbs', 'neon', 'obsidian', 'tokyo', 'cyberpunk']; // Add all known cities if possible
                GlobalStats.unlockedAcquisitions = ACQUISITIONS.map(a => a.id);
                GlobalStats.unlockedAchievements = ACHIEVEMENTS.map(a => a.id);
            }
        } catch (e) { console.error("Failed to load global stats", e); }
    },
    saveGlobalStats() {
        localStorage.setItem(STATS_KEY, JSON.stringify(GlobalStats));
        updateCoinDisplays();
    },
    loadLeaderboard() {
        try {
            const saved = localStorage.getItem(LEADERBOARD_KEY);
            if (saved) State.leaderboard = JSON.parse(saved);
        } catch (e) { State.leaderboard = []; }
    },
    saveLeaderboard() {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(State.leaderboard));
    },
    saveGame() {
        if (State.isGameOver || State.tutorial.active || State.isEnding || State.gameMode === 'zen') {
            localStorage.removeItem(STATE_KEY);
            return;
        }
        const d = {
            grid: State.grid,
            score: State.score,
            level: State.level,
            lines: State.linesClearedTotal,
            streak: State.streak,
            queue: State.queue.map(p => p ? { sid: p.shapeId, c: p.color, r: p.rotated } : null),
            thm: State.currentTheme,
            gm: State.gameMode,
            bc: State.bombCounter,
            adv: State.adventure,
            ap: State.activePolicy,
            bl: State.bailoutsLeft
        };
        localStorage.setItem(STATE_KEY, JSON.stringify(d));
    },
    loadGame(): boolean {
        try {
            const saved = localStorage.getItem(STATE_KEY);
            if (!saved) return false;
            const d = JSON.parse(saved);

            // Validate essential data
            if (!d.grid || !d.queue) throw new Error("Corrupted save data");

            State.grid = d.grid;
            State.score = d.score || 0;
            State.level = d.level || 1;
            State.linesClearedTotal = d.lines || 0;
            State.streak = d.streak || 0;
            State.currentTheme = d.thm || 'classic';
            State.gameMode = d.gm || 'classic';
            State.gameMode = d.gm || 'classic';
            State.bombCounter = d.bc || 8;
            State.adventure = d.adv || { levelId: 0, progress: 0, sessionBlocks: 0, sessionLines: 0, sessionGems: 0, movesLeft: 20, maxMoves: 20 };
            State.activePolicy = d.ap || null;
            State.bailoutsLeft = d.bl || 0;

            // Rebuild queue from saved data
            State.queue = [];
            const queueData = d.queue || [];
            for (let i = 0; i < queueData.length; i++) {
                const q = queueData[i];
                if (q) {
                    try {
                        const p = new Piece(State.level, q.sid);
                        p.color = q.c || p.color;
                        if (q.r) p.rotate();
                        p.scale = p.targetScaleQueue;
                        // Set base position for queue
                        p.baseX = (CANVAS_WIDTH / 3 * i) + (CANVAS_WIDTH / 6);
                        p.baseY = QUEUE_Y + QUEUE_HEIGHT / 2;
                        p.x = p.baseX;
                        p.y = p.baseY;
                        State.queue.push(p);
                    } catch (e) {
                        State.queue.push(null);
                    }
                } else {
                    State.queue.push(null);
                }
            }

            // Ensure queue is properly filled
            const count = (State.activePolicy === 'leanStartup' ? 1 : 3);
            while (State.queue.length < count) {
                const p = new Piece(State.level);
                p.baseX = (CANVAS_WIDTH / 3 * State.queue.length) + (CANVAS_WIDTH / 6);
                p.baseY = QUEUE_Y + QUEUE_HEIGHT / 2;
                p.x = p.baseX;
                p.y = p.baseY;
                State.queue.push(p);
            }

            return true;
        } catch (e) {
            console.error("Load failed:", e);
            return false;
        }
    }
};

// --- CORE UTILS ---

export function vibrate(ms: number | number[]) {
    if (State.settings.vibration && navigator.vibrate) navigator.vibrate(ms);
}

let lastToastTime = 0;
const MIN_TOAST_INTERVAL = 500; // Prevent toast spam

export function showToast(m: string, b: boolean = false) {
    const now = Date.now();
    // Prevent toast spam
    if (now - lastToastTime < MIN_TOAST_INTERVAL) return;
    lastToastTime = now;

    const toast = document.getElementById('toast-instruction');
    if (toast) {
        toast.innerText = m;
        toast.className = b ? 'toast toast-bonus visible' : 'toast visible';
        // Auto-hide after 4 seconds
        setTimeout(() => {
            toast.className = 'toast';
            toast.innerText = '';
        }, 4000);
    }
}

// --- MASCOT SYSTEM (Nano Banana) ---

export const MascotSys = {
    root: null as HTMLElement | null,
    bubble: null as HTMLElement | null,
    char: null as HTMLElement | null,
    bubbleTimeout: null as any,
    lastTalkTime: 0,
    COOLDOWN: 10000, // 10 seconds between standard chat

    init() {
        this.root = document.getElementById('mascot-root');
        this.bubble = document.getElementById('mascot-bubble');
        this.char = document.getElementById('mascot-character');
    },

    show() {
        if (!this.root) this.init();
        this.root?.classList.remove('hidden');
    },

    hide() {
        if (!this.root) this.init();
        this.root?.classList.add('hidden');
    },

    say(text: string, mood: 'happy' | 'excited' | 'sad' | 'standard' = 'standard', duration: number = 3000, force: boolean = false) {
        if (!this.bubble || !this.char) this.init();
        if (!this.bubble || !this.char) return;

        const now = Date.now();
        if (!force && now - this.lastTalkTime < this.COOLDOWN) return;

        this.lastTalkTime = now;
        this.bubble.innerText = text;
        this.bubble.classList.add('visible');

        // Reset mood animations
        this.char.classList.remove('mascot-excited', 'mascot-sad');
        if (mood === 'excited') void this.char.offsetWidth, this.char.classList.add('mascot-excited');
        if (mood === 'sad') void this.char.offsetWidth, this.char.classList.add('mascot-sad');

        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
        this.bubbleTimeout = setTimeout(() => {
            if (this.bubble) this.bubble.classList.remove('visible');
        }, duration);
    },

    onCombo(count: number) {
        if (count >= 4) this.say("UNBELIEVABLE! 🍌🔥", 'excited', 4000, true);
        else if (count === 3) this.say("INCREDIBLE!", 'excited', 3000, true);
    },

    onFail() {
        const lines = ["Don't slip now!", "Keep your balance!", "You got this!", "Try a power-up?"];
        this.say(lines[Math.floor(Math.random() * lines.length)], 'sad', 3000, true);
    },

    onWin() {
        this.say("WE DID IT! 🏆", 'excited', 5000, true);
    },

    onGameStart() {
        this.show();
        this.say("Let's go!", 'happy', 3000, true);
    }
};

export function updateCoinDisplays() {
    const hudCoins = document.getElementById('hud-coins');
    const menuCoins = document.getElementById('menu-coin-display');
    const shopCoins = document.getElementById('shop-coin-display');
    if (hudCoins) hudCoins.innerText = GlobalStats.coins.toString();
    if (menuCoins) menuCoins.innerText = GlobalStats.coins.toString();
    if (shopCoins) shopCoins.innerText = GlobalStats.coins.toString();
}

export function updateHUD() {
    const hudScore = document.getElementById('hud-score');
    const hudHighScore = document.getElementById('hud-highscore');
    const hudLevel = document.getElementById('hud-level');
    if (hudScore) hudScore.innerText = State.score.toString();
    if (hudHighScore) hudHighScore.innerText = (State.highScore || 0).toString();
    if (hudLevel) {
        if (State.gameMode === 'adventure' && ADVENTURE_LEVELS[State.adventure.levelId]) {
            const l = ADVENTURE_LEVELS[State.adventure.levelId];
            hudLevel.innerText = `${State.adventure.progress || 0}/${l.target}`;
            const lbl = document.getElementById('hud-level-label');
            if (lbl) lbl.innerText = 'Goal';

            // Show Moves Left
            if (hudHighScore) {
                hudHighScore.innerText = `${State.adventure.movesLeft}`;
                const hsl = hudHighScore.parentElement?.querySelector('.hud-label') as HTMLElement;
                if (hsl) hsl.innerText = 'Moves';
            }
        } else {
            hudLevel.innerText = (State.level || 1).toString();
            const lbl = document.getElementById('hud-level-label');
            if (lbl) lbl.innerText = 'Level';

            if (hudHighScore) {
                hudHighScore.innerText = (State.highScore || 0).toString();
                const hsl = hudHighScore.parentElement?.querySelector('.hud-label') as HTMLElement;
                if (hsl) hsl.innerText = 'Best';
            }
        }
    }
    const modeLabel = document.querySelector('header .hud-group:first-child .hud-label') as HTMLElement;
    if (modeLabel) {
        const modeNames: any = { classic: 'Score', zen: 'Zen', bomb: 'Bomb', adventure: 'Adv' };
        modeLabel.innerText = modeNames[State.gameMode] || 'Score';
    }
    updateCoinDisplays();
    const pBadge = document.getElementById('policy-badge');
    if (pBadge) {
        if (State.activePolicy) {
            pBadge.style.display = 'flex';
            const val = document.getElementById('hud-policy');
            const p = POLICIES.find(it => it.id === State.activePolicy);
            if (val && p) val.innerText = p.icon;

            // Render Bailout Tokens
            const btokens = document.getElementById('bailout-tokens');
            if (btokens && State.activePolicy === 'taxShield') {
                btokens.innerHTML = '';
                for (let i = 0; i < 3; i++) {
                    const t = document.createElement('div');
                    t.className = 'shield-token' + (i >= State.bailoutsLeft ? ' spent' : '');
                    btokens.appendChild(t);
                }
            }
        } else {
            pBadge.style.display = 'none';
        }
    }
}

export function updateTools() {
    // Current inventory is linked to GlobalStats (Phase 2)
    const inv = GlobalStats.inventory;
    const countHammer = document.getElementById('count-hammer');
    const countBomb = document.getElementById('count-bomb');
    const countReroll = document.getElementById('count-reroll');
    const countUndo = document.getElementById('count-undo');

    const btnHammer = document.getElementById('btn-hammer');
    const btnBomb = document.getElementById('btn-bomb');
    const btnReroll = document.getElementById('btn-reroll');
    const btnUndo = document.getElementById('btn-undo');

    if (countHammer) countHammer.innerText = inv.hammer.toString();
    if (countBomb) countBomb.innerText = inv.bomb.toString();
    if (countReroll) countReroll.innerText = inv.reroll.toString();
    if (countUndo) countUndo.innerText = inv.undo.toString();

    if (btnHammer) btnHammer.className = 'powerup-btn ' + (inv.hammer ? '' : 'disabled') + (State.activeTool === 'hammer' ? ' active' : '');
    if (btnBomb) btnBomb.className = 'powerup-btn ' + (inv.bomb ? '' : 'disabled') + (State.activeTool === 'bomb' ? ' active' : '');
    if (btnReroll) btnReroll.className = 'powerup-btn ' + (inv.reroll ? '' : 'disabled');
    if (btnUndo) btnUndo.className = 'powerup-btn ' + (inv.undo && State.previousMove ? '' : 'disabled');
}

export function positionQueue() {
    if (!State.queue) State.queue = [];

    State.queue.forEach((p, i) => {
        if (p) {
            p.baseX = (CANVAS_WIDTH / 3 * i) + (CANVAS_WIDTH / 6);
            p.baseY = QUEUE_Y + QUEUE_HEIGHT / 2;
            // Only update position if not currently being dragged
            if (!p.isDragging) {
                p.x = p.baseX;
                p.y = p.baseY;
            }
        }
    });
}

export function fillQueue(resetUndo: boolean = true) {
    if (resetUndo) State.previousMove = null;
    const count = (State.activePolicy === 'leanStartup' ? 1 : 3);

    // Initialize if undefined
    if (!State.queue) State.queue = [];

    // Filter out nulls and remove fully placed pieces
    State.queue = State.queue.filter(p => p !== null);

    // Fill up to the required count
    while (State.queue.length < count) {
        const p = new Piece(State.level);
        // Set initial position immediately
        p.baseX = (CANVAS_WIDTH / 3 * State.queue.length) + (CANVAS_WIDTH / 6);
        p.baseY = QUEUE_Y + QUEUE_HEIGHT / 2;
        p.x = p.baseX;
        p.y = p.baseY;
        State.queue.push(p);
    }

    // Ensure all pieces have correct positions
    positionQueue();

    // Delay check to allow render of new pieces
    setTimeout(() => checkGO(), 300);
    SaveManager.saveGame();
}

export function canPlace(p: Piece, gx: number, gy: number): boolean {
    for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
            if (p.map[r][c]) {
                if (gx + c < 0 || gx + c >= COLS || gy + r < 0 || gy + r >= ROWS || State.grid[gy + r][gx + c]) return false;
            }
        }
    }
    return true;
}

export function spawnPart(x: number, y: number, c: string, cnt: number, type: string = 'debris', symbol: string = '') {
    const speedMultipliers = [1.0, 1.5, 2.5];
    const speedFactor = (1.0 + ((State.level - 1) * 0.05)) * speedMultipliers[State.settings.gameSpeed];
    const MAX_PARTICLES = 150;
    while (State.particles.length >= MAX_PARTICLES) {
        // Stability fix: Remove oldest non-critical (coin/gem) if possible, otherwise just oldest
        const idx = State.particles.findIndex(p => p.type !== 'coin-fly' && p.type !== 'gem');
        if (idx !== -1) State.particles.splice(idx, 1);
        else State.particles.shift();
    }

    for (let i = 0; i < cnt; i++) {
        let speed = type === 'explosion' ? 8 : (type === 'symbol' ? 10 : 5);
        State.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed - (type === 'symbol' ? 5 : 0),
            life: 1,
            c: c,
            type: type,
            s: type === 'symbol' ? Math.random() * 10 + 10 : Math.random() * 8 + 4,
            symbol: symbol
        });
    }
}

export function spawnText(t: string, x: number, y: number, c: string, s: number, type: string = 'normal') {
    State.floatingTexts.push({ t: t, x: x, y: y, c: c, s: s, l: 1, type: type, tick: 0 });
    if (State.floatingTexts.length > 30) State.floatingTexts.shift();
}

export function spawnCoinAnimation(x: number, y: number, amount: number) {
    // Phase 4: Coin Micro-animation
    // Animate coins flying to the HUD
    const hudCoins = document.getElementById('hud-coins');
    if (!hudCoins) return;
    const targetRect = hudCoins.getBoundingClientRect();
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const canvasRect = canvas.getBoundingClientRect();

    // Convert target to canvas space
    const tx = (targetRect.left + targetRect.width / 2 - canvasRect.left) * (CANVAS_WIDTH / canvasRect.width);
    const ty = (targetRect.top + targetRect.height / 2 - canvasRect.top) * (CANVAS_HEIGHT / canvasRect.height);

    for (let i = 0; i < Math.min(amount, 10); i++) {
        setTimeout(() => {
            State.particles.push({
                x, y,
                tx, ty,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                type: 'coin-fly',
                s: 15,
                c: '#FFD700',
                delay: i * 50
            });
            AudioSys.sfx.coin();
        }, i * 50);
    }
}

// --- GAME ACTIONS ---

export function addScore(pts: number) {
    const multipliers = [1, 1.2, 1.5];
    let m = multipliers[State.settings.gameSpeed];
    if (State.activePolicy === 'aggressive') m *= 2;
    if (State.activeEvent?.id === 'bullMarket') m *= 2;
    const finalPts = Math.floor(pts * m);
    State.score += finalPts;
    GlobalStats.totalScore = (GlobalStats.totalScore || 0) + finalPts;

    // Check Acquisitions
    ACQUISITIONS.forEach(acq => {
        if (!GlobalStats.unlockedAcquisitions.includes(acq.id) && GlobalStats.totalScore >= acq.requirement) {
            GlobalStats.unlockedAcquisitions.push(acq.id);
            showToast(`ACQUIRED: ${acq.name}!`, true);
            AudioSys.sfx.tada();
            SaveManager.saveGlobalStats();
        }
    });

    const modeKey = (State.gameMode === 'classic' ? STORAGE_KEY : STORAGE_KEY + '-' + State.gameMode);
    if (State.score > State.highScore) {
        State.highScore = State.score;
        localStorage.setItem(modeKey, State.highScore.toString());
    }
    if (State.score > GlobalStats.allTimeHighScore) {
        GlobalStats.allTimeHighScore = State.score;
    }
    updateHUD();
}

function addCoins(amt: number) {
    GlobalStats.coins += amt;
    GlobalStats.totalGoldEarned = (GlobalStats.totalGoldEarned || 0) + amt;
}

export function performUndo() {
    if (!State.previousMove) { showToast("Nothing to undo!"); return; }
    if (GlobalStats.inventory.undo <= 0) { showToast("No Undos left!"); return; }

    const pm = State.previousMove;
    State.grid = pm.grid;
    State.score = pm.score;
    State.linesClearedTotal = pm.lines;
    State.streak = pm.streak;

    State.queue = pm.queue.map((q: any) => {
        if (!q) return null;
        const p = new Piece(State.level, q.sid);
        p.color = q.c; if (q.r) p.rotate();
        p.scale = p.targetScaleQueue;
        return p;
    });
    positionQueue();

    const insuranceLvl = GlobalStats.upgrades.insurance;
    if (Math.random() < (insuranceLvl * 0.1)) {
        showToast("Insurance Saved Undo!");
    } else {
        GlobalStats.inventory.undo--;
    }

    State.previousMove = null;
    updateHUD();
    updateTools();
    SaveManager.saveGame();
    showToast("Turn Undone");
    AudioSys.sfx.pickup();
}

export function performReroll() {
    if (GlobalStats.inventory.reroll <= 0) { showToast("No Rerolls left!"); return; }
    saveUndoState();
    GlobalStats.inventory.reroll--;
    fillQueue(false);
    updateTools();
    showToast("Pieces Rerolled");
    AudioSys.sfx.reroll();
}

export function saveUndoState() {
    State.previousMove = JSON.parse(JSON.stringify({
        grid: State.grid,
        score: State.score,
        queue: State.queue.map(p => p ? { sid: p.shapeId, c: p.color, r: p.rotated } : null),
        lines: State.linesClearedTotal,
        streak: State.streak
    }));
}

export function placePiece(p: Piece, gx: number, gy: number, queueIndex: number = -1) {
    if (queueIndex !== -1) State.queue[queueIndex] = null;
    saveUndoState();

    if (State.moveCount === 0) showToast("Clear all blocks to get more!", true);

    for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
            if (p.map[r][c]) {
                const cell: any = { color: p.color, scale: 1, targetScale: 1, flash: 1, yOffset: -60, type: p.type };
                if (p.type === 'metal') cell.health = 2;
                if (p.type === 'multiplier') cell.mult = p.multiplierType;
                State.grid[gy + r][gx + c] = cell;
                spawnPart((gx + c) * CELL_SIZE + GRID_OFFSET_X + CELL_SIZE / 2, (gy + r) * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2, p.color, 8, 'spark');
            }
        }
    }
    let pts = p.map.flat().filter(x => x).length * 10 * State.level;
    if (State.frenzy.moves > 0) {
        pts *= State.frenzy.mult;
        State.frenzy.moves--;
        if (State.frenzy.moves === 0) showToast("Frenzy Ended");
    }
    addScore(pts);
    GlobalStats.blocksPlaced++;
    State.moveCount++;
    vibrate(10);

    if (State.boss.active) {
        State.boss.health -= 10;
        State.boss.movesLeft--;
        updateBossUI();
        if (State.boss.health <= 0) winBoss();
        else if (State.boss.movesLeft <= 0) triggerGO("Boss Escaped!");
    }



    handleElementalMove();
    handleEventStep();

    if (State.gameMode === 'adventure') {
        State.adventure.movesLeft--;
        updateHUD();
        State.adventure.sessionBlocks++;
        handleAdventureObstacles();
    }

    if (State.moveCount % 15 === 0 && !State.investor.active) {
        triggerInvestor();
    }

    if (State.investor.active) {
        State.investor.movesLeft--;
        if (State.investor.movesLeft <= 0) {
            showToast("Investor Left...");
            State.investor.active = false;
        }
    }

    AudioSys.sfx.place(gx); vibrate(20);
    const isClearing = checkLines();
    if (!isClearing) {
        if (State.taxHavenMoves <= 0) State.streak = 0;
        if (State.gameMode === 'bomb') handleBomb();
        if (State.gameMode === 'adventure') checkAdv();
    }
    SaveManager.saveGlobalStats();
    checkAchievements();
    SaveManager.saveGame();
    updateTools();
    checkGO();
}

export function checkLines(): boolean {
    let fr: number[] = [], fc: number[] = [];
    for (let y = 0; y < ROWS; y++) if (State.grid[y].every(c => c)) fr.push(y);
    for (let x = 0; x < COLS; x++) { let f = true; for (let y = 0; y < ROWS; y++) if (!State.grid[y][x]) f = false; if (f) fc.push(x); }
    if (fr.length + fc.length > 0) {
        State.streak++;
        if (State.streak > GlobalStats.maxStreak) GlobalStats.maxStreak = State.streak;
        State.isClearing = true; State.clearingRows = fr; State.clearingCols = fc; State.clearStartTime = Date.now();
        AudioSys.sfx.clear(fr.length + fc.length); vibrate(50);
        setTimeout(() => {
            execClear(fr, fc); State.isClearing = false; State.clearingRows = []; State.clearingCols = [];
            if (State.tutorial.active) { State.tutorial.active = false; triggerGO("Tutorial Done!"); } else checkLvl(fr.length + fc.length);
            SaveManager.saveGame();
        }, 250);
        return true;
    }
    return false;
}

export function execClear(fr: number[], fc: number[]) {
    let s = new Set<string>();
    fr.forEach(y => { for (let x = 0; x < COLS; x++) s.add(x + ',' + y); });
    fc.forEach(x => { for (let y = 0; y < ROWS; y++) s.add(x + ',' + y); });

    let lastX = 400, lastY = 600;
    s.forEach(k => {
        const [x, y] = k.split(',').map(Number);
        const cell = State.grid[y][x];
        if (cell) {
            lastX = GRID_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2;
            lastY = GRID_OFFSET_Y + y * CELL_SIZE + CELL_SIZE / 2;

            if (cell.type === 'metal' && cell.health > 1) {
                cell.health--;
                cell.flash = 1;
                spawnPart(lastX, lastY, '#A0A0A0', 5, 'spark');
                return;
            }

            if (cell.type === 'ice' && cell.iceLevel > 1) {
                cell.iceLevel--;
                cell.flash = 1;
                State.screenShake = 10;
                spawnPart(lastX, lastY, '#81D4FA', 6, 'spark');
                AudioSys.sfx.iceCrack();
                spawnText("CRACK!", lastX, lastY - 20, '#E1F5FE', 24);
                return;
            }

            if (cell.type === 'chain' && cell.isChained) {
                // Linked chains: Break ALL chains on the board
                for (let yy = 0; yy < ROWS; yy++) {
                    for (let xx = 0; xx < COLS; xx++) {
                        const other = State.grid[yy][xx];
                        if (other && other.type === 'chain' && other.isChained) {
                            other.isChained = false;
                            other.flash = 1;
                            spawnPart(GRID_OFFSET_X + xx * CELL_SIZE + CELL_SIZE / 2, GRID_OFFSET_Y + yy * CELL_SIZE + CELL_SIZE / 2, '#BDBDBD', 5, 'spark');
                        }
                    }
                }
                State.screenShake = 15;
                AudioSys.sfx.smash(); // Strong audio feedback for global chain break
                spawnText("UNLINKED!", lastX, lastY - 20, '#FFFFFF', 30);
                return;
            }

            if (cell.type === 'gold') {
                addCoins(10);
                spawnCoinAnimation(lastX, lastY, 2);
            }

            if (cell.type === 'gem') {
                State.adventure.sessionGems++;
                spawnPart(lastX, lastY, '#00ffcc', 6, 'spark');
            }

            if (cell.type === 'multiplier' && cell.mult) {
                State.frenzy.moves = 3 + (GlobalStats.upgrades.frenzy || 0);
                State.frenzy.mult = cell.mult === 'square' ? 2 : 1.5;
                showToast(`Building Frenzy! x${State.frenzy.mult}`, true);
            }

            spawnPart(lastX, lastY, cell.color, 4, 'explosion');

            // Shatter into symbols
            spawnPart(lastX, lastY, cell.color, 2, 'symbol', '$');
            spawnPart(lastX, lastY, '#FFD700', 1, 'symbol', '💰');

            State.grid[y][x] = null;
        }
    });

    const lines = fr.length + fc.length;
    // Enhanced scoring: Better rewards for combos
    const comboMultiplier = (lines > 1 ? Math.pow(lines, 1.3) : 1) * (1 + (GlobalStats.upgrades.combo * 0.1));
    const streakMultiplier = State.streak > 1 ? (1 + (State.streak * 0.3)) : 1;
    const pts = Math.floor(lines * 100 * comboMultiplier * streakMultiplier * State.level);
    addScore(pts);
    GlobalStats.linesCleared += lines;
    if (lines > GlobalStats.maxCombo) GlobalStats.maxCombo = lines;

    // Check Investor progress
    if (State.investor.active && State.investor.type === 'lines') {
        State.investor.progress += lines;
        if (State.investor.progress >= State.investor.target) {
            completeInvestor();
        }
    }

    if (State.gameMode === 'adventure') {
        State.adventure.sessionLines += lines;
        // Reward: +1 Move per line cleared to extend play
        State.adventure.movesLeft += lines;
        showToast(`+${lines} Moves!`);
        spawnText(`+${lines} MOVES`, lastX, lastY - 50, '#00ff00', 30);
        checkAdv();
    }
    spawnText(`+${pts}`, lastX, lastY, '#00d2ff', 40);

    // Enhanced coin rewards for combos
    let earnedCoins = lines * 5;
    if (lines > 1) earnedCoins += lines * 10; // Increased from 5
    if (lines >= 3) earnedCoins += lines * 15; // Bonus for 3+ lines
    if (State.streak > 1) earnedCoins += State.streak * 3; // Increased from 2
    if (State.streak >= 5) earnedCoins += 50; // Mega streak bonus
    addCoins(earnedCoins);

    spawnCoinAnimation(lastX, lastY, earnedCoins);
    SaveManager.saveGlobalStats();

    if (lines >= 1) {
        // Block Blast Feedback Tiers (More immediate and frequent)
        const tiers = ['NICE!', 'COOL!', 'GREAT!', 'EXCELLENT!', 'AMAZING!', 'UNBELIEVABLE!'];
        const tierIdx = Math.min(lines - 1 + (State.streak > 1 ? 1 : 0), tiers.length - 1);

        spawnText(tiers[tierIdx], CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 150, '#FFD700', 80, 'combo');
        AudioSys.sfx.tier(tierIdx);

        if (lines > 1) {
            spawnText(`${lines}X COMBO!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#FFF', 60, 'combo');
            State.comboHeat = Math.min(State.comboHeat + 0.25, 1);
            MascotSys.onCombo(lines);
        }
    }

    if (State.streak > 1) {
        spawnText(`${State.streak} STREAK!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100, '#00ffcc', 50, 'combo');
        AudioSys.playTone(800 + State.streak * 50, 'sine', 0.1, 0.1);
    }
    updateLeague();
}

export function updateLeague() {
    const thresholds = [1000, 5000, 15000, 50000, 150000];
    const prev = GlobalStats.leagueRank;
    for (let i = 0; i < thresholds.length; i++) {
        if (State.score >= thresholds[i]) GlobalStats.leagueRank = i;
    }
    if (GlobalStats.leagueRank > prev) {
        showToast(`PROMOTED TO ${LEAGUES[GlobalStats.leagueRank]}!`, true);
        vibrate(200);
    }
    const badge = document.getElementById('league-badge');
    const lval = document.getElementById('hud-league');
    if (badge && lval) {
        badge.className = `hud-group league-${LEAGUES[GlobalStats.leagueRank].toLowerCase()}`;
        lval.innerText = LEAGUES[GlobalStats.leagueRank];
    }
}

export function updateBossUI() {
    const bar = document.getElementById('boss-health');
    if (bar) bar.style.width = Math.max(0, (State.boss.health / State.boss.maxHealth * 100)) + '%';
}

function winBoss() {
    State.boss.active = false;
    State.adventure.bossDefeatedThisSession = true;
    document.getElementById('boss-ui')?.classList.add('hidden');
    GlobalStats.bossDefeated++;
    addCoins(1000);
    showToast("BOSS DEFEATED! +1000 🟡", true);
    vibrate([100, 50, 100, 50, 200]);

    if (State.gameMode === 'adventure') {
        checkAdv();
    }
}

export function spawnBoss(name: string, hp: number) {
    State.boss = { active: true, name, health: hp, maxHealth: hp, movesLeft: 15 + Math.floor(hp / 10) };
    document.getElementById('boss-ui')?.classList.remove('hidden');
    const bn = document.getElementById('boss-name');
    if (bn) bn.innerText = name;
    updateBossUI();
    showToast(`BOSS WARNING: ${name}`, true);
    vibrate(500);
}

export function triggerInvestor() {
    const types: ('lines' | 'score' | 'blocks')[] = ['lines', 'score', 'blocks'];
    const type = types[Math.floor(Math.random() * types.length)];
    const targets = { lines: 3, score: 500, blocks: 15 };
    State.investor = {
        active: true,
        type: type,
        target: targets[type],
        progress: 0,
        movesLeft: 12,
        reward: 500 + (State.level * 100)
    };
    showToast("Investor Goal: " + type.toUpperCase(), true);
    AudioSys.sfx.tada();
}

export function completeInvestor() {
    addCoins(State.investor.reward);
    spawnCoinAnimation(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 20);
    showToast(`Investor Happy! +${State.investor.reward} 🟡`, true);
    State.investor.active = false;
    SaveManager.saveGlobalStats();
}

export function handleAdventureObstacles() {
    if (State.gameMode !== 'adventure') return;

    // Every 5 moves, spawn Overgrowth
    if (State.moveCount % 5 === 0) {
        let empty = [];
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!State.grid[y][x]) empty.push({ x, y });
        if (empty.length) {
            const p = empty[Math.floor(Math.random() * empty.length)];
            State.grid[p.y][p.x] = { color: '#2ecc71', scale: 0, targetScale: 1, type: 'vine' };
            showToast("Overgrowth spreading!", true);
        }
    }

    // Every level change or every 10 moves, spawn Cracked Tiles
    if (State.moveCount % 10 === 0) {
        let empty = [];
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!State.grid[y][x]) empty.push({ x, y });
        if (empty.length) {
            const p = empty[Math.floor(Math.random() * empty.length)];
            State.grid[p.y][p.x] = { color: 'transparent', scale: 1, targetScale: 1, type: 'cracked' };
            showToast("Ground is cracking...", true);
        }
    }
}

export function checkAdv() {
    if (State.gameMode !== 'adventure') return;
    const l = ADVENTURE_LEVELS[State.adventure.levelId];
    let c = 0;

    if (l.goalType === 'lines') c = State.adventure.sessionLines;
    else if (l.goalType === 'score') c = State.score;
    else if (l.goalType === 'gems') c = State.adventure.sessionGems;
    else if (l.goalType === 'blocks') c = State.adventure.sessionBlocks;
    else if (l.goalType === 'boss') c = State.adventure.bossDefeatedThisSession ? 1 : 0;

    State.adventure.progress = c;
    updateHUD();
    if (c >= l.target) {
        State.isEnding = true; AudioSys.sfx.levelup();
        if (GlobalStats.adventureMaxLevel === State.adventure.levelId) GlobalStats.adventureMaxLevel++;
        SaveManager.saveGlobalStats();
        triggerGO("Level Cleared!", true);
    } else if (State.adventure.movesLeft <= 0) {
        // Goal not met and moves ran out
        MascotSys.onFail();
        triggerGO(`LEVEL FAILED: OUT OF MOVES! (${c}/${l.target})`);
    }
}

export function handleBomb() {
    let expl = false;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (State.grid[y][x] && State.grid[y][x].bomb !== undefined) {
                if (!State.clearingRows.includes(y) && !State.clearingCols.includes(x)) {
                    State.grid[y][x].bomb--; State.grid[y][x].flash = 0.5; if (State.grid[y][x].bomb < 0) expl = true;
                }
            }
        }
    }
    if (expl) triggerGO("Bomb Exploded!");
    State.bombCounter--;
    if (State.bombCounter <= 0) {
        let e = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!State.grid[y][x]) e.push({ x, y });
        if (e.length) {
            const p = e[Math.floor(Math.random() * e.length)];
            State.grid[p.y][p.x] = { color: '#ff0044', scale: 0, targetScale: 1, bomb: 9 };
            showToast("Bomb Spawned!", true);
        }
        State.bombCounter = 8;
    }
}

export function checkGO() {
    if (State.isGameOver || State.tutorial.active) return;
    if (State.queue.every(p => p === null)) { fillQueue(); return; }
    let cm = false;
    for (let p of State.queue) if (p) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (canPlace(p, x, y)) cm = true;
    if (!cm) {
        // Double check we actually have pieces to prevent race conditions
        const activePieces = State.queue.filter(p => p !== null).length;
        if (activePieces === 0) { fillQueue(); return; }

        if (State.gameMode === 'zen') {
            showToast("Zen Refresh...", true);
            setTimeout(() => {
                State.grid = Array(8).fill(null).map(() => Array(8).fill(null));
                fillQueue(false); // New pieces too
                AudioSys.sfx.levelup();
                updateHUD();
            }, 1000);
        }
        else triggerGO("BOARD FULL: NO MOVES LEFT!");
    }
}

export function triggerGO(msg: string, isWin: boolean = false) {
    // Policy Effect: Tax Shield (Bailout)
    if (State.activePolicy === 'taxShield' && State.bailoutsLeft > 0) {
        State.bailoutsLeft--;
        showToast(`SAFETY NET RESCUE!`, true);

        // Trigger Sweep Animation
        const sweep = document.getElementById('bailout-sweep');
        if (sweep) {
            sweep.classList.remove('active');
            void sweep.offsetWidth; // Force reflow
            sweep.classList.add('active');
        }

        State.grid = State.grid.map(row => row.map(() => null));
        fillQueue(false);
        updateHUD();
        vibrate([100, 50, 100, 50, 200]);
        AudioSys.sfx.levelup();
        return;
    }

    State.isGameOver = true;
    State.gameRunning = false;
    document.body.classList.remove('in-game');
    const header = document.getElementById('game-header');
    if (header) header.classList.add('hidden');

    const go = document.getElementById('gameover-overlay');
    const finalScore = document.getElementById('final-score');
    const finalHigh = document.getElementById('final-highscore');
    if (finalScore) finalScore.innerText = State.score.toString();
    if (finalHigh) finalHigh.innerText = State.highScore.toString();

    if (go) {
        const title = go.querySelector('.title-large') as HTMLElement;
        if (title) title.innerText = isWin ? "VICTORY!" : msg;

        const btn = document.getElementById('btn-restart');
        if (btn) {
            if (isWin) {
                btn.innerText = "Next Level";
                btn.onclick = () => {
                    document.getElementById('gameover-overlay')?.classList.add('hidden');
                    State.adventure.levelId++;
                    // Basic loop protection or finish check
                    if (State.adventure.levelId >= ADVENTURE_LEVELS.length) {
                        showToast("All Levels Completed!");
                        State.adventure.levelId = 0;
                    }
                    (window as any).startGame('adventure', State.adventure.levelId);
                };
            } else {
                btn.innerText = "Try Again";
                btn.onclick = () => {
                    document.getElementById('gameover-overlay')?.classList.add('hidden');
                    (window as any).startGame(State.gameMode === 'classic' ? 'new' : State.gameMode, State.adventure.levelId);
                };
            }
        }

        // Phase 4: Refined Game Over (Stats summary)
        const summary = document.createElement('div');
        summary.className = 'glass-panel';
        summary.style.marginTop = '20px';
        summary.innerHTML = `
            <div style="font-size:14px; opacity:0.7; margin-bottom:10px">${isWin ? 'LEVEL COMPLETE' : 'SESSION STATS'}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                <div>Score: <b>${State.score}</b></div>
                <div>Blocks: <b>${GlobalStats.blocksPlaced}</b></div>
                <div>Lines: <b>${GlobalStats.linesCleared}</b></div>
                ${isWin ? '<div style="grid-column:span 2; color:#4caf50; font-weight:bold; margin-top:5px">REWARD: +500 🟡</div>' : ''}
            </div>
        `;
        if (isWin) addCoins(500);

        const content = go.querySelector('.overlay-content');
        if (content) {
            const existing = content.querySelector('.summary-panel');
            if (existing) existing.remove();
            summary.classList.add('summary-panel');
            content.insertBefore(summary, document.getElementById('btn-restart'));

            // Context-aware button logic
            const restartBtn = document.getElementById('btn-restart');
            if (restartBtn) {
                // Remove old event listeners by cloning
                const newBtn = restartBtn.cloneNode(true) as HTMLElement;
                restartBtn.parentNode?.replaceChild(newBtn, restartBtn);

                if (isWin && State.gameMode === 'adventure') {
                    newBtn.innerHTML = 'NEXT LEVEL ⏩';
                    newBtn.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
                    newBtn.onclick = () => {
                        // Advance to next level
                        const nextLvl = State.adventure.levelId + 1;
                        if (ADVENTURE_LEVELS[nextLvl]) {
                            document.getElementById('gameover-overlay')?.classList.add('hidden');
                            (window as any).startGame('adventure', nextLvl);
                        } else {
                            // No more levels (completed all)
                            showToast("All Levels Completed! 🎉");
                            document.getElementById('gameover-overlay')?.classList.add('hidden');
                            // Go to home
                            document.getElementById('home-screen')?.classList.remove('hidden');
                            document.getElementById('game-container')?.classList.add('hidden');
                        }
                    };
                } else {
                    newBtn.innerHTML = 'TRY AGAIN 🔄';
                    newBtn.style.background = ''; // Reset standard style
                    newBtn.onclick = () => {
                        document.getElementById('gameover-overlay')?.classList.add('hidden');
                        (window as any).startGame(State.gameMode === 'adventure' ? 'adventure' : 'new', State.adventure.levelId);
                    };
                }
            }
        }

        const inputOverlay = document.getElementById('input-overlay');
        const inputScore = document.getElementById('input-score');

        if (!isWin && State.score > 0 && (State.leaderboard.length < 5 || State.score > State.leaderboard[State.leaderboard.length - 1].score)) {
            if (inputOverlay) inputOverlay.classList.remove('hidden');
            if (inputScore) inputScore.innerText = State.score.toString();
        } else {
            if (go) go.classList.remove('hidden');
        }
    }
}

export function checkLvl(l: number) {
    State.linesClearedTotal += l;
    const nl = Math.floor(State.linesClearedTotal / 10) + 1;
    if (nl > State.level) {
        State.level = nl;

        // Enhanced rewards system
        GlobalStats.inventory.hammer += 2; // Increased from 1

        if (nl % 2 === 0) GlobalStats.inventory.reroll++; // Reroll every 2 levels
        if (nl % 3 === 0) GlobalStats.inventory.bomb++; // Bomb every 3 levels
        if (nl % 5 === 0) { // Special bonus every 5 levels
            GlobalStats.inventory.undo++;
            addCoins(100);
            showToast(`Level ${nl}! Bonus Rewards!`, true);
        }

        updateTools();
        AudioSys.sfx.levelup();
        const indicator = document.getElementById('level-up-indicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 1500);
        }

        // Visual celebration for milestone levels
        if (nl % 10 === 0) {
            spawnText(`LEVEL ${nl}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#FFD700', 100, 'combo');
            vibrate([100, 50, 100, 50, 200]);
        }
    }
}

export function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
        if (!GlobalStats.unlockedAchievements.includes(a.id) && a.check(GlobalStats)) {
            GlobalStats.unlockedAchievements.push(a.id);
            showToast(`🏆 ${a.name}!`, true);
            AudioSys.sfx.tada();
            SaveManager.saveGlobalStats();
        }
    });
}

// --- INITIALIZATION ---

export function initGame(mode: string, lvlIdx: number = 0) {
    State.isPaused = false; State.isEnding = false; State.isGameOver = false;
    State.particles = []; State.floatingTexts = []; State.effects = [];
    State.clearingRows = []; State.clearingCols = []; State.activeTool = null; State.previousMove = null;
    State.score = 0; State.displayedScore = 0; State.level = 1; State.streak = 0; State.bombCounter = 8;
    State.queue = []; State.frenzy.moves = 0; State.boss.active = false; State.investor.active = false;
    State.adventure = { levelId: lvlIdx, progress: 0, sessionBlocks: 0, sessionLines: 0, sessionGems: 0, movesLeft: 0, maxMoves: 0, bossDefeatedThisSession: false };


    State.gameRunning = true;
    document.body.classList.add('in-game');

    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        if (State.activePolicy === 'taxShield') {
            canvas.classList.add('grid-hardened');
            if (mode !== 'resume') State.bailoutsLeft = 3;
            showToast("SAFETY NET: 3 LIVES ACTIVATED!", true);
        } else {
            canvas.classList.remove('grid-hardened');
        }

        if (State.activePolicy === 'aggressive' && mode !== 'resume') showToast("MEGA BLOCKS: 2X SCORE!", true);
        if (State.activePolicy === 'leanStartup' && mode !== 'resume') showToast("QUICK SORT: 3X INCOME!", true);
    }

    if (mode === 'zen') State.gameMode = 'zen';
    else if (mode === 'adventure') {
        State.gameMode = 'adventure';
        State.adventure.levelId = lvlIdx; State.adventure.progress = 0;
        State.adventure.sessionBlocks = 0; State.adventure.sessionLines = 0;
        State.adventure.movesLeft = ADVENTURE_LEVELS[lvlIdx] ? ADVENTURE_LEVELS[lvlIdx].moves : 20;
        State.adventure.maxMoves = State.adventure.movesLeft;
        State.level = Math.floor(lvlIdx / 3) + 1;
    }
    else if (mode === 'bomb') {
        State.gameMode = 'bomb';
        State.bombCounter = 5;
    }
    else if (mode !== 'resume') State.gameMode = 'classic';

    State.bgShapes = [];
    for (let i = 0; i < 25; i++) {
        const themePalette = PALETTES[Math.min(State.level - 1, PALETTES.length - 1)];
        State.bgShapes.push({
            x: Math.random() * 800, y: Math.random() * 1200,
            s: 20 + Math.random() * 80,
            vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
            rot: Math.random() * 6, vr: (Math.random() - .5) * .01,
            c: themePalette[Math.floor(Math.random() * themePalette.length)]
        });
    }


    const modeKey = (State.gameMode === 'classic' ? STORAGE_KEY : STORAGE_KEY + '-' + State.gameMode);
    State.highScore = parseInt(localStorage.getItem(modeKey) || '0');

    if (mode === 'resume') {
        if (SaveManager.loadGame()) {
            State.tutorial.active = false;

            // Ensure queue pieces are properly positioned after load
            positionQueue();

            // Validate queue state
            if (!State.queue || State.queue.length === 0 || State.queue.every(p => p === null)) {
                fillQueue();
            }

            updateHUD();
            showToast("Welcome Back!");
            AudioSys.init(); AudioSys.startMusic();
            collectPassiveIncome();
            updateTools(); // Ensure tools are updated on resume

            // Force a re-render
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) gameLoop(ctx);
            }
            return; // EXIT HERE on success
        } else {
            showToast("Save Data Corrupted", true);
            // Fall through to new game
            State.gameMode = 'classic'; // Default back
        }
    }

    // New Game Setup
    State.isGameOver = false;
    State.isPaused = false;
    State.score = 0;
    State.displayedScore = 0;
    State.moveCount = 0;
    State.level = 1;
    State.linesClearedTotal = 0;
    State.streak = 0;

    // Initialize Grid
    State.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    // Load Adventure Level Board
    if (mode === 'adventure' && ADVENTURE_LEVELS[lvlIdx]) {
        const lvl = ADVENTURE_LEVELS[lvlIdx];
        if (lvl.board) {
            for (let r = 0; r < Math.min(lvl.board.length, ROWS); r++) {
                for (let c = 0; c < Math.min(lvl.board[r].length, COLS); c++) {
                    const val = lvl.board[r][c];
                    if (val) {
                        const targetScale = 1;
                        if (val === 'G') {
                            State.grid[r][c] = { color: '#00FA9A', scale: 0, targetScale, type: 'gem', flash: 0 };
                        } else if (val === 'I') {
                            State.grid[r][c] = { color: '#81D4FA', scale: 0, targetScale, type: 'ice', iceLevel: 2, flash: 0 };
                        } else if (val === 'C') {
                            State.grid[r][c] = { color: '#9E9E9E', scale: 0, targetScale, type: 'chain', isChained: true, flash: 0 };
                        } else {
                            State.grid[r][c] = { color: '#795548', scale: 0, targetScale, type: 'normal', flash: 0 };
                        }
                    }
                }
            }
        }
        // Boss Level Spawn
        if (lvl.goalType === 'boss') {
            spawnBoss("TOY MASTER", 2000);
        }
    }
    State.queue = [];
    State.boss.active = false;
    State.comboHeat = 0;
    State.frenzy.moves = 0;
    State.activeEvent = null;
    State.taxHavenMoves = 0;

    const bui = document.getElementById('boss-ui');
    if (bui) bui.classList.add('hidden');

    // Explicitly show the HUD
    const headerEl = document.getElementById('game-header');
    if (headerEl) headerEl.classList.remove('hidden');

    State.tutorial.active = (mode === 'tutorial'); State.tutorial.step = 0;

    document.body.style.filter = 'hue-rotate(0deg)';
    if (State.tutorial.active) {
        setupTutorial(0);
        const pow = document.getElementById('powerup-ui');
        if (pow) pow.classList.add('hidden');
    }
    else {
        fillQueue();
        GlobalStats.gamesPlayed++;
        SaveManager.saveGlobalStats();
        const pow = document.getElementById('powerup-ui');
        if (State.gameMode !== 'zen') { if (pow) pow.classList.remove('hidden'); }
        else { if (pow) pow.classList.add('hidden'); showToast("Zen Mode 🌸"); }
        if (State.gameMode === 'bomb') showToast("Defuse bombs!", true);
        if (State.gameMode === 'adventure') {
            showToast(ADVENTURE_LEVELS[State.adventure.levelId].title, true);
            if (State.adventure.levelId === 14) spawnBoss("TOY MASTER", 150);
        }
    }


    // Explicitly fill queue if empty
    if (!State.queue || State.queue.length === 0) {
        fillQueue(true);
    }

    // Reset powerup bar visibility & Header
    const pb = document.getElementById('powerup-ui');
    if (pb) {
        pb.classList.remove('hidden');
        pb.style.display = 'flex';
        pb.style.opacity = '1';
        pb.style.pointerEvents = 'auto'; // Ensure clickable
    }

    const gh = document.getElementById('game-header');
    if (gh) {
        gh.classList.remove('hidden');
        gh.style.display = 'flex';
        gh.style.opacity = '1';
    }

    updateHUD();

    updateTools();
    AudioSys.init();
    AudioSys.startMusic();
    collectPassiveIncome();
    MascotSys.onGameStart();

    // Force strict restart of loop
    const canvasEl = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvasEl) {
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
            // Cancel any existing loop if possible (though we don't track the ID globally, re-calling is usually safe if state is reset)
            gameLoop(ctx);
        }
    }
}


export function collectPassiveIncome() {
    const now = Date.now();
    const diffHours = (now - GlobalStats.lastPassiveCollection) / (1000 * 60 * 60);
    if (diffHours < 0.1) return; // Wait at least 6 minutes

    let rate = 0;
    for (let i = 0; i < GlobalStats.hqLevel; i++) {
        rate += HQ_UPGRADES[i].incomeRate;
    }
    if (State.activePolicy === 'leanStartup') rate *= 3;

    if (rate > 0) {
        const income = Math.floor(diffHours * rate);
        if (income > 0) {
            addCoins(income);
            showToast(`Toy Box Generated +${income} 🟡`, true);
            SaveManager.saveGlobalStats();
            updateHUD();
        }
    }
    GlobalStats.lastPassiveCollection = now;
}



export function setupTutorial(s: number) {
    State.queue = [null, null, null]; State.grid = Array(8).fill(null).map(() => Array(8).fill(null));
    if (s === 0) State.queue[0] = new Piece(1, '2x2');
    else if (s === 1) State.queue[0] = new Piece(1, 'L1');
    else {
        for (let c = 0; c < 8; c++) if (c !== 3 && c !== 4) State.grid[7][c] = { color: '#555', scale: 1, targetScale: 1 };
        State.queue[0] = new Piece(1, '2x1');
    }
    if (State.queue[0]) { State.queue[0].scale = 0.6; State.queue[0].targetScaleQueue = 0.6; }
    positionQueue();
}

export function buyItem(type: keyof Inventory, price: number) {
    if (GlobalStats.coins >= price) {
        GlobalStats.coins -= price;
        GlobalStats.inventory[type] = (GlobalStats.inventory[type] || 0) + 1;

        AudioSys.sfx.coin();
        showToast(`Bought ${type.toUpperCase()}`);
        SaveManager.saveGlobalStats();
        updateHUD();
        updateTools();
    } else {
        showToast("Not enough Coins!", true);
        AudioSys.sfx.invalid();
    }
}

export function buyExtraLife() {
    const cost = 10000;
    if (GlobalStats.coins >= cost) {
        GlobalStats.coins -= cost;
        State.bailoutsLeft++;
        AudioSys.sfx.coin();
        showToast("EXTRA LIFE READY!");
        SaveManager.saveGlobalStats();
        updateHUD();
    } else {
        showToast("Too expensive!", true);
        AudioSys.sfx.invalid();
    }
}

export function buyUpgrade(id: string) {
    const upgrade = UPGRADES.find(u => u.id === id);
    if (!upgrade) return;
    const currentLvl = (GlobalStats.upgrades as any)[id];
    if (currentLvl >= upgrade.maxLevel) {
        showToast("Max Level Reached!");
        return;
    }
    const cost = upgrade.costs[currentLvl];
    if (GlobalStats.coins >= cost) {
        GlobalStats.coins -= cost;
        (GlobalStats.upgrades as any)[id]++;
        AudioSys.sfx.coin();
        showToast(`${upgrade.name} Upgraded!`, true);
        SaveManager.saveGlobalStats();
        updateHUD();
        // Trigger UI update if window.updateUpgradeUI exists
        if ((window as any).updateUpgradeUI) (window as any).updateUpgradeUI();
    } else {
        showToast("Not enough Coins!", true);
        AudioSys.sfx.invalid();
    }
}

function handleElementalMove() {
    for (let x = 0; x < COLS; x++) {
        for (let y = ROWS - 2; y >= 0; y--) {
            const cell = State.grid[y][x];
            if (cell && cell.type === 'liquid' && !State.grid[y + 1][x]) {
                State.grid[y + 1][x] = cell;
                State.grid[y][x] = null;
            }
        }
    }
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = State.grid[y][x];
            if (!cell) continue;
            if (cell.type === 'inflation') {
                cell.timer = (cell.timer || 0) + 1;
                if (cell.timer >= 5) { growInflation(x, y); cell.timer = 0; }
            } else if (cell.type === 'crypto') {
                const types: any[] = ['gold', 'metal', 'multiplier', 'normal'];
                cell.type = types[Math.floor(Math.random() * types.length)];
                if (cell.type === 'gold') cell.color = '#FFD700';
                else if (cell.type === 'metal') cell.health = 2;
            }
        }
    }
}
function growInflation(x: number, y: number) { const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }]; dirs.forEach(d => { const nx = x + d.dx, ny = y + d.dy; if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !State.grid[ny][nx]) { State.grid[ny][nx] = { color: '#ff4b2b', scale: 0, targetScale: 1, type: 'inflation', timer: 0 }; } }); }

export function triggerRandomEvent() {
    if (State.activeEvent) return;
    const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    State.activeEvent = e;
    State.eventTimer = e.duration;
    showToast(`BREAKING NEWS: ${e.name}`, true);
    vibrate([50, 100, 50]);
    if (e.id === 'crash') {
        fillQueue(false);
        State.activeEvent = null;
    }
    if (e.id === 'sabotage') {
        let count = 0;
        for (let i = 0; i < 3; i++) {
            let rx = Math.floor(Math.random() * COLS), ry = Math.floor(Math.random() * ROWS);
            if (!State.grid[ry][rx]) {
                State.grid[ry][rx] = { color: '#ff4b2b', scale: 0, targetScale: 1, type: 'metal', health: 2 };
                count++;
            }
        }
        if (count > 0) showToast('Rival Sabotage Detected!');
        State.activeEvent = null;
    }
    updateHUD();
}
function handleEventStep() {
    if (!State.activeEvent) {
        if (Math.random() < 0.05) triggerRandomEvent();
        return;
    }
    State.eventTimer--;
    if (State.eventTimer <= 0) {
        showToast(`Event Ended: ${State.activeEvent.name}`);
        State.activeEvent = null;
        updateHUD();
    }
}

setInterval(() => {
    if (!State.isGameOver && !State.isPaused && (State.gameRunning || State.moveCount > 0)) {
        GlobalStats.timePlayed = (GlobalStats.timePlayed || 0) + 1;
        if (GlobalStats.timePlayed % 60 === 0) SaveManager.saveGlobalStats();
    }
}, 1000);

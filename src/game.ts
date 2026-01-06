// BlockRiser Game Engine
// Fully Modularized TypeScript Implementation

// --- TYPES ---
export interface Theme {
    id: string;
    name: string;
    unlock: number;
}

export interface Shape {
    id: string;
    map: number[][];
}

export interface AdventureLevel {
    id: number;
    title: string;
    goalType: 'lines' | 'score' | 'blocks';
    target: number;
    desc: string;
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
export const GRID_OFFSET_X = 40;
export const GRID_OFFSET_Y = 100;
export const CELL_SIZE = (CANVAS_WIDTH - (GRID_OFFSET_X * 2)) / COLS;
export const QUEUE_Y = GRID_OFFSET_Y + (ROWS * CELL_SIZE) + 140;
export const QUEUE_HEIGHT = CANVAS_HEIGHT - QUEUE_Y - 20;

export const STORAGE_KEY = 'blockriser-highscore';
export const STATE_KEY = 'blockriser-state';
export const STATS_KEY = 'blockriser-global-stats';
export const LEADERBOARD_KEY = 'blockriser-leaderboard';

export const PALETTES = [
    ['#FF3366', '#33FF57', '#3366FF', '#FF33FF', '#FFFF33', '#33FFFF', '#FF9933'],
    ['#FF6B6B', '#4ECDC4', '#556270', '#C7F464', '#FFCC5C'],
    ['#D30C7B', '#FFE314', '#007CBE', '#FFFFFF', '#000000'],
    ['#00FF00', '#00FF99', '#CCFF00', '#00CCFF', '#9900FF'],
    ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF']
];

export const THEMES: Theme[] = [
    { id: 'classic', name: 'Plastic', unlock: 0 },
    { id: 'pixel', name: '8-Bit', unlock: 2000 },
    { id: 'neon', name: 'Cyber', unlock: 5000 },
    { id: 'midnight', name: 'Midnight', unlock: 8000 },
    { id: 'obsidian', name: 'Void', unlock: 10000 },
    { id: 'eclipse', name: 'Eclipse', unlock: 15000 },
    { id: 'abyss', name: 'Abyss', unlock: 20000 },
    { id: 'inferno', name: 'Inferno', unlock: 25000 },
    { id: 'spectral', name: 'Spectral', unlock: 30000 }
];

export const SHAPES: Shape[] = [
    { id: '1x1', map: [[1]] }, { id: '2x1', map: [[1, 1]] }, { id: '3x1', map: [[1, 1, 1]] }, { id: '2x2', map: [[1, 1], [1, 1]] },
    { id: 'L1', map: [[1, 0], [1, 0], [1, 1]] }, { id: 'L2', map: [[0, 1], [0, 1], [1, 1]] }, { id: 'T1', map: [[1, 1, 1], [0, 1, 0]] },
    { id: 'Z1', map: [[1, 1, 0], [0, 1, 1]] }, { id: 'S1', map: [[0, 1, 1], [1, 1, 0]] }, { id: '3x3L', map: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    { id: 'U', map: [[1, 0, 1], [1, 1, 1]] }, { id: '4x1', map: [[1, 1, 1, 1]] }, { id: 'Plus', map: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
    { id: 'BigT', map: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] }, { id: 'Diag3', map: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
    { id: 'H', map: [[1, 0, 1], [1, 1, 1], [1, 0, 1]] }, { id: 'X5', map: [[1, 0, 1], [0, 1, 0], [1, 0, 1]] },
    { id: 'Stairs4', map: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] }, { id: 'Tank', map: [[0, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { id: 'U_big', map: [[1, 0, 1], [1, 0, 1], [1, 1, 1]] }, { id: 'T_long', map: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
    { id: 'W_shape', map: [[1, 0, 0], [1, 1, 0], [0, 1, 1]] },
    { id: 'Glider', map: [[0, 1, 0], [0, 0, 1], [1, 1, 1]] },
    { id: 'J_long', map: [[0, 1], [0, 1], [1, 1]] },
    { id: 'L_long', map: [[1, 0], [1, 0], [1, 1]] },
    { id: 'Donut', map: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] },
    { id: 'Anchor', map: [[1, 0, 1], [1, 1, 1], [0, 1, 0]] },
    { id: 'Bird', map: [[0, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { id: 'C_big', map: [[1, 1, 1], [1, 0, 0], [1, 1, 1]] },
    { id: 'Tree', map: [[0, 1, 0], [0, 1, 0], [1, 1, 1], [0, 1, 0]] },
    { id: 'Zigzag4', map: [[1, 1, 0, 0], [0, 1, 1, 1]] }
];

export const ADVENTURE_LEVELS: AdventureLevel[] = [
    { id: 0, title: "Baby Steps", goalType: 'lines', target: 3, desc: "Clear 3 Lines" }, { id: 1, title: "Point Chaser", goalType: 'score', target: 500, desc: "Score 500 Pts" },
    { id: 2, title: "Brick Layer", goalType: 'blocks', target: 20, desc: "Place 20 Blocks" }, { id: 3, title: "Line Dancer", goalType: 'lines', target: 10, desc: "Clear 10 Lines" },
    { id: 4, title: "High Flyer", goalType: 'score', target: 2000, desc: "Score 2000 Pts" }, { id: 5, title: "Marathon", goalType: 'blocks', target: 50, desc: "Place 50 Blocks" },
    { id: 6, title: "Double Trouble", goalType: 'lines', target: 20, desc: "Clear 20 Lines" }, { id: 7, title: "Grand Master", goalType: 'score', target: 5000, desc: "Score 5000 Pts" }
];

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'novice', name: 'Novice Builder', desc: 'Place 50 Blocks', icon: '🧱', check: s => s.blocksPlaced >= 50 },
    { id: 'expert', name: 'Master Architect', desc: 'Place 1000 Blocks', icon: '🏗️', check: s => s.blocksPlaced >= 1000 },
    { id: 'cleaner', name: 'Housekeeper', desc: 'Clear 100 Lines', icon: '🧹', check: s => s.linesCleared >= 100 },
    { id: 'bomber', name: 'Demolition Expert', desc: 'Use 20 Power-ups', icon: '💥', check: s => (s.hammersUsed + s.bombsUsed) >= 20 },
    { id: 'veteran', name: 'Veteran', desc: 'Play 50 Games', icon: '🎖️', check: s => s.gamesPlayed >= 50 }
];

export const DAILY_REWARDS = [
    { day: 1, type: 'coin', val: 50, icon: '🟡' },
    { day: 2, type: 'hammer', val: 1, icon: '🔨' },
    { day: 3, type: 'coin', val: 100, icon: '🟡' },
    { day: 4, type: 'reroll', val: 2, icon: '🔄' },
    { day: 5, type: 'undo', val: 2, icon: '↩️' },
    { day: 6, type: 'bomb', val: 1, icon: '💣' },
    { day: 7, type: 'coin', val: 500, icon: '👑' }
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

    constructor(lvl: number = 1, sid: string | null = null) {
        let s = sid ? SHAPES.find(x => x.id === sid) : SHAPES[Math.floor(Math.random() * SHAPES.length)];
        if (!s) s = SHAPES[0];
        this.shapeId = s.id;
        this.map = s.map.map(r => [...r]);
        this.color = PALETTES[Math.min(lvl - 1, PALETTES.length - 1)][Math.floor(Math.random() * 5)];
        this.rows = this.map.length;
        this.cols = this.map[0].length;
    }

    rotate() {
        const nm = Array(this.cols).fill(null).map(() => Array(this.rows).fill(0));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                nm[c][this.rows - 1 - r] = this.map[r][c];
            }
        }
        this.map = nm;
        [this.rows, this.cols] = [this.cols, this.rows];
        this.rotated = true;
        this.visualRotation -= Math.PI / 2;
    }
}

// --- STATE MANAGEMENT ---

export const GlobalStats = {
    gamesPlayed: 0,
    linesCleared: 0,
    blocksPlaced: 0,
    hammersUsed: 0,
    bombsUsed: 0,
    unlockedAchievements: [] as string[],
    adventureMaxLevel: 0,
    coins: 0,
    dailyStreak: 0,
    lastLogin: null as string | null,
    inventory: { hammer: 3, bomb: 1, reroll: 1, undo: 1 } as Inventory
};

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
    activeTool: null as string | null,
    adventure: { levelId: 0, progress: 0, sessionBlocks: 0, sessionLines: 0 },
    tutorial: { active: false, step: 0 },
    settings: { highQuality: true, vibration: true, gameSpeed: 0, music: true, sfx: true },
    screenShake: 0,
    clearStartTime: 0,
    previousMove: null as any | null,
    gameRunning: false // New flag to prevent multiple loops
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
        const playChord = () => {
            if (!State.settings.music || !this.ctx) return;
            const baseFreq = 110 + (State.level * 10), ratios = [1, 1.5, 1.25, 2.0];
            const freq = baseFreq * ratios[Math.floor(Math.random() * ratios.length)];
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), panner = this.ctx.createStereoPanner();
            osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.detune.value = (Math.random() - 0.5) * 10;
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 1.0);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);
            panner.pan.value = (Math.random() - 0.5) * 0.8;
            osc.connect(gain); gain.connect(panner); panner.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 4.5);
        };
        playChord();
        this.musicInterval = setInterval(playChord, 3000);
    },
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    },
    sfx: {
        pickup: () => AudioSys.playTone(400, 'sine', 0.15, 0.1),
        rotate: () => AudioSys.playTone(800, 'triangle', 0.1, 0.05, 1200),
        place: (col: number = 0) => { const n = [261, 293, 329, 392, 440, 523, 587, 659]; AudioSys.playTone(n[col % 8], 'sine', 0.15, 0.2); },
        invalid: () => AudioSys.playTone(150, 'sawtooth', 0.2, 0.1, 100),
        clear: (c: number) => { for (let i = 0; i < Math.min(c + 1, 4); i++) setTimeout(() => AudioSys.playTone(440 * (1 + i * 0.25), 'sine', 0.4, 0.15), i * 60); },
        levelup: () => {
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            notes.forEach((n, i) => setTimeout(() => {
                AudioSys.playTone(n, 'triangle', 0.3, 0.1);
                AudioSys.playTone(n / 2, 'sine', 0.4, 0.1);
            }, i * 80));
        },
        gameover: () => {
            if (!AudioSys.ctx) return;
            const t = AudioSys.ctx.currentTime;
            const o = AudioSys.ctx.createOscillator();
            const g = AudioSys.ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(150, t);
            o.frequency.exponentialRampToValueAtTime(10, t + 1.0);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
            o.connect(g); g.connect(AudioSys.ctx.destination);
            o.start(); o.stop(t + 1.1);
        },
        powerup: () => AudioSys.playTone(880, 'sine', 0.3, 0.1, 220),
        smash: () => { AudioSys.playTone(100, 'square', 0.2, 0.3); },
        tada: () => { AudioSys.playTone(523, 'triangle', 0.2); setTimeout(() => AudioSys.playTone(659, 'triangle', 0.4), 150); },
        coin: () => { AudioSys.playTone(1200, 'sine', 0.1, 0.1); setTimeout(() => AudioSys.playTone(1600, 'sine', 0.2, 0.1), 50); },
        reroll: () => { for (let i = 0; i < 3; i++) setTimeout(() => AudioSys.playTone(800 + i * 200, 'triangle', 0.1, 0.05), i * 100); }
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
                if (!GlobalStats.inventory) GlobalStats.inventory = { hammer: 3, bomb: 1, reroll: 1, undo: 1 };
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
            adv: State.adventure
        };
        localStorage.setItem(STATE_KEY, JSON.stringify(d));
    },
    loadGame(): boolean {
        try {
            const saved = localStorage.getItem(STATE_KEY);
            if (!saved) return false;
            const d = JSON.parse(saved);
            State.grid = d.grid;
            State.score = d.score;
            State.level = d.level;
            State.linesClearedTotal = d.lines;
            State.streak = d.streak;
            State.currentTheme = d.thm || 'classic';
            State.gameMode = d.gm || 'classic';
            State.bombCounter = d.bc || 8;
            State.adventure = d.adv || { levelId: 0, progress: 0, sessionBlocks: 0, sessionLines: 0 };
            State.queue = d.queue.map((q: any) => {
                if (!q) return null;
                const p = new Piece(State.level, q.sid);
                p.color = q.c;
                if (q.r) p.rotate();
                p.scale = p.targetScaleQueue;
                return p;
            });
            return true;
        } catch (e) { return false; }
    }
};

// --- CORE UTILS ---

export function vibrate(ms: number) {
    if (State.settings.vibration && navigator.vibrate) navigator.vibrate(ms);
}

export function showToast(m: string, b: boolean = false) {
    const toast = document.getElementById('toast-instruction');
    if (toast) {
        toast.innerText = m;
        toast.className = b ? 'toast toast-bonus visible' : 'toast visible';
        setTimeout(() => toast.className = 'toast', 3000);
    }
}

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
    if (hudHighScore) hudHighScore.innerText = State.highScore.toString();
    if (hudLevel) {
        if (State.gameMode === 'adventure') {
            const l = ADVENTURE_LEVELS[State.adventure.levelId];
            hudLevel.innerText = `${State.adventure.progress}/${l.target}`;
            const lbl = document.getElementById('hud-level-label');
            if (lbl) lbl.innerText = 'Goal';
        } else {
            hudLevel.innerText = State.level.toString();
            const lbl = document.getElementById('hud-level-label');
            if (lbl) lbl.innerText = 'Level';
        }
    }
    const header = document.querySelector('header .hud-group:first-child .hud-label');
    if (header) {
        const modeNames: any = { classic: 'Score', zen: 'Zen', bomb: 'Bomb', adventure: 'Adv' };
        header.textContent = modeNames[State.gameMode] || 'Score';
    }
    updateCoinDisplays();
}

export function updateTools() {
    // Current inventory is linked to GlobalStats (Phase 2)
    const inv = GlobalStats.inventory;
    const countHammer = document.getElementById('count-hammer');
    const countBomb = document.getElementById('count-bomb');
    const countReroll = document.getElementById('count-reroll');
    const countUndo = document.getElementById('count-undo');

    if (countHammer) countHammer.innerText = inv.hammer.toString();
    if (countBomb) countBomb.innerText = inv.bomb.toString();
    if (countReroll) countReroll.innerText = inv.reroll.toString();
    if (countUndo) countUndo.innerText = inv.undo.toString();

    const btnHammer = document.getElementById('btn-hammer');
    const btnBomb = document.getElementById('btn-bomb');
    const btnReroll = document.getElementById('btn-reroll');
    const btnUndo = document.getElementById('btn-undo');

    if (btnHammer) btnHammer.className = 'powerup-btn ' + (inv.hammer ? '' : 'disabled') + (State.activeTool === 'hammer' ? ' active' : '');
    if (btnBomb) btnBomb.className = 'powerup-btn ' + (inv.bomb ? '' : 'disabled') + (State.activeTool === 'bomb' ? ' active' : '');
    if (btnReroll) btnReroll.className = 'powerup-btn ' + (inv.reroll ? '' : 'disabled');
    if (btnUndo) btnUndo.className = 'powerup-btn ' + (inv.undo && State.previousMove ? '' : 'disabled');
}

export function positionQueue() {
    State.queue.forEach((p, i) => {
        if (p) {
            p.baseX = (CANVAS_WIDTH / 3 * i) + (CANVAS_WIDTH / 6);
            p.baseY = QUEUE_Y + QUEUE_HEIGHT / 2;
            if (!p.isDragging) { p.x = p.baseX; p.y = p.baseY; }
        }
    });
}

export function fillQueue(resetUndo: boolean = true) {
    State.queue = [new Piece(State.level), new Piece(State.level), new Piece(State.level)];
    positionQueue();
    if (resetUndo) State.previousMove = null;
    checkGO();
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

export function spawnPart(x: number, y: number, c: string, cnt: number, type: string = 'debris') {
    const speedMultipliers = [1.0, 1.5, 2.5];
    const speedFactor = (1.0 + ((State.level - 1) * 0.05)) * speedMultipliers[State.settings.gameSpeed];
    for (let i = 0; i < cnt; i++) {
        let speed = type === 'explosion' ? 8 : 5;
        State.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed, life: 1, c: c, type: type, s: Math.random() * 8 + 4 });
    }
}

export function spawnText(t: string, x: number, y: number, c: string, s: number, type: string = 'normal') {
    State.floatingTexts.push({ t: t, x: x, y: y, c: c, s: s, l: 1, type: type, tick: 0 });
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
    const speedMult = multipliers[State.settings.gameSpeed];
    State.score += Math.floor(pts * speedMult);
    const modeKey = (State.gameMode === 'classic' ? STORAGE_KEY : STORAGE_KEY + '-' + State.gameMode);
    if (State.score > State.highScore) {
        State.highScore = State.score;
        localStorage.setItem(modeKey, State.highScore.toString());
    }
    updateHUD();
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

    GlobalStats.inventory.undo--;
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

export function placePiece(p: Piece, gx: number, gy: number) {
    saveUndoState();
    for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
            if (p.map[r][c]) {
                State.grid[gy + r][gx + c] = { color: p.color, scale: 1, targetScale: 1, flash: 1, yOffset: -60 };
                spawnPart((gx + c) * CELL_SIZE + GRID_OFFSET_X + CELL_SIZE / 2, (gy + r) * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2, p.color, 8, 'spark');
            }
        }
    }
    const pts = p.map.flat().filter(x => x).length * 10 * State.level;
    addScore(pts);
    GlobalStats.blocksPlaced++;
    if (State.gameMode === 'adventure') { State.adventure.sessionBlocks++; checkAdv(); }
    AudioSys.sfx.place(gx); vibrate(20);
    if (!checkLines()) { State.streak = 0; if (State.gameMode === 'bomb') handleBomb(); }
    SaveManager.saveGlobalStats();
    checkAchievements();
    SaveManager.saveGame();
    updateTools();
}

export function checkLines(): boolean {
    let fr: number[] = [], fc: number[] = [];
    for (let y = 0; y < ROWS; y++) if (State.grid[y].every(c => c)) fr.push(y);
    for (let x = 0; x < COLS; x++) { let f = true; for (let y = 0; y < ROWS; y++) if (!State.grid[y][x]) f = false; if (f) fc.push(x); }
    if (fr.length + fc.length > 0) {
        State.streak++; State.isClearing = true; State.clearingRows = fr; State.clearingCols = fc; State.clearStartTime = Date.now();
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
        if (State.grid[y][x]) {
            lastX = GRID_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2;
            lastY = GRID_OFFSET_Y + y * CELL_SIZE + CELL_SIZE / 2;
            spawnPart(lastX, lastY, State.grid[y][x].color, 15, 'explosion');
            State.grid[y][x] = null;
        }
    });

    const lines = fr.length + fc.length;
    const pts = Math.floor(lines * 100 * (lines > 1 ? lines : 1) * (State.streak > 1 ? State.streak * 0.5 : 1) * State.level);
    addScore(pts);
    GlobalStats.linesCleared += lines;
    if (State.gameMode === 'adventure') { State.adventure.sessionLines += lines; checkAdv(); }
    spawnText(`+${pts}`, lastX, lastY, '#00d2ff', 40);

    let earnedCoins = lines * 5;
    if (lines > 1) earnedCoins += lines * 5;
    if (State.streak > 1) earnedCoins += State.streak * 2;
    GlobalStats.coins += earnedCoins;

    spawnCoinAnimation(lastX, lastY, earnedCoins);
    SaveManager.saveGlobalStats();

    if (lines > 1) {
        spawnText(`${lines}X COMBO!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#FFF', 80, 'combo');
    }
}

export function checkAdv() {
    if (State.gameMode !== 'adventure') return;
    const l = ADVENTURE_LEVELS[State.adventure.levelId];
    let c = 0;
    if (l.goalType === 'lines') c = State.adventure.sessionLines;
    else if (l.goalType === 'score') c = State.score;
    else c = State.adventure.sessionBlocks;
    State.adventure.progress = c; updateHUD();
    if (c >= l.target) {
        State.isEnding = true; AudioSys.sfx.levelup();
        if (GlobalStats.adventureMaxLevel === State.adventure.levelId) GlobalStats.adventureMaxLevel++;
        SaveManager.saveGlobalStats();
        triggerGO("Level Cleared!");
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
    if (State.tutorial.active) return;
    if (State.queue.every(p => p === null)) { fillQueue(); return; }
    let cm = false;
    for (let p of State.queue) if (p) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (canPlace(p, x, y)) cm = true;
    if (!cm) {
        if (State.gameMode === 'zen') {
            showToast("Zen Refresh...", true);
            setTimeout(() => {
                State.grid = Array(8).fill(null).map(() => Array(8).fill(null));
                fillQueue(false); // New pieces too
                AudioSys.sfx.levelup();
                updateHUD();
            }, 1000);
        }
        else triggerGO("No More Moves!");
    }
}

export function triggerGO(msg: string) {
    State.isGameOver = true;
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
        if (title) title.innerText = msg;

        // Phase 4: Refined Game Over (Stats summary)
        const summary = document.createElement('div');
        summary.className = 'glass-panel';
        summary.style.marginTop = '20px';
        summary.innerHTML = `
            <div style="font-size:14px; opacity:0.7; margin-bottom:10px">SESSION STATS</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                <div>Blocks: <b>${GlobalStats.blocksPlaced}</b></div>
                <div>Lines: <b>${GlobalStats.linesCleared}</b></div>
            </div>
        `;
        const content = go.querySelector('.overlay-content');
        if (content) {
            const existing = content.querySelector('.summary-panel');
            if (existing) existing.remove();
            summary.classList.add('summary-panel');
            content.insertBefore(summary, document.getElementById('btn-restart'));
        }
    }

    const inputOverlay = document.getElementById('input-overlay');
    const inputScore = document.getElementById('input-score');

    if (State.score > 0 && (State.leaderboard.length < 5 || State.score > State.leaderboard[State.leaderboard.length - 1].score)) {
        if (inputOverlay) inputOverlay.classList.remove('hidden');
        if (inputScore) inputScore.innerText = State.score.toString();
    } else {
        if (go) go.classList.remove('hidden');
    }
}

export function checkLvl(l: number) {
    State.linesClearedTotal += l;
    const nl = Math.floor(State.linesClearedTotal / 10) + 1;
    if (nl > State.level) {
        State.level = nl;
        GlobalStats.inventory.hammer++;
        if (nl % 3 === 0) GlobalStats.inventory.bomb++;
        updateTools();
        AudioSys.sfx.levelup();
        const indicator = document.getElementById('level-up-indicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 1500);
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
    State.particles = []; State.floatingTexts = [];
    State.clearingRows = []; State.clearingCols = []; State.activeTool = null; State.previousMove = null;

    const header = document.getElementById('game-header');
    if (header) header.classList.remove('hidden');
    document.body.classList.add('in-game');

    if (mode === 'zen') State.gameMode = 'zen';
    else if (mode === 'adventure') {
        State.gameMode = 'adventure';
        State.adventure.levelId = lvlIdx; State.adventure.progress = 0;
        State.adventure.sessionBlocks = 0; State.adventure.sessionLines = 0;
        State.level = Math.floor(lvlIdx / 3) + 1; // Difficulty scales with levels
    }
    else if (mode === 'bomb') {
        State.gameMode = 'bomb';
        State.bombCounter = 5; // More intense
    }
    else if (mode !== 'resume') State.gameMode = 'classic';

    State.bgShapes = [];
    for (let i = 0; i < 25; i++) {
        State.bgShapes.push({
            x: Math.random() * 800, y: Math.random() * 1200,
            s: 20 + Math.random() * 80,
            vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
            rot: Math.random() * 6, vr: (Math.random() - .5) * .01,
            c: PALETTES[0][Math.floor(Math.random() * 5)]
        });
    }

    const modeKey = (State.gameMode === 'classic' ? STORAGE_KEY : STORAGE_KEY + '-' + State.gameMode);
    State.highScore = parseInt(localStorage.getItem(modeKey) || '0');

    if (mode === 'resume' && SaveManager.loadGame()) {
        State.tutorial.active = false; positionQueue(); updateHUD(); showToast("Welcome Back!");
    } else {
        State.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        State.score = 0; State.displayedScore = 0; State.level = 1; State.streak = 0; State.bombCounter = 8;
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
            if (State.gameMode === 'adventure') showToast(ADVENTURE_LEVELS[State.adventure.levelId].title, true);
        }
        updateHUD();
    }
    updateTools();
    AudioSys.startMusic();
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

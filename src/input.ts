import {
    State, GlobalStats, Piece, AudioSys, SaveManager,
    initGame, buyItem, performUndo, performReroll,
    CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE,
    canPlace, placePiece, checkGO, setupTutorial, positionQueue,
    THEMES, ADVENTURE_LEVELS, ACHIEVEMENTS,
    COLS, ROWS
} from './game';
import { gameLoop } from './render';

export function setupInput(canvas: HTMLCanvasElement) {
    const getPos = (e: any) => {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - r.left;
        const y = (e.clientY || e.touches[0].clientY) - r.top;
        return { x: x * (CANVAS_WIDTH / r.width), y: y * (CANVAS_HEIGHT / r.height) };
    };

    const handleStart = (e: any) => {
        if (State.isGameOver || State.isPaused) return;
        if (e.type === 'touchstart') e.preventDefault();
        AudioSys.init(); AudioSys.startMusic();
        const p = getPos(e); State.touchStartPos = p; State.touchStartTime = Date.now();

        if (State.activeTool) {
            const gx = Math.floor((p.x - GRID_OFFSET_X) / CELL_SIZE), gy = Math.floor((p.y - GRID_OFFSET_Y) / CELL_SIZE);
            if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) {
                if (State.activeTool === 'hammer' && State.grid[gy][gx]) {
                    State.grid[gy][gx] = null; GlobalStats.inventory.hammer--;
                    State.activeTool = null; updateToolsLocal(); SaveManager.saveGame(); return;
                } else if (State.activeTool === 'bomb') {
                    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) if (gy + r >= 0 && gy + r < 8 && gx + c >= 0 && gx + c < 8) State.grid[gy + r][gx + c] = null;
                    GlobalStats.inventory.bomb--; State.activeTool = null; updateToolsLocal(); SaveManager.saveGame(); return;
                }
            }
        }

        State.queue.forEach((q, i) => {
            if (q) {
                const w = q.cols * CELL_SIZE * q.scale, h = q.rows * CELL_SIZE * q.scale;
                if (p.x > q.x - w / 2 - 20 && p.x < q.x + w / 2 + 20 && p.y > q.y - h / 2 - 20 && p.y < q.y + h / 2 + 20) {
                    State.draggedPieceIndex = i; q.isDragging = true; q.scale = 1; q.y -= 100; AudioSys.sfx.pickup();
                }
            }
        });
    };

    const handleMove = (e: any) => {
        if (State.draggedPieceIndex !== -1) {
            if (e.type === 'touchmove') e.preventDefault();
            const p = getPos(e);
            const q = State.queue[State.draggedPieceIndex];
            if (q) { q.x = p.x; q.y = p.y - 100; }
        }
    };

    const handleEnd = () => {
        if (State.draggedPieceIndex !== -1) {
            const q = State.queue[State.draggedPieceIndex];
            if (q) {
                if (Date.now() - State.touchStartTime < 250 && Math.hypot(q.x - State.touchStartPos.x, q.y + 100 - State.touchStartPos.y) < 20) {
                    q.rotate(); AudioSys.sfx.rotate(); q.isDragging = false; q.x = q.baseX; q.y = q.baseY; State.draggedPieceIndex = -1; return;
                }
                const w = q.cols * CELL_SIZE;
                const h = q.rows * CELL_SIZE;
                const gx = Math.round((q.x - w / 2 - GRID_OFFSET_X) / CELL_SIZE), gy = Math.round((q.y - h / 2 - GRID_OFFSET_Y) / CELL_SIZE);
                if (canPlace(q, gx, gy)) {
                    placePiece(q, gx, gy); State.queue[State.draggedPieceIndex] = null;
                    if (State.tutorial.active && State.tutorial.step < 2) { State.tutorial.step++; setupTutorial(State.tutorial.step); } else checkGO();
                } else { AudioSys.sfx.invalid(); q.isDragging = false; q.x = q.baseX; q.y = q.baseY; q.scale = q.targetScaleQueue; }
            }
            State.draggedPieceIndex = -1;
        }
    };

    canvas.addEventListener('mousedown', handleStart); canvas.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false }); canvas.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleEnd);

    setupUIListeners();
}

function setupUIListeners() {
    const setClick = (id: string, fn: () => void) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };

    setClick('btn-play-menu', () => {
        document.getElementById('menu-overlay')?.classList.add('hidden');
        import('./main').then(m => m.checkDailyRewards());
        document.getElementById('mode-overlay')?.classList.remove('hidden');
    });

    setClick('btn-mode-back', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        document.getElementById('menu-overlay')?.classList.remove('hidden');
    });

    setClick('btn-mode-classic', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        startGame('new');
    });

    setClick('btn-mode-zen', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        startGame('zen');
    });

    setClick('btn-mode-bomb', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        startGame('bomb');
    });

    setClick('btn-mode-adventure', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        document.getElementById('adventure-overlay')?.classList.remove('hidden');
        renderAdvInInput();
    });

    setClick('btn-adventure-back', () => {
        document.getElementById('adventure-overlay')?.classList.add('hidden');
        document.getElementById('mode-overlay')?.classList.remove('hidden');
    });

    setClick('btn-resume', () => {
        document.getElementById('menu-overlay')?.classList.add('hidden');
        startGame('resume');
    });

    setClick('btn-home', () => {
        document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
        document.getElementById('menu-overlay')?.classList.remove('hidden');
        document.getElementById('game-header')?.classList.add('hidden');
        document.body.classList.remove('in-game');
        if (localStorage.getItem('blockriser-state')) document.getElementById('btn-resume')?.classList.remove('hidden');
    });

    setClick('btn-leaderboard', () => {
        document.getElementById('leaderboard-overlay')?.classList.remove('hidden');
        const l = document.getElementById('leaderboard-list');
        if (l) {
            l.innerHTML = '';
            State.leaderboard.forEach((e, i) => l.innerHTML += `<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid rgba(255,255,255,0.1)"><b>${i + 1}</b><span>${e.name}</span><span>${e.score}</span></div>`);
            if (!State.leaderboard.length) l.innerHTML = '<div style="text-align:center;padding:20px;opacity:0.5">No Records</div>';
        }
    });

    setClick('btn-close-leaderboard', () => document.getElementById('leaderboard-overlay')?.classList.add('hidden'));

    setClick('btn-stats', () => {
        document.getElementById('stats-overlay')?.classList.remove('hidden');
        const sg = document.getElementById('stats-grid');
        if (sg) sg.innerHTML = `<div class="stat-box"><div class="stat-val">${GlobalStats.gamesPlayed}</div><div class="stat-lbl">Games</div></div><div class="stat-box"><div class="stat-val">${GlobalStats.linesCleared}</div><div class="stat-lbl">Lines</div></div>`;
        const al = document.getElementById('achievements-grid');
        if (al) {
            al.innerHTML = '';
            ACHIEVEMENTS.forEach(a => {
                const u = GlobalStats.unlockedAchievements.includes(a.id);
                al.innerHTML += `<div class="ach-card ${u ? 'unlocked' : ''}"><div class="ach-icon">${u ? a.icon : '🔒'}</div><div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div></div>`;
            });
        }
    });

    setClick('btn-close-stats', () => document.getElementById('stats-overlay')?.classList.add('hidden'));

    setClick('btn-themes', () => {
        document.getElementById('themes-overlay')?.classList.remove('hidden');
        const g = document.getElementById('theme-grid');
        if (g) {
            g.innerHTML = '';
            THEMES.forEach(t => {
                const l = State.highScore < t.unlock;
                const d = document.createElement('div'); d.className = 'theme-card ' + (l ? 'locked' : '') + (State.currentTheme === t.id ? ' selected' : '');
                d.innerHTML = `<div class="theme-preview" style="background:${l ? '#333' : 'linear-gradient(45deg,#00c6ff,#0072ff)'}"></div><div>${t.name}</div><div style="font-size:10px;opacity:0.6">${l ? 'Score ' + t.unlock : 'Unlocked'}</div>`;
                d.onclick = () => { if (!l) { State.currentTheme = t.id; SaveManager.saveGame(); document.getElementById('themes-overlay')?.classList.add('hidden'); } };
                g.appendChild(d);
            });
        }
    });

    setClick('btn-close-themes', () => document.getElementById('themes-overlay')?.classList.add('hidden'));

    setClick('btn-settings', () => document.getElementById('settings-overlay')?.classList.remove('hidden'));
    setClick('btn-close-settings', () => document.getElementById('settings-overlay')?.classList.add('hidden'));
    setClick('btn-reset-data', () => { if (confirm('Reset all progress?')) { localStorage.clear(); location.reload(); } });

    setClick('btn-shop', () => { document.getElementById('shop-overlay')?.classList.remove('hidden'); import('./game').then(m => m.updateCoinDisplays()); });
    setClick('btn-close-shop', () => document.getElementById('shop-overlay')?.classList.add('hidden'));

    setClick('btn-hammer', () => { if (GlobalStats.inventory.hammer) { State.activeTool = State.activeTool === 'hammer' ? null : 'hammer'; updateToolsLocal(); } });
    setClick('btn-bomb', () => { if (GlobalStats.inventory.bomb) { State.activeTool = State.activeTool === 'bomb' ? null : 'bomb'; updateToolsLocal(); } });
    setClick('btn-undo', () => performUndo());
    setClick('btn-reroll', () => performReroll());

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.onclick = () => { State.isPaused = true; document.getElementById('pause-overlay')?.classList.remove('hidden'); };
    setClick('btn-pause-resume', () => { State.isPaused = false; document.getElementById('pause-overlay')?.classList.add('hidden'); const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement; if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) gameLoop(ctx); } });
    setClick('btn-pause-quit', () => { document.getElementById('btn-home')?.click(); });

    setClick('btn-restart', () => {
        document.getElementById('gameover-overlay')?.classList.add('hidden');
        startGame(State.gameMode === 'classic' ? 'new' : State.gameMode);
    });

    setClick('btn-submit-score', () => {
        const input = document.getElementById('initials-input') as HTMLInputElement;
        const n = input.value.toUpperCase() || 'AAA';
        State.leaderboard.push({ name: n, score: State.score, mode: State.gameMode });
        State.leaderboard.sort((a, b) => b.score - a.score); if (State.leaderboard.length > 5) State.leaderboard.pop();
        SaveManager.saveLeaderboard();
        document.getElementById('input-overlay')?.classList.add('hidden');
        document.getElementById('gameover-overlay')?.classList.remove('hidden');
        document.getElementById('btn-leaderboard')?.click();
    });

    // Settings Toggles
    const toggleSetting = (k: any, id: string) => {
        if (k === 'gameSpeed') {
            State.settings.gameSpeed = (State.settings.gameSpeed + 1) % 3;
            const el = document.getElementById(id);
            if (el) el.innerText = ['NORM', 'FAST', 'INSANE'][State.settings.gameSpeed];
        } else {
            (State.settings as any)[k] = !(State.settings as any)[k];
            const el = document.getElementById(id);
            if (el) {
                el.className = 'btn-toggle ' + ((State.settings as any)[k] ? 'on' : '');
                el.innerText = (State.settings as any)[k] ? (k === 'highQuality' ? 'HIGH' : 'ON') : 'OFF';
            }
            if (k === 'music') {
                if (State.settings.music) AudioSys.startMusic();
                else AudioSys.stopMusic();
            }
        }
    };

    setClick('btn-speed-toggle', () => toggleSetting('gameSpeed', 'btn-speed-toggle'));
    setClick('btn-music-toggle', () => toggleSetting('music', 'btn-music-toggle'));
    setClick('btn-sfx-toggle', () => toggleSetting('sfx', 'btn-sfx-toggle'));
    setClick('btn-gfx-toggle', () => toggleSetting('highQuality', 'btn-gfx-toggle'));
    setClick('btn-vib-toggle', () => toggleSetting('vibration', 'btn-vib-toggle'));

    // Attach shop global function
    (window as any).buyItem = (type: any, price: any) => import('./game').then(m => m.buyItem(type, price));
}

function startGame(mode: string, lvlIdx: number = 0) {
    initGame(mode, lvlIdx);
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) gameLoop(ctx);
}

function renderAdvInInput() {
    const l = document.getElementById('adventure-list');
    if (l) {
        l.innerHTML = '';
        ADVENTURE_LEVELS.forEach((lv, i) => {
            const d = document.createElement('div');
            d.className = 'level-node ' + (i > GlobalStats.adventureMaxLevel ? 'locked' : (i < GlobalStats.adventureMaxLevel ? 'completed' : 'active'));
            d.innerHTML = `<div class="level-num">${i + 1}</div><div class="level-info"><div class="level-title">${lv.title}</div><div class="level-goal">${lv.desc}</div></div>`;
            d.onclick = () => { if (i <= GlobalStats.adventureMaxLevel) { document.getElementById('adventure-overlay')?.classList.add('hidden'); startGame('adventure', i); } };
            l.appendChild(d);
        });
    }
}

function updateToolsLocal() {
    import('./game').then(m => m.updateTools());
}

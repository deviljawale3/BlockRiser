import {
    State, GlobalStats, Piece, AudioSys, SaveManager,
    initGame, buyItem, performUndo, performReroll, vibrate, showToast,
    CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE,
    canPlace, placePiece, checkGO, setupTutorial, positionQueue,
    THEMES, ADVENTURE_LEVELS, ACHIEVEMENTS,
    COLS, ROWS
} from './game';
import { gameLoop, spawnEffect } from './render';

export function setupInput(canvas: HTMLCanvasElement) {
    const getPos = (e: any) => {
        const r = canvas.getBoundingClientRect();
        // Handle both touch and mouse events consistently
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const x = clientX - r.left;
        const y = clientY - r.top;
        return { x: x * (CANVAS_WIDTH / r.width), y: y * (CANVAS_HEIGHT / r.height) };
    };

    const handleStart = (e: any) => {
        // Allow resuming if paused by tapping
        if (State.isPaused) {
            State.isPaused = false;
            document.getElementById('pause-overlay')?.classList.add('hidden');
            gameLoop(canvas.getContext('2d')!);
            return;
        }

        if (State.isGameOver) return;

        // Prevent default only for potential gestures, allow standard UI interaction
        if (e.type === 'touchstart') e.preventDefault();

        AudioSys.init(); AudioSys.startMusic();
        const p = getPos(e);
        State.touchStartPos = p;
        State.touchStartTime = Date.now();

        // Check active tools (Hammer/Bomb)
        if (State.activeTool) {
            const gx = Math.floor((p.x - GRID_OFFSET_X) / CELL_SIZE), gy = Math.floor((p.y - GRID_OFFSET_Y) / CELL_SIZE);
            if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) {
                if (State.activeTool === 'hammer' && State.grid[gy][gx]) {
                    spawnEffect('hammer', gx, gy);
                    State.grid[gy][gx] = null; GlobalStats.inventory.hammer--;
                    State.activeTool = null; updateToolsLocal(); SaveManager.saveGame(); return;
                } else if (State.activeTool === 'bomb') {
                    spawnEffect('tnt', gx, gy);
                    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) if (gy + r >= 0 && gy + r < 8 && gx + c >= 0 && gx + c < 8) State.grid[gy + r][gx + c] = null;
                    GlobalStats.inventory.bomb--; State.activeTool = null; updateToolsLocal(); SaveManager.saveGame(); return;
                }
            }
            State.activeTool = null; // Cancel tool if missed
            updateToolsLocal();
            return;
        }

        // Use reverse loop to pick up top-most rendered piece first (if any overlap)
        for (let i = State.queue.length - 1; i >= 0; i--) {
            const q = State.queue[i];
            if (q && !q.isDragging) { // Ensure not already dragging (multi-touch safety)
                const w = q.cols * CELL_SIZE * q.scale;
                const h = q.rows * CELL_SIZE * q.scale;
                const hitPad = 80;

                if (p.x > q.x - w / 2 - hitPad && p.x < q.x + w / 2 + hitPad &&
                    p.y > q.y - h / 2 - hitPad && p.y < q.y + h / 2 + hitPad) {

                    // Double Tap Detect
                    if (Date.now() - State.touchStartTime < 300 && State.draggedPieceIndex === i) {
                        q.rotate(); AudioSys.sfx.rotate();
                        return;
                    }

                    State.draggedPieceIndex = i;
                    q.isDragging = true;
                    q.scale = 1;
                    q.y -= 80;
                    AudioSys.sfx.pickup();
                    vibrate(20);
                    break;
                }
            }
        }
    };

    const handleMove = (e: any) => {
        if (State.draggedPieceIndex !== -1) {
            if (e.type === 'touchmove') e.preventDefault();
            const p = getPos(e);
            const q = State.queue[State.draggedPieceIndex];
            if (q) {
                q.x = p.x; q.y = p.y - 80;

                // Calculate phantom position (Architect's Vision)
                const w = q.cols * CELL_SIZE;
                const h = q.rows * CELL_SIZE;
                const gx = Math.round((q.x - w / 2 - GRID_OFFSET_X) / CELL_SIZE), gy = Math.round((q.y - h / 2 - GRID_OFFSET_Y) / CELL_SIZE);
                if (canPlace(q, gx, gy)) {
                    State.phantomPos = { x: q.x, y: q.y, gx, gy };
                } else {
                    State.phantomPos = null;
                }

                // Drag Trail Particles (Moved from render loop for performance)
                if (!State.isClearing && Math.random() < 0.3) {
                    State.particles.push({
                        x: q.x + (Math.random() - 0.5) * 40,
                        y: q.y + (Math.random() - 0.5) * 40,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 0.25,
                        c: q.color,
                        type: 'spark',
                        s: Math.random() * 6 + 2
                    });
                }
            }
        }
    };

    const handleEnd = () => {
        if (State.draggedPieceIndex !== -1) {
            const q = State.queue[State.draggedPieceIndex];
            if (q) {
                if (Date.now() - State.touchStartTime < 250 && Math.hypot(q.x - State.touchStartPos.x, q.y + 80 - State.touchStartPos.y) < 20) {
                    q.rotate(); AudioSys.sfx.rotate(); q.isDragging = false; q.x = q.baseX; q.y = q.baseY; State.draggedPieceIndex = -1; return;
                }
                const w = q.cols * CELL_SIZE;
                const h = q.rows * CELL_SIZE;
                const gx = Math.round((q.x - w / 2 - GRID_OFFSET_X) / CELL_SIZE), gy = Math.round((q.y - h / 2 - GRID_OFFSET_Y) / CELL_SIZE);
                State.phantomPos = null; // Clear vision

                if (canPlace(q, gx, gy)) {
                    placePiece(q, gx, gy, State.draggedPieceIndex);
                    State.screenShake = 15;
                    vibrate(100);
                    if (State.tutorial.active && State.tutorial.step < 2) {
                        State.tutorial.step++;
                        setupTutorial(State.tutorial.step);
                    }
                } else { AudioSys.sfx.invalid(); q.isDragging = false; q.x = q.baseX; q.y = q.baseY; q.scale = q.targetScaleQueue; }
                State.draggedPieceIndex = -1;
            }
        }
    };

    const handleCancel = () => {
        if (State.draggedPieceIndex !== -1) {
            const q = State.queue[State.draggedPieceIndex];
            if (q) {
                q.isDragging = false; q.x = q.baseX; q.y = q.baseY; q.scale = q.targetScaleQueue;
            }
            State.draggedPieceIndex = -1;
            State.phantomPos = null;
        }
    };

    canvas.addEventListener('mousedown', handleStart); canvas.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false }); canvas.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleEnd);
    canvas.addEventListener('touchcancel', handleCancel);

    setupUIListeners();
}



let selectedMode = 'classic';
let selectedLevel = 0;

function renderPolicies() {
    const container = document.getElementById('policy-list');
    if (!container) return;
    import('./game').then(m => {
        container.innerHTML = m.POLICIES.map(p => `
            <div class="booster-card" id="pol-${p.id}">
                <div class="booster-icon-wrap">${p.icon}</div>
                <div class="booster-info">
                    <div class="booster-title">${p.name}</div>
                    <div class="booster-desc">${p.desc}</div>
                </div>
            </div>
        `).join('');

        m.POLICIES.forEach(p => {
            const el = document.getElementById(`pol-${p.id}`);
            if (el) el.onclick = () => {
                AudioSys.init();
                m.State.activePolicy = p.id as any;
                if (p.id === 'taxShield') m.State.bailoutsLeft = 3;
                document.getElementById('policy-overlay')?.classList.add('hidden');
                startGame(selectedMode, selectedLevel);
            };
        });
    });
}

const showPolicy = (mode: string, lvl: number = 0) => {
    selectedMode = mode;
    selectedLevel = lvl;
    document.getElementById('policy-overlay')?.classList.remove('hidden');
    renderPolicies();
};

function setupUIListeners() {
    const setClick = (id: string, fn: () => void) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };

    setClick('btn-play-menu', () => {
        AudioSys.init();
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
        showPolicy('classic');
    });

    setClick('btn-mode-zen', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        showPolicy('zen');
    });

    setClick('btn-mode-bomb', () => {
        document.getElementById('mode-overlay')?.classList.add('hidden');
        showPolicy('bomb');
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

    setClick('btn-tutorial', () => {
        AudioSys.init();
        document.getElementById('tutorial-overlay')?.classList.remove('hidden');
    });

    setClick('btn-close-tutorial', () => {
        document.getElementById('tutorial-overlay')?.classList.add('hidden');
    });

    setClick('btn-policy-skip', () => {
        document.getElementById('policy-overlay')?.classList.add('hidden');
        import('./game').then(m => {
            m.State.activePolicy = null;
        });
        startGame(selectedMode, selectedLevel);
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
        renderLeaderboard('local');
    });

    setClick('btn-tab-local', () => renderLeaderboard('local'));
    setClick('btn-tab-global', () => renderLeaderboard('global'));

    setClick('btn-close-leaderboard', () => document.getElementById('leaderboard-overlay')?.classList.add('hidden'));


    setClick('btn-close-stats', () => document.getElementById('stats-overlay')?.classList.add('hidden'));

    setClick('btn-themes', () => {
        document.getElementById('themes-overlay')?.classList.remove('hidden');
        const g = document.getElementById('theme-grid');
        if (g) {
            g.innerHTML = '';
            THEMES.forEach(t => {
                const l = State.highScore < t.unlock;
                const active = State.currentTheme === t.id;
                const d = document.createElement('div');
                d.className = 'theme-box ' + (l ? 'locked' : '') + (active ? ' active' : '');
                d.setAttribute('data-theme', t.id);

                // Color preview logic
                let previewColor = 'linear-gradient(135deg,#00c6ff,#0072ff)';
                if (l) previewColor = '#555';
                else if (t.id === 'pixel') previewColor = '#FFF59D'; // Yellow for Pine
                else if (t.id === 'neon') previewColor = '#FF3D00'; // Red/Orange for Mahogany
                else if (t.id === 'abyss') previewColor = '#FFD700'; // Gold for Teak
                else if (t.id === 'inferno') previewColor = '#EEEEEE'; // White for Birch
                else if (t.id === 'spectral') previewColor = '#FFA726'; // Orange for Maple
                else if (t.id === 'midnight') previewColor = '#212121'; // Black for Ebony
                else if (t.id === 'eclipse') previewColor = '#D32F2F'; // Red for Cherry
                else if (t.id === 'obsidian') previewColor = '#5D4037'; // Brown for Walnut

                d.innerHTML = `
                    <div class="color-gem" style="background:${previewColor}"></div>
                    <div class="theme-content-wrap">
                        <div class="theme-name">${t.name}</div>
                        <div class="theme-unlock">${l ? 'Score ' + t.unlock : (active ? 'SELECTED' : 'UNLOCKED')}</div>
                    </div>
                `;
                d.onclick = () => { if (!l) { State.currentTheme = t.id; SaveManager.saveGame(); document.getElementById('themes-overlay')?.classList.add('hidden'); } };
                g.appendChild(d);
            });
        }
    });

    setClick('btn-close-themes', () => document.getElementById('themes-overlay')?.classList.add('hidden'));

    setClick('btn-settings', () => document.getElementById('settings-overlay')?.classList.remove('hidden'));
    setClick('btn-close-settings', () => document.getElementById('settings-overlay')?.classList.add('hidden'));
    setClick('btn-reset-data', () => { if (confirm('Reset all progress?')) { localStorage.clear(); location.reload(); } });

    setClick('btn-shop', () => {
        document.getElementById('shop-overlay')?.classList.remove('hidden');
        import('./game').then(m => {
            m.updateCoinDisplays();
            renderPolicyShop();
        });
    });
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
    (window as any).buyExtraLife = () => import('./game').then(m => m.buyExtraLife());
    (window as any).setSkin = (skin: any) => import('./game').then(m => {
        m.State.blockSkin = skin;
        m.showToast(`Skin set to ${skin.toUpperCase()}`);
        m.SaveManager.saveGame();
    });

    setClick('btn-close-upgrades', () => document.getElementById('upgrades-overlay')?.classList.add('hidden'));

    // Global Upgrade UI Updater
    (window as any).updateUpgradeUI = () => {
        const list = document.getElementById('upgrades-list');
        if (!list) return;
        import('./game').then(m => {
            list.innerHTML = '';
            m.UPGRADES.forEach(u => {
                const cur = (GlobalStats.upgrades as any)[u.id] || 0;
                const cost = u.costs[cur] || 'MAX';
                const div = document.createElement('div');
                div.className = 'shop-item upgrade-card upgrade-item';
                div.setAttribute('data-upgrade', u.id); // Add data attribute for CSS targeting
                div.innerHTML = `
                    <div class="upgrade-info-wrap">
                        <div class="upgrade-name">${u.name}</div>
                        <div class="upgrade-desc">${u.desc}</div>
                    </div>
                    <div class="upgrade-level">Lvl: ${cur}/${u.maxLevel}</div>
                    <div class="upgrade-btn-wrap">
                        <button class="btn-3d btn-green upgrade-cost" style="font-size:10px; padding:6px 10px" ${cost === 'MAX' ? 'disabled' : ''}>
                            ${cost === 'MAX' ? 'MAXED' : cost + ' 🟡'}
                        </button>
                    </div>
                `;
                const btn = div.querySelector('button');
                if (btn && cost !== 'MAX') btn.onclick = () => m.buyUpgrade(u.id);
                list.appendChild(div);
            });
        });
    };

    setClick('btn-stats', () => {
        document.getElementById('stats-overlay')?.classList.remove('hidden');
        (window as any).updateUpgradeUI();
        const sg = document.getElementById('stats-grid');
        if (sg) {
            const time = GlobalStats.timePlayed || 0;
            const hrs = Math.floor(time / 3600);
            const mins = Math.floor((time % 3600) / 60);
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

            const stats = [
                { l: 'Games', v: GlobalStats.gamesPlayed },
                { l: 'Lines', v: GlobalStats.linesCleared },
                { l: 'Blocks', v: GlobalStats.blocksPlaced },
                { l: 'Total Score', v: (GlobalStats.totalScore || 0).toLocaleString() },
                { l: 'Best Score', v: (GlobalStats.allTimeHighScore || 0).toLocaleString() },
                { l: 'Total Gold', v: (GlobalStats.totalGoldEarned || 0).toLocaleString() + ' 🟡' },
                { l: 'Combo', v: GlobalStats.maxCombo + 'x' },
                { l: 'Streak', v: GlobalStats.maxStreak },
                { l: 'Time', v: timeStr }
            ];
            sg.innerHTML = stats.map(s => `
                <div class="stat-box">
                    <div class="stat-value">${s.v}</div>
                    <div class="stat-label">${s.l}</div>
                </div>
            `).join('');
        }
        const al = document.getElementById('achievements-grid');
        if (al) {
            al.innerHTML = '';
            ACHIEVEMENTS.forEach(a => {
                const u = GlobalStats.unlockedAchievements.includes(a.id);
                al.innerHTML += `
                    <div class="ach-card ${u ? 'unlocked' : ''}">
                        <div class="ach-icon">${u ? a.icon : '🔒'}</div>
                        <div class="ach-info">
                            <div class="ach-name">${a.name}</div>
                            <div class="ach-desc">${a.desc}</div>
                        </div>
                    </div>`;
            });
        }
    });

    setClick('btn-hq', () => {
        document.getElementById('hq-overlay')?.classList.remove('hidden');
        renderHQ();
    });
    setClick('btn-close-hq', () => document.getElementById('hq-overlay')?.classList.add('hidden'));

    setClick('btn-world', () => {
        document.getElementById('world-overlay')?.classList.remove('hidden');
        renderWorld();
    });
    setClick('btn-close-world', () => document.getElementById('world-overlay')?.classList.add('hidden'));
}

function renderHQ() {
    import('./game').then(m => {
        const status = document.getElementById('hq-status');
        const income = document.getElementById('hq-income');
        const list = document.getElementById('hq-upgrades');
        if (!status || !income || !list) return;

        const current = m.HQ_UPGRADES[GlobalStats.hqLevel - 1] || { name: 'New Collector', incomeRate: 0 };
        status.innerText = `Status: ${current.name}`;
        income.innerText = `${current.incomeRate} 🟡 / hr`;

        list.innerHTML = '';
        m.HQ_UPGRADES.forEach((u, i) => {
            const locked = i > GlobalStats.hqLevel;
            const purchased = i < GlobalStats.hqLevel;
            const div = document.createElement('div');
            // Using existing shop-item class but enhancing content structure
            const bgMap: any = { box: 'hq_bg_box.png', chest: 'hq_bg_chest.png', room: 'hq_bg_room.png', vault: 'hq_bg_paradise.png' };
            const bg = bgMap[u.id];

            div.className = `shop-item upgrade-card ${locked ? 'locked' : ''} ${purchased ? 'purchased' : ''}`;
            if (bg) {
                div.style.setProperty('background', `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('/${bg}')`, 'important');
                div.style.setProperty('background-size', 'cover', 'important');
                div.style.setProperty('background-position', 'center', 'important');
                div.style.border = '2px solid rgba(255,255,255,0.1)';
            }

            div.innerHTML = `
                <div style="font-weight:900; font-size:18px; margin-bottom:5px; color:#FFE0B2; text-shadow: 0 2px 4px rgba(0,0,0,0.8)">${u.name}</div>
                <div style="font-size:14px; opacity:0.9; margin-bottom:10px; color:#FFF; text-shadow: 0 1px 2px rgba(0,0,0,0.8)">+${u.incomeRate} 🟡 / hr</div>
                <button class="btn-secondary" style="margin-top:auto; width:100%; font-size:12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3)" ${purchased || locked ? 'disabled' : ''}>
                    ${purchased ? 'OWNED' : (locked ? 'LOCKED' : u.cost + ' 🟡')}
                </button>
            `;
            const btn = div.querySelector('button');
            if (btn && !purchased && !locked) {
                btn.onclick = () => {
                    if (GlobalStats.coins >= u.cost) {
                        GlobalStats.coins -= u.cost;
                        GlobalStats.hqLevel = i + 1;
                        AudioSys.sfx.tada();
                        renderHQ();
                        SaveManager.saveGlobalStats();
                    }
                };
            }
            list.appendChild(div);
        });

        // Render Acquisitions Gallery - Horizontal Scroll Clean
        const gallery = document.getElementById('acquisitions-gallery');
        if (gallery) {
            gallery.innerHTML = '';
            m.ACQUISITIONS.forEach(acq => {
                const unlocked = GlobalStats.unlockedAcquisitions.includes(acq.id);
                const div = document.createElement('div');
                div.className = `collection-item ${unlocked ? '' : 'locked'}`;
                div.innerHTML = `
                    <div class="collect-icon">${unlocked ? acq.icon : '🔒'}</div>
                    <div class="collect-name">${unlocked ? acq.name : '???'}</div>
                `;
                if (unlocked) {
                    div.onclick = () => showToast(acq.name + ": " + acq.desc, true);
                }
                gallery.appendChild(div);
            });
        }
    });
}

function renderWorld() {
    import('./game').then(m => {
        const list = document.getElementById('city-list');
        if (!list) return;
        list.innerHTML = '';
        m.CITIES.forEach(c => {
            const unlocked = GlobalStats.unlockedCities.includes(c.id);
            const active = GlobalStats.currentCity === c.id;
            const div = document.createElement('div');
            div.className = `level-node ${unlocked ? 'completed' : 'locked'} ${active ? 'active' : ''}`;
            div.setAttribute('data-id', c.id);
            div.innerHTML = `
                <div class="level-info" style="align-items: center; justify-content: center; text-align: center;">
                    <div class="level-title" style="font-weight: 900; font-size: 20px; letter-spacing: 2px;">${c.name.toUpperCase()}</div>
                    <div class="level-goal" style="font-size: 12px; font-weight: 700; background: rgba(0,0,0,0.4); padding: 4px 12px; border-radius: 20px; margin-top: 8px;">${c.gridSize}x${c.gridSize} GRID | X${c.bonus} BONUS</div>
                    ${!unlocked ? `<div style="margin-top:10px; font-size: 14px; font-weight:800; color: #FFD54F;">${c.unlockCost} 🟡 REQUIRED</div>` : ''}
                </div>
            `;
            div.onclick = () => {
                if (unlocked) {
                    GlobalStats.currentCity = c.id;
                    State.activeCity = c.id;
                    showToast(`Traveling to ${c.name}...`);
                    SaveManager.saveGlobalStats();
                    renderWorld();
                } else if (GlobalStats.coins >= c.unlockCost) {
                    GlobalStats.coins -= c.unlockCost;
                    GlobalStats.unlockedCities.push(c.id);
                    AudioSys.sfx.tada();
                    renderWorld();
                    SaveManager.saveGlobalStats();
                }
            };
            list.appendChild(div);
        });
    });
}

function startGame(mode: string, lvlIdx: number = 0) {
    // UI Transitions
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    document.getElementById('game-header')?.classList.remove('hidden');
    document.body.classList.add('in-game');

    initGame(mode, lvlIdx);

    // Ensure canvas is ready and start game loop
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
        // Force a reflow to ensure canvas is ready
        canvas.offsetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Clear and redraw immediately
            ctx.clearRect(0, 0, 800, 1200);
            gameLoop(ctx);
        }
    }
}
(window as any).startGame = startGame;

function renderAdvInInput() {
    const l = document.getElementById('adventure-list');
    if (l) {
        l.innerHTML = '';
        ADVENTURE_LEVELS.forEach((lv, i) => {
            const status = i > GlobalStats.adventureMaxLevel ? 'locked' : (i < GlobalStats.adventureMaxLevel ? 'completed' : 'active');
            const d = document.createElement('div');
            d.className = `level-card ${status}`;

            // Assign backgrounds
            const bgImages = ['bg_1.png', 'bg_2.png', 'bg_3.png', 'bg_4.png', 'bg_5.png', 'bg_6.png'];
            let bgUrl = `/${bgImages[i % bgImages.length]}`;

            // Custom backgrounds for Nano Banana Edition & Boss Levels
            if (i === 6) bgUrl = '/bg_robot.svg';
            if (i === 7) bgUrl = '/bg_jungle.svg';
            if (i === 8) bgUrl = '/bg_hero.svg';
            if (i === 9 || i === 14) bgUrl = '/bg_master.svg';
            if (i === 10) bgUrl = '/bg_obsidian.svg'; // If it exists, else defualt

            d.style.backgroundImage = `url('${bgUrl}')`;

            let statusIcon = '🔒';
            let btnText = 'LOCKED';
            let btnClass = 'disabled';

            if (status === 'completed') { statusIcon = '⭐'; btnText = 'REPLAY'; btnClass = 'btn-secondary'; }
            if (status === 'active') { statusIcon = '▶️'; btnText = 'PLAY'; btnClass = 'btn-green'; }

            d.innerHTML = `
                <div class="level-header">
                    <div class="level-badge">${i + 1}</div>
                    <div class="level-stars">${status === 'completed' ? '⭐⭐⭐' : '☆☆☆'}</div>
                </div>
                <div class="level-content">
                    <div class="level-title">${lv.title}</div>
                    <div class="level-mission">
                        <span class="mission-icon">🎯</span>
                        ${lv.desc}
                    </div>
                    <div class="level-mission" style="margin-top:4px">
                        <span class="mission-icon">⚡</span>
                        ${lv.moves} MOVES
                    </div>
                </div>
                <div class="level-footer">
                    <span class="status-indicator ${status}">${status.toUpperCase()}</span>
                </div>
            `;

            if (status !== 'locked') {
                d.onclick = () => {
                    document.getElementById('adventure-overlay')?.classList.add('hidden');
                    showPolicy('adventure', i);
                };
            }
            l.appendChild(d);
        });
    }
}

function renderLeaderboard(tab: 'local' | 'global') {
    const list = document.getElementById('leaderboard-list');
    const localBtn = document.getElementById('btn-tab-local');
    const globalBtn = document.getElementById('btn-tab-global');
    if (!list || !localBtn || !globalBtn) return;

    localBtn.classList.toggle('active', tab === 'local');
    globalBtn.classList.toggle('active', tab === 'global');

    list.innerHTML = '';
    if (tab === 'local') {
        if (!State.leaderboard.length) {
            list.innerHTML = '<div style="text-align:center;padding:20px;opacity:0.5">No Local Records</div>';
        } else {
            State.leaderboard.forEach((e, i) => {
                list.innerHTML += `
                    <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid rgba(255,255,255,0.05); align-items:center">
                        <span style="font-weight:900; color:#FFD54F; width:30px">#${i + 1}</span>
                        <div style="flex:1; display:flex; flex-direction:column">
                            <span style="font-weight:700">${e.name}</span>
                            <span style="font-size:8px; opacity:0.5; text-transform:uppercase">${e.mode || 'classic'}</span>
                        </div>
                        <span style="font-family:'League Spartan'; font-weight:900">${e.score.toLocaleString()}</span>
                    </div>`;
            });
        }
    } else {
        // Mock Global High Scores (Live Cloud Sync Feel)
        const globalScores = [
            { name: 'NANO_KING', score: 125430 },
            { name: 'BLOCK_BOSS', score: 98200 },
            { name: 'DEEJAY_X', score: 85500 },
            { name: 'TOY_PRO', score: 72100 },
            { name: 'BANANA_FAN', score: 64000 }
        ];
        globalScores.forEach((e, i) => {
            list.innerHTML += `
                <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid rgba(255,255,255,0.05); align-items:center; background:rgba(255,255,255,0.02)">
                    <span style="font-weight:900; color:#4FC3F7; width:30px">#${i + 1}</span>
                    <span style="flex:1; font-weight:700">${e.name} <span style="font-size:8px; opacity:0.5; margin-left:5px">● ONLINE</span></span>
                    <span style="font-family:'League Spartan'; font-weight:900; color:#4FC3F7">${e.score.toLocaleString()}</span>
                </div>`;
        });
    }
}

function updateToolsLocal() {
    import('./game').then(m => m.updateTools());
}

function renderPolicyShop() {
    const container = document.getElementById('policy-shop');
    if (!container) return;
    container.innerHTML = '';
    import('./game').then(m => {
        if (m.State.activePolicy === 'taxShield') {
            container.innerHTML = `
                <div class="shop-item" onclick="buyExtraLife()">
                    <span class="shop-icon">🛡️</span>
                    <div class="shop-name">Extra Life</div>
                    <div class="shop-desc">Emergency Insurance</div>
                    <div class="shop-price">10,000 🟡</div>
                </div>
            `;
        }
    });
}

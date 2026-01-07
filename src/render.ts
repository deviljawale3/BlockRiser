import {
    State, GlobalStats, Piece, AudioSys, SaveManager,
    CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE,
    COLS, ROWS, PALETTES, canPlace
} from './game';

let _loopId: number | null = null;

export function gameLoop(ctx: CanvasRenderingContext2D) {
    if (State.isPaused || State.isGameOver) {
        _loopId = null;
        return;
    }

    // Single instance enforcement
    if (_loopId !== null) cancelAnimationFrame(_loopId);

    function frame() {
        if (State.isPaused || State.isGameOver) {
            _loopId = null;
            return;
        }

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (State.screenShake > 0) {
            const sx = (Math.random() - 0.5) * State.screenShake;
            const sy = (Math.random() - 0.5) * State.screenShake;
            ctx.save();
            ctx.translate(sx, sy);
            State.screenShake *= 0.9;
            if (State.screenShake < 0.1) State.screenShake = 0;
        }

        const speedMultipliers = [1.0, 1.5, 2.5];
        const speedFactor = (1.0 + ((State.level - 1) * 0.05)) * speedMultipliers[State.settings.gameSpeed];

        // --- Background & Grid ---
        drawBackground(ctx, speedFactor);

        // --- Cells ---
        drawCells(ctx, speedFactor);

        // --- Queue & Drag ---
        State.queue.forEach(p => { if (p && !p.isDragging) drawPiece(ctx, p); });
        if (State.draggedPieceIndex !== -1) {
            const p = State.queue[State.draggedPieceIndex];
            if (p) {
                drawPhantomPiece(ctx, p);
                drawPiece(ctx, p);
            }
        }

        // --- Particles ---
        updateAndDrawParticles(ctx, speedFactor);

        // --- Floating Texts ---
        updateAndDrawTexts(ctx, speedFactor);

        // --- HUD Extras (Frenzy, Investor) ---
        drawHUDOverlays(ctx);

        // Safety check for missing items (only if game is active)
        if (!State.isGameOver && !State.isPaused && State.queue.length === 0 && State.moveCount > 0) {
            import('./game').then(m => m.fillQueue());
        }

        // --- Combo Heat Juicing ---
        if (State.comboHeat > 0) {
            ctx.fillStyle = `rgba(255, 140, 0, ${State.comboHeat * 0.2})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            State.comboHeat -= 0.005; // Fade out
            if (State.comboHeat < 0) State.comboHeat = 0;
        }

        if (State.screenShake > 0) {
            ctx.restore();
        }

        _loopId = requestAnimationFrame(frame);
    }

    _loopId = requestAnimationFrame(frame);
}

function drawBackground(ctx: CanvasRenderingContext2D, speedFactor: number) {
    if (State.currentTheme === 'eclipse') {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= ROWS; i++) { ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE); ctx.lineTo(GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE); }
        for (let i = 0; i <= COLS; i++) { ctx.moveTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y); ctx.lineTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE); }
        ctx.stroke();
    } else if (State.currentTheme === 'abyss') {
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#000000'); grad.addColorStop(1, '#1a0b2e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.2)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= ROWS; i++) { ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE); ctx.lineTo(GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE); }
        for (let i = 0; i <= COLS; i++) { ctx.moveTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y); ctx.lineTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE); }
        ctx.stroke();
    } else if (State.currentTheme === 'inferno') {
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#2b0505'); grad.addColorStop(1, '#5e0b0b');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = 'rgba(255, 69, 0, 0.3)'; ctx.lineWidth = 1;
        ctx.shadowColor = '#FF4500'; ctx.shadowBlur = 5;
        ctx.beginPath();
        for (let i = 0; i <= ROWS; i++) { ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE); ctx.lineTo(GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE); }
        for (let i = 0; i <= COLS; i++) { ctx.moveTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y); ctx.lineTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE); }
        ctx.stroke();
        ctx.shadowBlur = 0;
    } else if (State.currentTheme === 'obsidian') {
        ctx.fillStyle = '#050505'; ctx.fillRect(GRID_OFFSET_X - 10, GRID_OFFSET_Y - 10, COLS * CELL_SIZE + 20, ROWS * CELL_SIZE + 20);
        ctx.strokeStyle = '#222'; ctx.strokeRect(GRID_OFFSET_X, GRID_OFFSET_Y, COLS * CELL_SIZE, ROWS * CELL_SIZE);
    } else if (State.currentTheme === 'spectral') {
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#2d1b4e'); grad.addColorStop(1, '#050505');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = 'rgba(64, 224, 208, 0.15)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= ROWS; i++) { ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE); ctx.lineTo(GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE); }
        for (let i = 0; i <= COLS; i++) { ctx.moveTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y); ctx.lineTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE); }
        ctx.stroke();
    } else {
        // --- Toy Edition Background (Wooden Desk) ---
        // Subtle wood grain for the board
        ctx.fillStyle = '#4D342E'; // Lighter Mahogany for better contrast
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw wood grain details
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < CANVAS_WIDTH; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i + Math.sin(i) * 20, 0);
            ctx.quadraticCurveTo(i + 20, CANVAS_HEIGHT / 2, i + Math.sin(i + 50) * 20, CANVAS_HEIGHT);
            ctx.stroke();
        }

        State.bgShapes.forEach(s => {
            s.x += s.vx * speedFactor; s.y += s.vy * speedFactor; s.rot += s.vr;
            if (s.x < -100) s.x = 900; if (s.x > 900) s.x = -100; if (s.y < -100) s.y = 1300; if (s.y > 1300) s.y = -100;
            ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = s.c; ctx.globalAlpha = 0.08;
            // Draw blocks in background too
            (ctx as any).roundRect(-s.s / 2, -s.s / 2, s.s, s.s, 10); ctx.fill();
            ctx.restore();
        });

        // Grid Lines (Chunky Wood Grooves)
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= ROWS; i++) { ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE); ctx.lineTo(GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE); }
        for (let i = 0; i <= COLS; i++) { ctx.moveTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y); ctx.lineTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE); }
        ctx.stroke();
    }
}


function drawCells(ctx: CanvasRenderingContext2D, speedFactor: number) {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const c = State.grid[y][x];
            if (c) {
                if (c.yOffset !== undefined && c.yOffset < 0) {
                    c.yOffset += 8 * speedFactor;
                    if (c.yOffset > 0) c.yOffset = 0;
                }
                if (c.scale < c.targetScale) c.scale += (c.targetScale - c.scale) * 0.2 * speedFactor;
                let sz = CELL_SIZE * c.scale, off = (CELL_SIZE - sz) / 2;
                let dx = GRID_OFFSET_X + x * CELL_SIZE + off, dy = GRID_OFFSET_Y + y * CELL_SIZE + off + (c.yOffset || 0);

                ctx.save();
                // Use the beautified drawBlock for the grid cells too
                drawBlock(ctx, c.color, dx, dy, sz);
                drawSpecialBlockOverlays(ctx, c, dx, dy, sz);
                drawBombInfo(ctx, c, x, y);
                handleFlash(ctx, c, x, y, speedFactor);
                handleClearingEffect(ctx, x, y);
                ctx.restore();
            }
        }
    }
}

function applyThemeStyles(ctx: CanvasRenderingContext2D, c: any, dx: number, dy: number, sz: number) {
    if (State.currentTheme === 'eclipse') {
        ctx.fillStyle = '#000'; ctx.fillRect(dx, dy, sz, sz);
        ctx.shadowColor = c.color; ctx.shadowBlur = 15; ctx.strokeStyle = c.color; ctx.lineWidth = 2;
        ctx.strokeRect(dx + 2, dy + 2, sz - 4, sz - 4);
        ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(dx + sz / 2, dy + sz / 2, sz / 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    } else if (State.currentTheme === 'abyss') {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(dx, dy, sz, sz);
        ctx.shadowColor = c.color; ctx.shadowBlur = 10; ctx.strokeStyle = c.color; ctx.lineWidth = 2;
        ctx.strokeRect(dx, dy, sz, sz); ctx.shadowBlur = 0;
    } else if (State.currentTheme === 'inferno') {
        ctx.fillStyle = '#3d0808'; ctx.fillRect(dx, dy, sz, sz);
        ctx.fillStyle = c.color; ctx.globalAlpha = 0.6; ctx.fillRect(dx + 2, dy + 2, sz - 4, sz - 4); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ff4500'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else if (State.currentTheme === 'pixel') {
        ctx.fillStyle = color; ctx.fillRect(dx, dy, sz, sz);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(dx + 4, dy + 4, 6, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else if (State.currentTheme === 'neon') {
        ctx.shadowColor = c.color; ctx.shadowBlur = 10;
        ctx.strokeStyle = c.color; ctx.lineWidth = 3; ctx.strokeRect(dx + 4, dy + 4, sz - 8, sz - 8);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(dx + 4, dy + 4, sz - 8, sz - 8);
        ctx.shadowBlur = 0;
    } else if (State.currentTheme === 'midnight') {
        ctx.fillStyle = c.color; ctx.fillRect(dx, dy, sz, sz);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(dx, dy, sz, sz);
    } else if (State.currentTheme === 'obsidian') {
        ctx.fillStyle = '#000'; ctx.fillRect(dx, dy, sz, sz);
        ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz, sz);
    } else if (State.currentTheme === 'spectral') {
        ctx.fillStyle = c.color; ctx.globalAlpha = 0.8; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(dx, dy, sz, sz / 4);
    } else {
        ctx.fillStyle = c.color; ctx.fillRect(dx, dy, sz, sz);
        if (c.type !== 'cracked') {
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); (ctx as any).roundRect(dx + 2, dy + 2, sz - 4, sz / 3, 4); ctx.fill();
        }
    }
}

function drawSpecialBlockOverlays(ctx: CanvasRenderingContext2D, c: any, dx: number, dy: number, sz: number) {
    if (c.type === 'gold') {
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4; ctx.strokeRect(dx, dy, sz, sz);
        ctx.fillStyle = '#ffd700'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.fillText('🟡', dx + sz / 2, dy + sz * 0.7);
    } else if (c.type === 'metal') {
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.strokeRect(dx + 3, dy + 3, sz - 6, sz - 6);
        ctx.fillStyle = '#A0A0A0'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText(c.health, dx + sz / 2, dy + sz / 2 + 6);
    } else if (c.type === 'multiplier') {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.strokeRect(dx + 2, dy + 2, sz - 4, sz - 4); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillText(c.mult === 'square' ? '²' : '✖', dx + sz / 2, dy + sz / 2 + 8);
    } else if (c.type === 'vine') {
        ctx.fillStyle = '#1e8449'; ctx.beginPath(); ctx.arc(dx + sz / 2, dy + sz / 2, sz / 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.stroke();
    } else if (c.type === 'cracked') {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + sz, dy + sz); ctx.moveTo(dx + sz, dy); ctx.lineTo(dx, dy + sz); ctx.stroke();
    } else if (c.type === 'inflation') {
        ctx.fillStyle = '#ff4b2b'; ctx.shadowColor = '#ff4b2b'; ctx.shadowBlur = 10;
        ctx.fillRect(dx + 5, dy + 5, sz - 10, sz - 10); ctx.shadowBlur = 0;
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('🎈', dx + sz / 2, dy + sz * 0.7);
    } else if (c.type === 'liquid') {
        ctx.fillStyle = '#3498db'; ctx.globalAlpha = 0.6; ctx.fillRect(dx, dy, sz, sz); ctx.globalAlpha = 1;
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('💧', dx + sz / 2, dy + sz * 0.7);
    } else if (c.type === 'crypto') {
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.strokeRect(dx + 2, dy + 2, sz - 4, sz - 4);
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('₿', dx + sz / 2, dy + sz * 0.7);
    }
}

function drawBombInfo(ctx: CanvasRenderingContext2D, c: any, x: number, y: number) {
    if (c.bomb !== undefined) {
        ctx.fillStyle = 'white'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black'; ctx.shadowBlur = 5;
        ctx.fillText(c.bomb, GRID_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2, GRID_OFFSET_Y + y * CELL_SIZE + CELL_SIZE / 2);
        ctx.shadowBlur = 0;
    }
}

function handleFlash(ctx: CanvasRenderingContext2D, c: any, x: number, y: number, speedFactor: number) {
    if (c.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${c.flash})`;
        ctx.fillRect(GRID_OFFSET_X + x * CELL_SIZE, GRID_OFFSET_Y + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        c.flash -= 0.1 * speedFactor;
    }
}

function handleClearingEffect(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (State.isClearing && (State.clearingRows.includes(y) || State.clearingCols.includes(x))) {
        const progress = Math.min(1, (Date.now() - State.clearStartTime) / 250);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(progress * Math.PI) * 0.4})`;
        ctx.fillRect(GRID_OFFSET_X + x * CELL_SIZE, GRID_OFFSET_Y + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        const expSize = CELL_SIZE * progress;
        const expOff = (CELL_SIZE - expSize) / 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(GRID_OFFSET_X + x * CELL_SIZE + expOff, GRID_OFFSET_Y + y * CELL_SIZE + expOff, expSize, expSize);
    }
}

export function drawPiece(ctx: CanvasRenderingContext2D, p: Piece) {
    let sz = CELL_SIZE * p.scale, w = p.cols * sz, h = p.rows * sz;
    ctx.save(); ctx.translate(p.x, p.y);
    if (!p.isDragging && p.scale < p.targetScaleQueue) p.scale += (p.targetScaleQueue - p.scale) * 0.1;

    if (p.isDragging) {
        let gx = Math.round((p.x - w / 2 - GRID_OFFSET_X) / CELL_SIZE), gy = Math.round((p.y - h / 2 - GRID_OFFSET_Y) / CELL_SIZE);
        if (canPlace(p, gx, gy)) {
            ctx.save(); ctx.translate(-p.x + GRID_OFFSET_X + gx * CELL_SIZE + w / 2, -p.y + GRID_OFFSET_Y + gy * CELL_SIZE + h / 2);
            const pulse = 0.3 + Math.sin(Date.now() / 150) * 0.1;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#66ff66';
            for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) if (p.map[r][c]) ctx.fillRect(-w / 2 + c * CELL_SIZE, -h / 2 + r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.restore();
        } else {
            if (gx > -2 && gx < COLS + 1 && gy > -2 && gy < ROWS + 1) {
                ctx.strokeStyle = '#ff0033'; ctx.lineWidth = 6; ctx.shadowColor = '#ff0033'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.moveTo(-25, -25); ctx.lineTo(25, 25); ctx.moveTo(25, -25); ctx.lineTo(-25, 25); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(255, 0, 50, 0.6)';
            }
        }
    }

    // Architect's Eye Shadow Hint
    if (!p.isDragging && GlobalStats.upgrades.eye > 0) {
        let bestX = -1, bestY = -1;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (canPlace(p, x, y)) { bestX = x; bestY = y; break; }
            }
            if (bestX !== -1) break;
        }
        if (bestX !== -1) {
            ctx.save();
            ctx.globalAlpha = 0.05 * GlobalStats.upgrades.eye;
            const hx = (GRID_OFFSET_X + bestX * CELL_SIZE + w / 2) - p.x;
            const hy = (GRID_OFFSET_Y + bestY * CELL_SIZE + h / 2) - p.y;
            ctx.translate(hx, hy);
            ctx.fillStyle = p.color;
            for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) if (p.map[r][c]) ctx.fillRect(-w / 2 + c * CELL_SIZE, -h / 2 + r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.restore();
        }
    }

    for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
            if (p.map[r][c]) {
                let dx = -w / 2 + c * sz, dy = -h / 2 + r * sz;
                drawBlock(ctx, p.color, dx, dy, sz);
            }
        }
    }
    ctx.restore();
}

function drawBlock(ctx: CanvasRenderingContext2D, color: string, dx: number, dy: number, sz: number) {
    ctx.save();

    // Draw Main block Body (Wood Texture)
    ctx.beginPath();
    ctx.fillStyle = color;
    if ((ctx as any).roundRect) {
        (ctx as any).roundRect(dx, dy, sz, sz, sz * 0.15);
    } else {
        ctx.rect(dx, dy, sz, sz);
    }
    ctx.fill();

    // Wood Grain (Subtle overlay)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(dx + sz * 0.2, dy); ctx.lineTo(dx + sz * 0.2, dy + sz);
    ctx.moveTo(dx + sz * 0.5, dy); ctx.lineTo(dx + sz * 0.5, dy + sz);
    ctx.moveTo(dx + sz * 0.8, dy); ctx.lineTo(dx + sz * 0.8, dy + sz);
    ctx.stroke();

    // Bevel effect (Toy Look)
    ctx.lineWidth = sz * 0.08;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.moveTo(dx + sz * 0.1, dy + sz * 0.9);
    ctx.lineTo(dx + sz * 0.1, dy + sz * 0.1);
    ctx.lineTo(dx + sz * 0.9, dy + sz * 0.1);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.moveTo(dx + sz * 0.1, dy + sz * 0.9);
    ctx.lineTo(dx + sz * 0.9, dy + sz * 1.0); // Corrected slightly for overlap
    ctx.lineTo(dx + sz * 0.9, dy + sz * 0.1);
    ctx.stroke();

    // Gloss point
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.arc(dx + sz * 0.25, dy + sz * 0.25, sz * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D, speedFactor: number) {
    for (let i = State.particles.length - 1; i >= 0; i--) {
        let p = State.particles[i];
        if (p.type === 'coin-fly') {
            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 10) {
                State.particles.splice(i, 1);
                updateCoinDisplaysGlobal();
                continue;
            }
            p.vx += (dx / dist) * 2;
            p.vy += (dy / dist) * 2;
            p.vx *= 0.95; p.vy *= 0.95;
            p.x += p.vx; p.y += p.vy;
            ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s / 2, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'symbol') {
            p.x += p.vx * speedFactor; p.y += p.vy * speedFactor;
            p.vy += 0.3 * speedFactor; // Gravity
            p.life -= 0.02 * speedFactor;
            if (p.life <= 0) State.particles.splice(i, 1);
            else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.c;
                ctx.font = `bold ${p.s}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(p.symbol || '$', p.x, p.y);
            }
        } else {
            p.x += p.vx * speedFactor; p.y += p.vy * speedFactor; p.life -= 0.02 * speedFactor;
            if (p.life <= 0) State.particles.splice(i, 1);
            else { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
        }
    }
    ctx.globalAlpha = 1;
}

function updateAndDrawTexts(ctx: CanvasRenderingContext2D, speedFactor: number) {
    for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
        let f = State.floatingTexts[i];
        if (f.type === 'combo') {
            f.l -= 0.01 * speedFactor;
            f.tick += 0.1 * speedFactor;
            const scale = f.s * (1 + Math.sin(f.tick * 0.5) * 0.2);
            ctx.globalAlpha = f.l; ctx.fillStyle = f.c; ctx.font = "900 " + scale + "px sans-serif";
            ctx.textAlign = "center"; ctx.fillText(f.t, f.x, f.y);
        } else {
            f.y -= 2 * speedFactor; f.l -= 0.02 * speedFactor;
            ctx.globalAlpha = f.l; ctx.fillStyle = f.c; ctx.font = "900 " + f.s + "px sans-serif";
            ctx.textAlign = "center"; ctx.fillText(f.t, f.x, f.y);
        }
        if (f.l <= 0) State.floatingTexts.splice(i, 1);
    }
    ctx.globalAlpha = 1;
}

function updateCoinDisplaysGlobal() {
    import('./game').then(m => m.updateCoinDisplays());
}

function drawHUDOverlays(ctx: CanvasRenderingContext2D) {
    if (State.frenzy.moves > 0) {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`FRENZY: ${State.frenzy.moves} MOVES (x${State.frenzy.mult})`, CANVAS_WIDTH / 2, 80);
    }
    if (State.investor.active) {
        const i = State.investor;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`INVESTOR: ${i.progress}/${i.target} ${i.type.toUpperCase()} (${i.movesLeft})`, CANVAS_WIDTH - 20, 80);
    }

    // Breaking News Event Ticker
    if (State.activeEvent) {
        ctx.save();
        const flash = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.fillStyle = `rgba(255, 30, 30, ${flash})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, CANVAS_WIDTH - 10, 30);

        ctx.fillStyle = 'white';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🗞️ BREAKING NEWS: ${State.activeEvent.name} - ${State.activeEvent.desc} (${State.eventTimer})`, 20, 26);
        ctx.restore();
    }

    // --- High Heat Golden Flash ---
    if (State.comboHeat > 0.5) {
        ctx.save();
        ctx.globalAlpha = (State.comboHeat - 0.5) * 0.4;
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }
}

function drawPhantomPiece(ctx: CanvasRenderingContext2D, p: Piece) {
    if (!State.phantomPos) return;
    const { gx, gy } = State.phantomPos;

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;

    for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
            if (p.map[r][c]) {
                const dx = GRID_OFFSET_X + (gx + c) * CELL_SIZE;
                const dy = GRID_OFFSET_Y + (gy + r) * CELL_SIZE;
                ctx.strokeRect(dx + 2, dy + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                ctx.fillStyle = p.color;
                ctx.fillRect(dx + 4, dy + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            }
        }
    }
    ctx.restore();
}

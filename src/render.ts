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
            if (p) drawPiece(ctx, p);
        }

        // --- Particles ---
        updateAndDrawParticles(ctx, speedFactor);

        // --- Floating Texts ---
        updateAndDrawTexts(ctx, speedFactor);

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
        State.bgShapes.forEach(s => {
            s.x += s.vx * speedFactor; s.y += s.vy * speedFactor; s.rot += s.vr;
            if (s.x < -100) s.x = 900; if (s.x > 900) s.x = -100; if (s.y < -100) s.y = 1300; if (s.y > 1300) s.y = -100;
            ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = s.c; ctx.globalAlpha = 0.05; ctx.fillRect(-s.s / 2, -s.s / 2, s.s, s.s); ctx.restore();
        });
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
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
                applyThemeStyles(ctx, c, dx, dy, sz);
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
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); (ctx as any).roundRect(dx + 2, dy + 2, sz - 4, sz / 3, 4); ctx.fill();
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
    if (State.currentTheme === 'eclipse') {
        ctx.fillStyle = '#000'; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(dx + sz / 2, dy + sz / 2, sz / 6, 0, Math.PI * 2); ctx.fill();
    } else if (State.currentTheme === 'abyss') {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else if (State.currentTheme === 'inferno') {
        ctx.fillStyle = '#3d0808'; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.fillStyle = color; ctx.globalAlpha = 0.6; ctx.fillRect(dx + 2, dy + 2, sz - 4, sz - 4); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ff4500'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else if (State.currentTheme === 'pixel') {
        ctx.fillStyle = color; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(dx + 4, dy + 4, 6, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else if (State.currentTheme === 'neon') {
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(dx + 2, dy + 2, sz - 4, sz - 4);
    } else if (State.currentTheme === 'obsidian') {
        ctx.fillStyle = '#000'; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else if (State.currentTheme === 'spectral') {
        ctx.fillStyle = color; ctx.globalAlpha = 0.8; ctx.fillRect(dx, dy, sz - 1, sz - 1);
        ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.strokeRect(dx, dy, sz - 1, sz - 1);
    } else {
        ctx.fillStyle = color; ctx.fillRect(dx, dy, sz - 2, sz - 2);
    }
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

import {
    State, GlobalStats, Piece, AudioSys, SaveManager,
    CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE,
    COLS, ROWS, PALETTES, canPlace
} from './game';

let _loopId: number | null = null;

export function gameLoop(ctx: CanvasRenderingContext2D) {
    if (State.isPaused || State.isGameOver || !State.gameRunning) {
        if (_loopId !== null) cancelAnimationFrame(_loopId);
        _loopId = null;
        return;
    }

    // Single instance enforcement
    if (_loopId !== null) cancelAnimationFrame(_loopId);

    let _isFilling = false;

    function frame() {
        if (State.isPaused || State.isGameOver || !State.gameRunning) {
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
        let speedFactor = (1.0 + ((State.level - 1) * 0.05)) * speedMultipliers[State.settings.gameSpeed];

        // Boost speed during Bull Market event
        if (State.activeEvent?.id === 'bullMarket') speedFactor *= 1.5;

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

                if (State.isClearing) {
                    // Skip drag trails during clearing for visual clarity
                }
            }
        }

        // --- Particles ---
        updateAndDrawParticles(ctx, speedFactor);

        // --- Visual Effects (Hammer/TNT) ---
        updateAndDrawEffects(ctx, speedFactor);

        // --- Floating Texts ---
        updateAndDrawTexts(ctx, speedFactor);

        // --- HUD Extras (Frenzy, Investor) ---
        drawHUDOverlays(ctx);

        // Safety check for missing items (Corrected logic)
        if (!State.isGameOver && !State.isPaused && State.moveCount > 0 && !_isFilling) {
            const isEmpty = State.queue.every(p => p === null);
            if (isEmpty) {
                _isFilling = true;
                import('./game').then(m => {
                    m.fillQueue();
                    _isFilling = false;
                });
            }
        }

        // --- Smooth Score Ticking ---
        if (State.displayedScore < State.score) {
            const diff = State.score - State.displayedScore;
            State.displayedScore += Math.max(1, Math.ceil(diff * 0.1));
            const hudScore = document.getElementById('hud-score');
            if (hudScore) hudScore.innerText = Math.floor(State.displayedScore).toString();
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
    // Unified Premium Wood Rendering for ALL Themes
    const WOOD_STYLES: any = {
        classic: { name: 'Oak', base: ['#8D6E63', '#5D4037'], grain: 'rgba(50,30,10,0.1)', knot: 'rgba(62,39,35,0.2)', frame: ['#3E2723', '#2C1810'], glow: null }, // Oak
        pixel: { name: 'Pine', base: ['#FFF59D', '#FFF176'], grain: 'rgba(139,69,19,0.15)', knot: 'rgba(139,69,19,0.2)', frame: ['#FBC02D', '#F57F17'], glow: '#FFF' }, // Pine
        neon: { name: 'Mahogany', base: ['#D84315', '#BF360C'], grain: 'rgba(50,10,0,0.2)', knot: 'rgba(40,10,0,0.3)', frame: ['#8D6E63', '#5D4037'], glow: '#FF5722' }, // Mahogany
        midnight: { name: 'Ebony', base: ['#212121', '#000000'], grain: 'rgba(255,255,255,0.05)', knot: 'rgba(0,0,0,0.5)', frame: ['#424242', '#212121'], glow: '#9E9E9E' }, // Ebony
        obsidian: { name: 'Walnut', base: ['#5D4037', '#3E2723'], grain: 'rgba(20,10,5,0.3)', knot: 'rgba(10,5,0,0.4)', frame: ['#4E342E', '#271914'], glow: null }, // Walnut
        eclipse: { name: 'Cherry', base: ['#8e3232', '#4a1212'], grain: 'rgba(80,20,20,0.2)', knot: 'rgba(60,10,10,0.3)', frame: ['#b71c1c', '#7f0000'], glow: '#EF5350' }, // Cherry
        abyss: { name: 'Teak', base: ['#C19A6B', '#8B5A2B'], grain: 'rgba(60,40,10,0.2)', knot: 'rgba(50,30,0,0.25)', frame: ['#FFA000', '#FF6F00'], glow: '#FFD54F' }, // Teak
        inferno: { name: 'Birch', base: ['#F5F5F5', '#E0E0E0'], grain: 'rgba(0,0,0,0.1)', knot: 'rgba(0,0,0,0.15)', frame: ['#BDBDBD', '#9E9E9E'], glow: '#FFF' }, // Birch
        spectral: { name: 'Maple', base: ['#FFCC80', '#FFB74D'], grain: 'rgba(139,69,19,0.1)', knot: 'rgba(139,69,19,0.15)', frame: ['#EF6C00', '#E65100'], glow: '#FFE0B2' } // Maple
    };

    const style = WOOD_STYLES[State.currentTheme] || WOOD_STYLES['classic'];

    // 1. Background Surface (Wood Table)
    const tableGradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8
    );
    tableGradient.addColorStop(0, style.base[0]);
    tableGradient.addColorStop(1, style.base[1]);
    ctx.fillStyle = tableGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Realistic Wood Grain
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
        ctx.strokeStyle = i % 40 === 0 ? style.grain : 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        const offset = Math.sin(i * 0.1) * 30;
        ctx.moveTo(i, 0);
        ctx.bezierCurveTo(
            i + 30, CANVAS_HEIGHT * 0.3 + offset,
            i - 20, CANVAS_HEIGHT * 0.7 - offset,
            i + 15, CANVAS_HEIGHT
        );
        ctx.stroke();
    }

    // 3. Wood Knots
    const knots = [
        { x: CANVAS_WIDTH * 0.15, y: CANVAS_HEIGHT * 0.2, r: 35 },
        { x: CANVAS_WIDTH * 0.85, y: CANVAS_HEIGHT * 0.45, r: 25 },
        { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.75, r: 30 },
        { x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.9, r: 40 }
    ];
    knots.forEach(knot => {
        ctx.fillStyle = style.knot;
        ctx.beginPath();
        ctx.ellipse(knot.x, knot.y, knot.r, knot.r * 0.7, Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        // Inner knot detail
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(knot.x, knot.y, knot.r * 0.5, knot.r * 0.3, Math.PI / 3, 0, Math.PI * 2);
        ctx.stroke();
    });

    // 4. Premium Game Board Frame
    const boardMargin = 12;
    const boardX = GRID_OFFSET_X - boardMargin;
    const boardY = GRID_OFFSET_Y - boardMargin;
    const boardW = (COLS * CELL_SIZE) + boardMargin * 2;
    const boardH = (ROWS * CELL_SIZE) + boardMargin * 2;

    // Outer Frame Shadow (3D Lift)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;

    // Main Frame Gradient
    const frameGradient = ctx.createLinearGradient(boardX, boardY, boardX + boardW, boardY + boardH);
    frameGradient.addColorStop(0, style.frame[0]);
    frameGradient.addColorStop(1, style.frame[1]);
    ctx.fillStyle = frameGradient;

    ctx.beginPath();
    (ctx as any).roundRect(boardX, boardY, boardW, boardH, 20);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Frame Detail (Inner Bevel)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    (ctx as any).roundRect(boardX + 4, boardY + 4, boardW - 8, boardH - 8, 16);
    ctx.stroke();

    // Optional Glow for special themes (Neon, etc)
    if (style.glow) {
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = 15;
    }

    // Inner Playing Surface (Recessed)
    const innerGradient = ctx.createLinearGradient(GRID_OFFSET_X, GRID_OFFSET_Y, GRID_OFFSET_X, GRID_OFFSET_Y + ROWS * CELL_SIZE);
    // Darken the base color for the inner recess
    innerGradient.addColorStop(0, 'rgba(0,0,0,0.6)');
    innerGradient.addColorStop(1, 'rgba(0,0,0,0.4)');

    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    (ctx as any).roundRect(GRID_OFFSET_X - 4, GRID_OFFSET_Y - 4, COLS * CELL_SIZE + 8, ROWS * CELL_SIZE + 8, 12);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset glow

    // Grid Cells (Slots)
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = GRID_OFFSET_X + c * CELL_SIZE;
            const y = GRID_OFFSET_Y + r * CELL_SIZE;

            // Deep Recess for Slot
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            (ctx as any).roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 8);
            ctx.fill();

            // Slot Highlight
            ctx.strokeStyle = style.grain; // Re-use grain color for subtle highlight
            ctx.lineWidth = 1;
            ctx.beginPath();
            (ctx as any).roundRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 7);
            ctx.stroke();
        }
    }      // Floating Background Shapes (Toy Blocks)
    State.bgShapes.forEach(s => {
        s.x += s.vx * speedFactor;
        s.y += s.vy * speedFactor;
        s.rot += s.vr;
        if (s.x < -100) s.x = 900;
        if (s.x > 900) s.x = -100;
        if (s.y < -100) s.y = 1300;
        if (s.y > 1300) s.y = -100;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.c;
        ctx.globalAlpha = 0.06;
        (ctx as any).roundRect(-s.s / 2, -s.s / 2, s.s, s.s, 12);
        ctx.fill();
        ctx.restore();
    });

    // Subtle Grid Lines (Wood Grooves)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= ROWS; i++) {
        ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE);
        ctx.lineTo(GRID_OFFSET_X + COLS * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE);
    }
    for (let i = 0; i <= COLS; i++) {
        ctx.moveTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y);
        ctx.lineTo(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + ROWS * CELL_SIZE);
    }
    ctx.stroke();
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
        ctx.fillStyle = c.color; ctx.fillRect(dx, dy, sz, sz);
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
        // === PREMIUM 3D WOODEN TOY BLOCK RENDERING ===

        // Deep shadow for 3D depth
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Main block body with rounded corners
        ctx.fillStyle = c.color;
        ctx.beginPath();
        (ctx as any).roundRect(dx, dy, sz, sz, 12);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (c.type !== 'cracked') {
            // Top glossy highlight (toy block shine)
            const highlightGrad = ctx.createLinearGradient(dx, dy, dx, dy + sz * 0.4);
            highlightGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
            highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            (ctx as any).roundRect(dx + 4, dy + 4, sz - 8, sz * 0.35, 8);
            ctx.fill();

            // Bottom shadow for depth
            const shadowGrad = ctx.createLinearGradient(dx, dy + sz * 0.6, dx, dy + sz);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            (ctx as any).roundRect(dx + 4, dy + sz * 0.6, sz - 8, sz * 0.35, 8);
            ctx.fill();

            // Left edge highlight (3D bevel)
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(dx + 2, dy + 8, 3, sz - 16);

            // Right edge shadow (3D bevel)
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(dx + sz - 5, dy + 8, 3, sz - 16);
        }

        // Subtle border for definition
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        (ctx as any).roundRect(dx + 1, dy + 1, sz - 2, sz - 2, 11);
        ctx.stroke();
    }
}

function drawSpecialBlockOverlays(ctx: CanvasRenderingContext2D, c: any, dx: number, dy: number, sz: number) {
    if (c.type === 'gem') {
        // Sparkly Diamond Effect for Adventure Gems
        ctx.save();
        const pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10 * pulse;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const mx = dx + sz / 2, my = dy + sz / 2;
        ctx.moveTo(mx, dy + sz * 0.2); // Top
        ctx.lineTo(dx + sz * 0.8, my); // Right
        ctx.lineTo(mx, dy + sz * 0.8); // Bottom
        ctx.lineTo(dx + sz * 0.2, my); // Left
        ctx.closePath();
        ctx.fill();

        // Shine line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dx + sz * 0.3, dy + sz * 0.3);
        ctx.lineTo(dx + sz * 0.4, dy + sz * 0.4);
        ctx.stroke();
        ctx.restore();
    } else if (c.type === 'gold') {
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
    } else if (c.type === 'ice') {
        // Ice Block Overlay
        ctx.fillStyle = 'rgba(129, 212, 250, 0.4)';
        ctx.fillRect(dx, dy, sz, sz);
        ctx.strokeStyle = '#E1F5FE';
        ctx.lineWidth = 3;
        ctx.strokeRect(dx + 4, dy + 4, sz - 8, sz - 8);

        // Cracks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        if (c.iceLevel > 0) {
            ctx.beginPath();
            ctx.moveTo(dx + 5, dy + 5); ctx.lineTo(dx + sz - 10, dy + sz - 10);
            ctx.moveTo(dx + sz - 15, dy + 10); ctx.lineTo(dx + 10, dy + sz - 15);
            ctx.stroke();

            // Extra cracks for hit ice
            if (c.iceLevel === 1) {
                ctx.beginPath();
                ctx.moveTo(dx + sz / 2, dy + 5); ctx.lineTo(dx + sz / 2, dy + sz - 5);
                ctx.moveTo(dx + 5, dy + sz / 2); ctx.lineTo(dx + sz - 5, dy + sz / 2);
                ctx.stroke();
            }
        }
    } else if (c.type === 'chain' && c.isChained) {
        // Chain Overlay
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = 4;
        const pad = sz * 0.2;
        ctx.beginPath();
        // X shape for chains
        ctx.moveTo(dx + pad, dy + pad); ctx.lineTo(dx + sz - pad, dy + sz - pad);
        ctx.moveTo(dx + sz - pad, dy + pad); ctx.lineTo(dx + pad, dy + sz - pad);
        ctx.stroke();

        // Lock symbol
        ctx.fillStyle = '#BDBDBD';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛓️', dx + sz / 2, dy + sz / 2 + 7);
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
    if (State.blockSkin === 'crystal') {
        // Crystal Skin: Faceted, high gloss, transparent-ish
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        (ctx as any).roundRect(dx + 2, dy + 2, sz - 4, sz - 4, 15);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dx + 5, dy + 5); ctx.lineTo(dx + sz - 5, dy + sz - 5);
        ctx.moveTo(dx + sz - 5, dy + 5); ctx.lineTo(dx + 5, dy + sz - 5);
        ctx.stroke();

        const grad = ctx.createLinearGradient(dx, dy, dx + sz, dy + sz);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(dx + 2, dy + 2, sz - 4, sz - 4);
        ctx.restore();
        return;
    } else if (State.blockSkin === 'neon') {
        // Neon Skin: Glowy borders, dark center
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(dx + 4, dy + 4, sz - 8, sz - 8);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(dx + 4, dy + 4, sz - 8, sz - 8);
        ctx.restore();
        return;
    } else if (State.blockSkin === 'wood') {
        // Wood Skin: Matte, grain texture
        ctx.save();
        ctx.fillStyle = '#8D6E63'; // Wood base
        ctx.fillRect(dx + 1, dy + 1, sz - 2, sz - 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < sz; i += 8) {
            ctx.beginPath(); ctx.moveTo(dx + i, dy); ctx.lineTo(dx + i + 4, dy + sz); ctx.stroke();
        }
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(dx + 1, dy + 1, sz - 2, sz - 2);
        ctx.restore();
        return;
    }

    // Premium "Jelly Gem" Block Rendering (Default)
    const r = sz * 0.2; // Rounded corner radius (20% of size)
    const innerOff = sz * 0.1;

    ctx.save();

    // 1. Soft Drop Shadow (Depth)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // 2. Base Shape & Gradient (Body)
    const grad = ctx.createLinearGradient(dx, dy, dx, dy + sz);
    grad.addColorStop(0, adjustColor(color, 20)); // Lighter top
    grad.addColorStop(1, adjustColor(color, -20)); // Darker bottom

    ctx.fillStyle = grad;
    ctx.beginPath();
    (ctx as any).roundRect(dx + 2, dy + 2, sz - 4, sz - 4, r);
    ctx.fill();

    // Clear shadow for internal details
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 3. Inner Bevel Highlight (Top/Left)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    (ctx as any).roundRect(dx + 2, dy + 2, sz - 4, sz - 4, r);
    ctx.stroke();

    // 4. Inner Bevel Shadow (Bottom/Right) - clipped
    ctx.save();
    ctx.clip(); // Clip to the rounded rect
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    (ctx as any).roundRect(dx + 2, dy + 2, sz - 4, sz - 4, r);
    ctx.stroke();
    ctx.restore();

    // 5. Glossy Shine (The "Juicy" part) - Top Left
    const shineGrad = ctx.createLinearGradient(dx, dy, dx + sz, dy + sz);
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = shineGrad;
    ctx.beginPath();
    // Ellipse-ish shine
    ctx.ellipse(dx + sz * 0.3, dy + sz * 0.25, sz * 0.25, sz * 0.15, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Center "Gem" Depth (Subtle radial gradient in center)
    const centerGrad = ctx.createRadialGradient(dx + sz / 2, dy + sz / 2, 0, dx + sz / 2, dy + sz / 2, sz / 2);
    centerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    (ctx as any).roundRect(dx + innerOff, dy + innerOff, sz - innerOff * 2, sz - innerOff * 2, r / 2);
    ctx.fill();

    ctx.restore();
}

// Utility to lighten/darken hex color
function adjustColor(color: string, amount: number) {
    let usePound = false;
    if (color && color[0] == "#") {
        color = color.slice(1);
        usePound = true;
    }
    // Default to black if invalid
    if (!color || color.length < 3) return usePound ? "#000000" : "000000";

    // Handle shorthand hex like #ABC
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D, speedFactor: number) {
    for (let i = State.particles.length - 1; i >= 0; i--) {
        let p = State.particles[i];

        // Physics
        p.x += p.vx * speedFactor;
        p.y += p.vy * speedFactor;

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
            // Draw Coin
            ctx.save();
            ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
            ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s / 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFF'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('$', p.x, p.y + 4);
            ctx.restore();

        } else if (p.type === 'symbol') {
            p.vy += 0.3 * speedFactor; // Gravity
            p.life -= 0.02 * speedFactor;
            if (p.life <= 0) State.particles.splice(i, 1);
            else {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.shadowColor = p.c;
                ctx.shadowBlur = 5;
                ctx.fillStyle = p.c;
                ctx.font = `bold ${p.s}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(p.symbol || '$', p.x, p.y);
                ctx.restore();
            }
        } else {
            // Standard Spark/Debris
            p.life -= 0.02 * speedFactor;
            if (p.life <= 0) State.particles.splice(i, 1);
            else {
                ctx.save();
                ctx.globalAlpha = p.life;
                if (p.type === 'spark' || p.type === 'explosion') {
                    ctx.globalCompositeOperation = 'lighter'; // Glow effect
                    ctx.shadowColor = p.c;
                    ctx.shadowBlur = 10;
                }
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s / 2, 0, Math.PI * 2); // Circle particles
                ctx.fill();
                ctx.restore();
            }
        }
    }
}

function updateAndDrawTexts(ctx: CanvasRenderingContext2D, speedFactor: number) {
    for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
        let f = State.floatingTexts[i];
        if (f.type === 'combo') {
            f.l -= 0.006 * speedFactor;
            f.tick += 0.1 * speedFactor;

            // "Pop" animation using overshoot
            const p = Math.min(1, f.tick * 0.5);
            const bounce = p < 0.5 ? p * 2.4 : 1.2 - (p - 0.5) * 0.4;
            const scale = f.s * bounce;

            ctx.save();
            ctx.globalAlpha = Math.min(1, f.l * 2);
            ctx.shadowColor = f.c;
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#fff';
            ctx.font = "900 " + scale + "px 'League Spartan', sans-serif";
            ctx.textAlign = "center";
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#000';
            ctx.strokeText(f.t, f.x, f.y);
            ctx.strokeStyle = f.c;
            ctx.lineWidth = 3;
            ctx.strokeText(f.t, f.x, f.y);
            ctx.fillText(f.t, f.x, f.y);
            ctx.restore();
        } else {
            f.y -= 2 * speedFactor; f.l -= 0.02 * speedFactor;
            ctx.save();
            ctx.globalAlpha = f.l;
            ctx.fillStyle = f.c;
            ctx.font = "900 " + f.s + "px 'League Spartan', sans-serif";
            ctx.textAlign = "center";
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(f.t, f.x, f.y);
            ctx.restore();
        }
        if (f.l <= 0) State.floatingTexts.splice(i, 1);
    }
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
    // Investor HUD removed


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
    const eyeLevel = GlobalStats.upgrades.eye || 0;
    if (eyeLevel === 0) return; // Hidden until unlocked
    if (!State.phantomPos) return;

    const { gx, gy } = State.phantomPos;

    ctx.save();
    ctx.globalAlpha = eyeLevel * 0.15; // Brightens with level

    if (eyeLevel >= 1) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
    }

    for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
            if (p.map[r][c]) {
                const dx = GRID_OFFSET_X + (gx + c) * CELL_SIZE;
                const dy = GRID_OFFSET_Y + (gy + r) * CELL_SIZE;

                if (eyeLevel >= 1) ctx.strokeRect(dx + 2, dy + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                if (eyeLevel >= 2) {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(dx + 4, dy + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                }

                // Level 3: Internal Glow/Border
                if (eyeLevel >= 3) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#FFF';
                    ctx.strokeStyle = '#FFF';
                    ctx.strokeRect(dx + 6, dy + 6, CELL_SIZE - 12, CELL_SIZE - 12);
                }
            }
        }
    }
    ctx.restore();
}

// --- Visual Effects System ---

interface VisualEffect {
    type: 'hammer' | 'tnt';
    x: number;
    y: number; // Grid coordinates
    life: number; // 0 to 1
    maxLife: number;
    rotation?: number;
    scale?: number;
}

const hammerImg = new Image(); hammerImg.src = '/icon_hammer.svg';
const tntImg = new Image(); tntImg.src = '/icon_tnt.svg';

export function spawnEffect(type: 'hammer' | 'tnt', gx: number, gy: number) {
    // Longer life for cinematic phases
    const life = type === 'hammer' ? 45 : 60;
    if (!State.effects) (State as any).effects = [];
    State.effects.push({
        type,
        x: gx,
        y: gy,
        life: 1.0,
        maxLife: life,
        rotation: 0,
        scale: 0
    });
    if (State.effects.length > 5) State.effects.shift();
}

function updateAndDrawEffects(ctx: CanvasRenderingContext2D, speedFactor: number) {
    if (!State.effects) return;
    for (let i = State.effects.length - 1; i >= 0; i--) {
        const fx = State.effects[i];
        fx.life -= (1 / fx.maxLife) * speedFactor;

        // Center calculation
        const cx = GRID_OFFSET_X + fx.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = GRID_OFFSET_Y + fx.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.translate(cx, cy);

        const progress = 1.0 - fx.life;

        if (fx.type === 'hammer') {
            // --- Cinematic Hammer Logic ---
            // Phase 1: Appear & Hover (0.0 - 0.25)
            // Phase 2: Wind Up (0.25 - 0.4)
            // Phase 3: SMASH (0.4 - 0.5)
            // Phase 4: ImpactFX (0.5 - 0.6)
            // Phase 5: Fade (0.6 - 1.0)

            let scale = 1;
            let ang = 0;
            let yOff = -50; // Start high

            if (progress < 0.25) {
                // Fly in from top-right
                const p = progress / 0.25;
                scale = p * 1.5; // Grow large
                yOff = -150 * (1 - p) - 20;
                ang = Math.PI / 4;
            } else if (progress < 0.4) {
                // Wind up
                const p = (progress - 0.25) / 0.15;
                scale = 1.5 + (0.3 * p);
                yOff = -20 - (40 * p);
                ang = Math.PI / 4 - (Math.PI / 2 * p); // Rotate back
            } else if (progress < 0.5) {
                // SMASH
                const p = (progress - 0.4) / 0.1;
                scale = 1.8;
                yOff = -60 * (1 - p) + 10 * p;
                ang = -Math.PI / 4 + (Math.PI * 0.8 * p); // Rotate forward hard
            } else {
                // Recoil
                scale = 1.8;
                yOff = 10;
                ang = -Math.PI / 4 + Math.PI * 0.8;
                ctx.globalAlpha = Math.max(0, fx.life / 0.5);
            }

            // Draw Hammer Image
            if (fx.life > 0.05) {
                ctx.save();
                ctx.rotate(ang);
                ctx.translate(0, yOff);
                ctx.scale(scale, scale);
                // Draw image anchored at handle bottom
                if (hammerImg.complete) {
                    // Offset so pivot is handle bottom
                    ctx.drawImage(hammerImg, -40, -100, 80, 100);
                }
                ctx.restore();
            }

            // --- Impact Flash at 50% ---
            if (progress >= 0.5 && progress < 0.65) {
                if (progress < 0.52) {
                    // Trigger shake exactly once
                    if (State.screenShake < 5) State.screenShake = 20;
                }

                const flashP = (progress - 0.5) / 0.15;
                // Bright white flash
                ctx.globalCompositeOperation = 'overlay';
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - flashP})`;
                ctx.beginPath(); ctx.arc(0, 0, CELL_SIZE * 2, 0, Math.PI * 2); ctx.fill();

                ctx.globalCompositeOperation = 'source-over';
                // Shockwave
                ctx.strokeStyle = `rgba(255, 200, 50, ${1 - flashP})`;
                ctx.lineWidth = 15 * (1 - flashP);
                ctx.beginPath(); ctx.arc(0, 0, CELL_SIZE * (0.5 + flashP * 2), 0, Math.PI * 2); ctx.stroke();

                // Electric sparks/cracks
                ctx.strokeStyle = `rgba(100, 200, 255, ${1 - flashP})`;
                ctx.lineWidth = 3;
                for (let k = 0; k < 4; k++) {
                    ctx.save(); ctx.rotate(Math.PI / 2 * k);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(10 + Math.random() * 10, -20);
                    ctx.lineTo(-10, -40);
                    ctx.lineTo(20, -70);
                    ctx.stroke();
                    ctx.restore();
                }
            }

        } else if (fx.type === 'tnt') {
            // --- Cinematic TNT Logic ---
            // Phase 1: Thrown in (0.0 - 0.4)
            // Phase 2: Pulse/Sizzle (0.4 - 0.5)
            // Phase 3: BOOM (0.5)

            if (progress < 0.5) {
                // Projectile phase
                const p = progress / 0.5;
                // Parabolic arc? Or just spin in.
                const yOff = -300 * Math.pow(1 - p, 2); // Drop in
                const spin = p * Math.PI * 4;
                const scale = 0.5 + 0.5 * p;

                ctx.translate(0, yOff);
                ctx.rotate(spin);
                ctx.scale(scale, scale);

                if (tntImg.complete) {
                    ctx.drawImage(tntImg, -30, -30, 60, 60);
                }

                // Fuse spark
                if (progress > 0.4) {
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath(); ctx.arc(20, -25, 5 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
                }

            } else {
                // Explosion Phase
                if (progress < 0.52 && State.screenShake < 10) State.screenShake = 30;

                const expP = (progress - 0.5) / 0.5; // 0 to 1
                const radius = CELL_SIZE * 4.0;

                ctx.globalAlpha = 1 - expP;

                // Layer 1: Shockwave
                ctx.beginPath();
                ctx.arc(0, 0, radius * expP * 1.5, 0, Math.PI * 2);
                ctx.lineWidth = 20 * (1 - expP);
                ctx.strokeStyle = 'white';
                ctx.stroke();

                // Layer 2: Fireball (Complex)
                const fireScale = Math.sin(expP * Math.PI) * 1.2;
                const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#222'];

                for (let k = 0; k < 8; k++) {
                    ctx.save();
                    const ang = (Math.PI * 2 / 8) * k;
                    const d = radius * 0.5 * expP;
                    ctx.translate(Math.cos(ang) * d, Math.sin(ang) * d);
                    ctx.fillStyle = colors[k % 4];
                    ctx.beginPath();
                    ctx.arc(0, 0, radius * 0.4 * (1 - expP), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Center Core
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(0, 0, radius * 0.3 * (1 - expP), 0, Math.PI * 2); ctx.fill();

                // Debris
                ctx.fillStyle = '#3E2723';
                const debrisCount = 12;
                for (let d = 0; d < debrisCount; d++) {
                    const a = (Math.PI * 2 / debrisCount) * d + expP;
                    const dist = radius * 1.2 * expP;
                    const s = 8 * (1 - expP);
                    ctx.fillRect(Math.cos(a) * dist, Math.sin(a) * dist, s, s);
                }
            }
        }

        ctx.restore();

        if (fx.life <= 0) {
            State.effects.splice(i, 1);
            // Ensure final cleanup of any shake drift if needed
            if (State.screenShake < 1) State.screenShake = 0;
        }
    }
}

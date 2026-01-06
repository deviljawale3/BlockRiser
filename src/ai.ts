import { State, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE, spawnText, showToast } from './game';

const API_KEY = (window as any).process?.env?.GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;

export async function getAIHint() {
    if (!API_KEY || API_KEY.includes("PLACEHOLDER")) {
        showToast("Gemini API Key missing or invalid!", true);
        return;
    }

    showToast("AI analyzing grid...", true);

    // Prepare grid state for Gemini
    const gridState = State.grid.map(row =>
        row.map(cell => cell ? 1 : 0)
    );

    const queueState = State.queue.map(p => {
        if (!p) return null;
        return {
            id: p.shapeId,
            map: p.map
        };
    }).filter(p => p !== null);

    const prompt = `
        You are an expert AI for the game BlockRiser (a tetris-like block puzzle on an 8x8 grid).
        CURRENT GRID (8x8, 0=empty, 1=filled):
        ${JSON.stringify(gridState)}

        PLAYER QUEUE (Pieces available):
        ${JSON.stringify(queueState)}

        TASK:
        Find the BEST move for the FIRST piece in the queue (index 0).
        Consider:
        1. Clearing lines (rows or columns).
        2. Leaving space for future pieces.
        3. Avoiding holes.

        RESPONSE FORMAT:
        Return ONLY a JSON object: {"pieceIndex": 0, "x": <col>, "y": <row>, "reason": "<short text>"}
        If no move is possible for index 0, try index 1 or 2.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
            const hint = JSON.parse(content);
            visualizeHint(hint);
        }
    } catch (e) {
        console.error("AI Hint Error:", e);
        showToast("AI is offline.");
    }
}

function visualizeHint(hint: { pieceIndex: number, x: number, y: number, reason: string }) {
    // Spawn floating text with the reason
    spawnText(hint.reason, 400, 300, '#00d2ff', 30);

    // Briefly highlight the suggested position on the grid
    const startX = GRID_OFFSET_X + hint.x * CELL_SIZE;
    const startY = GRID_OFFSET_Y + hint.y * CELL_SIZE;

    // We'll add a temporary "glow" particle at the target
    import('./game').then(m => {
        m.spawnPart(startX + CELL_SIZE, startY + CELL_SIZE, '#FFF', 20, 'spark');
    });

    showToast(`AI Suggests: Piece ${hint.pieceIndex + 1} at ${hint.x},${hint.y}`, true);
}

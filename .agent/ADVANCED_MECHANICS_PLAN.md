# Implementation Plan - Advanced Mechanics & Nano Banana Personality

This plan outlines the steps to implement advanced gameplay mechanics (Ice/Chain blocks), the Nano Banana mascot with reactive dialogue, and cosmetic enhancements.

## 1. Mascot Integration (Nano Banana)
- [ ] **UI Structure**: Add a mascot container in `index.html` that floats near the game board.
- [ ] **Animations**: Implement CSS animations for Nano Banana (idle bobbing, excited jump, sad shake).
- [ ] **Dialogue System**: Create a `MascotSys` in `src/render.ts` (or a separate file) to handle speech bubbles.
- [ ] **Triggers**:
    - Combo (2x, 3x, 4x+) -> "UNBELIEVABLE!", "JUICY!", "BANANA POWER!"
    - Level Up -> "We're growing!"
    - Near Game Over -> "Don't slip now!"
    - Game Over -> "Aww, let's try again!"

## 2. Advanced Mechanics (Obstacles)
- [ ] **Ice Blocks**:
    - Add `ice: number` property to grid cells (0 = no ice, 1 = cracked, 2 = solid ice).
    - Grid cells with ice don't disappear on the first clear; they decrement the ice level.
    - Add visual rendering for ice layers (translucent blue overlay with cracks).
- [ ] **Chain Blocks**:
    - Add `chained: boolean` property.
    - Chained blocks cannot be removed by hammers/bombs until the chain is broken by a line clear.
    - Add visual rendering for chains (metal link overlay).
- [ ] **Level Integration**: Add these obstacles to new or existing `ADVENTURE_LEVELS`.

## 3. Cosmetics (Skins & Trails)
- [ ] **Block Skins**:
    - Define skin sets (e.g., "Crystal", "Neon Noir", "Woodland").
    - Update `drawBlock` in `render.ts` to respect the selected skin.
- [ ] **Drag Trails**:
    - Implement a trail effect following the piece being dragged.
    - Different trail colors/particles based on the piece color.

## 4. Light Narrative
- [ ] **Flavor Text**: Add unique one-liners for each world in the world map or before levels.
- [ ] **Context**: "Nano Banana needs your help to rebuild the Toy Kingdom!"

---

## Technical Details

### Grid Cell Update
Update `GridCell` interface (if it exists, currently it's used as `any` in some places) to include:
```typescript
interface GridCell {
    color: string;
    type: 'normal' | 'gold' | 'metal' | 'gem' | 'ice' | 'chain' | ...;
    iceLevel?: number;
    isChained?: boolean;
    // ... existing props
}
```

### Rendering
- Add `drawIceOverlay(ctx, x, y, level)`
- Add `drawChainOverlay(ctx, x, y)`
- Add `drawMascotDialogue(ctx, text)`

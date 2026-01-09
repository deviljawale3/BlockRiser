# BlockRiser - Toy Edition: Changes Summary

## Date: January 7, 2026

## Overview
Successfully transformed BlockRiser from "Tycoon Edition" to "Toy Edition" with comprehensive theme changes and significant gameplay enhancements.

---

## 1. THEME CHANGES (Tycoon → Toy Edition)

### Files Modified:
- `index.html` - Main UI and all overlays
- `public/manifest.json` - PWA manifest
- `public/manifest.webmanifest` - Web app manifest

### Detailed Text Changes:

#### Main Menu
| Before | After |
|--------|-------|
| TYCOON EDITION | TOY EDITION |
| NEW VENTURE | NEW GAME |
| Start a new game | Start a new adventure |
| RECOVER ASSETS | CONTINUE |
| Continue current run | Resume your game |
| Master the Markets | Learn the Basics |

#### Navigation Bar
| Before | After | Icon |
|--------|-------|------|
| MARKET (🛒) | TOY SHOP (🧸) | Changed |
| HQ (🏦) | TOY BOX (🎁) | Changed |
| WORLD (🌎) | WORLDS (🗺️) | Changed |

#### Overlays & Screens
| Screen | Before | After |
|--------|--------|-------|
| HQ Screen | BLOCK HQ | TOY BOX |
| HQ Status | Small Office | Starter Set |
| HQ Section | ACQUISITIONS | COLLECTION |
| Policy Screen | BOARD ROOM | POWER ROOM |
| Policy Subtitle | SELECT COMPAY POLICY | SELECT SPECIAL POWER |
| Policy Button | Skip Policy | Skip Power |
| Shop Title | MEGA SHOP | TOY SHOP |
| Pause Title | STALLED | PAUSED |
| Pause Subtitle | MARKET ON HOLD | GAME ON HOLD |
| Pause Resume | RESUME VENTURE | RESUME GAME |
| Pause Quit | LIQUIDATE ASSETS | QUIT GAME |

#### Mode Selection
| Mode | Before | After |
|------|--------|-------|
| Adventure | Conquer Global Markets | Explore Toy Worlds |
| Bomb Rush | Defuse Financial Crises | Beat the Clock! |
| Mode Select | CHOOSE YOUR STRATEGY | PICK YOUR PLAYSTYLE |
| Back Button | Return to HQ | Back to Toy Box |

#### Tutorial Content
| Before | After |
|--------|-------|
| earn profit! | earn points! |
| Tycoon Strategy | Combo Strategy |
| rival CEOs and take over their assets | bosses and unlock their treasures |

---

## 2. GAMEPLAY ENHANCEMENTS

### A. Enhanced Scoring System (`src/game.ts` lines 967-1007)

#### New Combo Multiplier Formula:
```typescript
// Before:
pts = lines * 100 * (lines > 1 ? lines : 1) * (streak > 1 ? streak * 0.5 : 1) * level

// After:
comboMultiplier = lines > 1 ? Math.pow(lines, 1.3) : 1
streakMultiplier = streak > 1 ? (1 + (streak * 0.3)) : 1
pts = lines * 100 * comboMultiplier * streakMultiplier * level
```

**Impact:**
- 2-line combo: ~2.5x multiplier (was 2x)
- 3-line combo: ~3.7x multiplier (was 3x)
- 4-line combo: ~5.3x multiplier (was 4x)
- Streak bonus: 30% per streak level (was 50% total)

#### Enhanced Coin Rewards:
| Condition | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Base (per line) | 5 coins | 5 coins | - |
| 2+ lines bonus | +5 per line | +10 per line | +100% |
| 3+ lines bonus | - | +15 per line | NEW |
| Streak bonus | +2 per streak | +3 per streak | +50% |
| 5+ streak bonus | - | +50 coins | NEW |

**Example Rewards:**
- 2-line clear with 3 streak: 10 + 20 + 9 = **39 coins** (was 19)
- 3-line clear with 5 streak: 15 + 30 + 45 + 15 + 50 = **155 coins** (was 35)
- 4-line clear with 7 streak: 20 + 40 + 60 + 21 + 50 = **191 coins** (was 48)

#### New Visual Feedback:
- **MEGA COMBO!** text for 4+ line clears
- Enhanced vibration patterns for mega combos
- Golden color (#FFD700) for mega combo text

---

### B. Improved Level Progression (`src/game.ts` lines 1234-1265)

#### Reward Changes Per Level:
| Reward Type | Before | After |
|-------------|--------|-------|
| Hammers | +1 | +2 |
| Rerolls | - | +1 every 2 levels |
| Bombs | +1 every 3 levels | +1 every 3 levels |
| Undos | - | +1 every 5 levels |
| Coins | - | +100 every 5 levels |

#### New Milestone Celebrations:
- **Every 5 levels**: Bonus toast message + extra rewards
- **Every 10 levels**: Large golden "LEVEL X!" text + special vibration pattern

**Progression Example (Levels 1-10):**
| Level | Hammers | Rerolls | Bombs | Undos | Coins | Special |
|-------|---------|---------|-------|-------|-------|---------|
| 1 | +2 | - | - | - | - | - |
| 2 | +2 | +1 | - | - | - | - |
| 3 | +2 | - | +1 | - | - | - |
| 4 | +2 | +1 | - | - | - | - |
| 5 | +2 | - | - | +1 | +100 | Bonus! |
| 6 | +2 | +1 | +1 | - | - | - |
| 7 | +2 | - | - | - | - | - |
| 8 | +2 | +1 | - | - | - | - |
| 9 | +2 | - | +1 | - | - | - |
| 10 | +2 | +1 | - | +1 | +100 | MEGA! |

---

### C. Enhanced Special Blocks (`src/game.ts` lines 238-262)

#### Improved Spawn Rates:

| Block Type | Before | After | Level Req |
|------------|--------|-------|-----------|
| **Gold** | 5% per magnet level | 2% base + 8% per magnet level | Any |
| **Metal** | 5% at level 5+ | 8% at level 3+ | 3+ (was 5+) |
| **Multiplier** | 3% | 6% | Any |
| **Inflation** | 4% at level 8+ | 5% at level 6+ | 6+ (was 8+) |
| **Liquid** | 4% at level 6+ | 5% at level 4+ | 4+ (was 6+) |
| **Crypto** | 3% at level 10+ | 4% at level 8+ | 8+ (was 10+) |

#### New Multiplier Block Colors:
- **Square multiplier** (2x): Red (#FF6B6B)
- **Cross multiplier** (1.5x): Cyan (#4ECDC4)
- Makes multiplier blocks visually distinct and easier to identify

#### Impact:
- **Gold blocks**: With max magnet (level 5): 42% chance (was 25%)
- **Special blocks**: Appear 6-8 levels earlier
- **Overall variety**: ~25% of pieces have special properties (was ~15%)

---

## 3. TECHNICAL IMPROVEMENTS

### Code Quality:
- Added descriptive comments for all enhanced systems
- Improved formula readability with intermediate variables
- Better separation of concerns (combo vs streak multipliers)

### Balance Changes:
- Early game: More rewarding with frequent power-ups
- Mid game: Special blocks appear earlier for variety
- Late game: Milestone bonuses keep progression exciting
- Combos: Exponentially rewarding to encourage strategic play

---

## 4. PLAYER EXPERIENCE IMPROVEMENTS

### Immediate Benefits:
1. **More Generous Rewards**: 2-3x more coins from combos
2. **Faster Progression**: Double hammers per level
3. **Better Variety**: Special blocks appear much earlier
4. **Clearer Feedback**: Visual indicators for multiplier types
5. **Milestone Excitement**: Special celebrations every 5/10 levels

### Strategic Depth:
1. **Combo Focus**: Exponential rewards encourage planning multi-line clears
2. **Streak Building**: Consecutive clears now significantly more valuable
3. **Special Block Strategy**: Multiplier blocks are color-coded for planning
4. **Resource Management**: More power-ups available for tactical use

### Accessibility:
1. **Toy Theme**: More family-friendly and approachable
2. **Clearer Language**: "Points" instead of "profit", "Game" instead of "Venture"
3. **Playful Icons**: Toys (🧸🎁) instead of business (🏦🛒)
4. **Simplified Terms**: "Power" instead of "Policy", "Collection" instead of "Acquisitions"

---

## 5. FILES CHANGED SUMMARY

### Modified Files:
1. **index.html** (20,769 bytes)
   - 30+ text changes across all UI elements
   - Updated icons for navigation
   - Revised tutorial content

2. **public/manifest.json**
   - Name: "BlockRiser: Toy Edition"
   - Description: "The ultimate block-matching toy adventure"

3. **public/manifest.webmanifest**
   - Name: "BlockRiser Toy"
   - Description: "Hyper-casual block puzzle game with toy mechanics"

4. **src/game.ts** (62,803 bytes)
   - Enhanced scoring system (lines 967-1007)
   - Improved level progression (lines 1234-1265)
   - Better special block spawning (lines 238-262)

### New Files:
1. **PROJECT_REVIEW.md** - Comprehensive project documentation
2. **CHANGES_SUMMARY.md** - This file

---

## 6. TESTING RECOMMENDATIONS

### Critical Tests:
1. ✓ Theme consistency across all screens
2. ✓ Scoring calculations with various combo sizes
3. ✓ Level progression rewards at milestones
4. ✓ Special block spawn rates at different levels
5. ⚠ Input handling after game start (known issue)
6. ⚠ Save/load functionality (known issue)

### Suggested Test Scenarios:
1. **Combo Test**: Clear 2, 3, 4 lines simultaneously - verify scoring
2. **Streak Test**: Clear 5+ consecutive times - verify bonus coins
3. **Level Test**: Reach levels 5, 10, 15 - verify milestone rewards
4. **Special Blocks**: Play to level 10 - verify all block types appear
5. **Multiplier Test**: Use multiplier blocks - verify frenzy activation

---

## 7. KNOWN ISSUES (Not Fixed)

From conversation history, these issues still need attention:

1. **Input/Swiping**: Blocks may not be draggable after "New Game" selection
   - Location: `src/input.ts`
   - Likely cause: Initialization timing

2. **Resume/Continue**: Saved games may not load properly
   - Location: `src/game.ts` SaveManager.loadGame()
   - Likely cause: Piece re-initialization

3. **Missing Pieces**: Queue may not fill in some scenarios
   - Location: `src/game.ts` fillQueue()
   - Likely cause: Race conditions

---

## 8. FUTURE ENHANCEMENT IDEAS

### Visual (Toy Theme):
- Replace block sprites with toy-themed graphics
- Add playroom/toy box background
- Implement toy character mascot
- Use confetti/sparkles instead of generic particles

### Gameplay:
- Add piece rotation before placement
- Implement ghost piece preview
- Create interactive tutorial mode
- Add daily challenges

### Progression:
- Replace acquisitions with toy collection
- Implement toy box customization
- Create themed worlds (blocks, dolls, cars, etc.)
- Add sticker-based achievements

---

## CONCLUSION

The transformation to "Toy Edition" is complete with:
- ✅ Full theme rebranding (30+ text changes)
- ✅ Enhanced scoring system (2-3x more rewarding)
- ✅ Improved progression (double power-up drops)
- ✅ Better special blocks (earlier access, higher rates)
- ✅ Comprehensive documentation

The game is now more:
- **Rewarding**: Generous combo and streak bonuses
- **Accessible**: Family-friendly toy theme
- **Engaging**: Frequent milestone celebrations
- **Strategic**: Exponential combo rewards

**Next Steps**: Address input handling and save/load issues for a fully polished experience.

## 9. BUG FIXES (COMPLETED)

### Input System (`src/input.ts`):
- Added robust null checks for touch events
- Improved touch/mouse coordinate normalization
- Added logic to automatically unpause game on tap
- Fixed potential race condition where input handlers missed state updates

### Save/Resume System (`src/game.ts`):
- Enhanced `loadGame` to validate queue state before resuming
- Added forced re-render after loading save game
- Fixed "Recover Assets" button logic (now displays "Welcome Back!")
- Added safety initialization in `fillQueue`
- Fixed "Recovery Failed" message to be user-friendly

### Miscellaneous:
- Renamed Boss "CEO RIVAL" to "TOY MASTER"
- Updated Boss UI label to "EPIC BOSS"
- Updated in-game toast messages to use Toy terminology (e.g. "Magic Splash", "Bubble Shield")

## 10. VISUAL THEME OVERHAUL (Color Wood Jam Style)
- **Wood Aesthetic**: Switched to a warm wood texture background (`#3E2723`, `#5D4037`)
- **Natural Accents**: UI elements feature wooden plank styling with bevels and shadows
- **Painted Colors**: Block palettes updated to "Painted Wood" tones (Red, Green, Blue, Gold)
- **Mechanical UI**: Buttons and HUD resemble physical wooden/brass components



## 11. ADVENTURE MODE REDESIGN (Block Blast Style)
- **New Progression Logic**: implemented detailed level structure with 10 Block Blast style levels.
- **Move Limits**: Added move limit mechanic to Adventure Mode levels (e.g., Clear 30 gems in 40 moves).
- **Goal Types**: Replicated classic goals: "Collect Toys (Gems)", "Score Points", "Clear Lines", "Defeat Boss".
- **UI Updates**: 
    - HUD now displays "MOVES" instead of "BEST" in Adventure Mode.
    - Adventure Menu cards show specific Move Limits for each level.
- **Fail Condition**: Running out of moves without meeting the goal triggers Game Over.
- **Victory Condition**: Meeting the goal triggers Level Complete + Next Level unlock.

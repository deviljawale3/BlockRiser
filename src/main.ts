import {
    State, GlobalStats, SaveManager, AudioSys,
    DAILY_REWARDS, STATE_KEY
} from './game';
import { setupInput } from './input';

export function checkDailyRewards() {
    const today = new Date().toDateString();
    if (GlobalStats.lastLogin !== today) {
        if (GlobalStats.lastLogin) {
            const last = new Date(GlobalStats.lastLogin);
            const diff = (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
            if (diff > 1 && diff < 2) GlobalStats.dailyStreak++;
            else if (diff >= 2) GlobalStats.dailyStreak = 0;
        } else {
            GlobalStats.dailyStreak = 0;
        }

        document.getElementById('menu-overlay')?.classList.add('hidden');
        document.getElementById('daily-overlay')?.classList.remove('hidden');

        const grid = document.getElementById('daily-grid');
        if (grid) {
            grid.innerHTML = '';
            const currentDay = GlobalStats.dailyStreak % 7;

            DAILY_REWARDS.forEach((rw, idx) => {
                const isClaimed = idx < currentDay;
                const isActive = idx === currentDay;
                const d = document.createElement('div');
                d.className = `daily-day ${isClaimed ? 'claimed' : ''} ${isActive ? 'active' : 'locked'}`;
                d.innerHTML = `
                    <div class="day-label">Day ${rw.day}</div>
                    <div class="day-icon">${rw.icon}</div>
                    <div class="day-reward">${rw.val}</div>
                `;
                grid.appendChild(d);
            });
        }

        const claimBtn = document.getElementById('btn-claim-daily');
        if (claimBtn) {
            claimBtn.onclick = () => {
                const currentDay = GlobalStats.dailyStreak % 7;
                const reward = DAILY_REWARDS[currentDay];
                if (reward.type === 'coin') GlobalStats.coins += reward.val;
                else GlobalStats.inventory[reward.type as keyof typeof GlobalStats.inventory] += reward.val;

                GlobalStats.lastLogin = today;
                SaveManager.saveGlobalStats();
                document.getElementById('daily-overlay')?.classList.add('hidden');
                document.getElementById('menu-overlay')?.classList.remove('hidden');
                import('./game').then(m => {
                    m.showToast(`Claimed ${reward.val} ${reward.type.toUpperCase()}!`, true);
                    AudioSys.sfx.tada();
                });
            };
        }
    }
}

function hideSplash() {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        }
    }, 3000); // 3 seconds as requested
}

// Main Entry Point
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
        setupInput(canvas);

        SaveManager.loadGlobalStats();
        SaveManager.loadLeaderboard();
        checkDailyRewards();

        if (localStorage.getItem(STATE_KEY)) {
            document.getElementById('btn-resume')?.classList.remove('hidden');
        }

        hideSplash();
    }
});

class UIManager {
    constructor(game) {
        this.game = game;
        this.gameField = document.getElementById('gameField');
        
        console.log('UIManager initialized, gameField:', this.gameField);
        this.updateGameFieldSize();
        window.addEventListener('resize', () => this.updateGameFieldSize());
    }

    updateGameFieldSize() {
        this.gameFieldRect = this.gameField.getBoundingClientRect();
        console.log('Game field size updated:', this.gameFieldRect);
    }

    showScreen(screenName) {
        console.log(`🖥️ Showing screen: ${screenName}`);
        
        // Скрыть все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Показать нужный экран
        const screen = document.getElementById(screenName);
        if (screen) {
            screen.classList.remove('hidden');
        } else {
            console.error(`❌ Screen not found: ${screenName}`);
        }
        
        // Обновить размеры игрового поля при показе игрового экрана
        if (screenName === 'gameScreen') {
            setTimeout(() => {
                this.updateGameFieldSize();
                console.log('Game screen activated, field size:', this.gameFieldRect);
            }, 100);
        }
    }

    updateHUD() {
        if (this.game.gameState !== 'playing') return;

        try {
            const castle = this.game.castle;
            
            // Здоровье замка
            const healthPercent = (castle.health / castle.maxHealth) * 100;
            const healthBar = document.getElementById('healthBar');
            const healthText = document.getElementById('healthText');
            
            if (healthBar) healthBar.style.width = `${Math.max(0, healthPercent)}%`;
            if (healthText) healthText.textContent = 
                `${Math.round(castle.health)}/${Math.round(castle.maxHealth)}`;
            
            // Опыт
            const xpPercent = (this.game.experience / this.game.experienceToNextLevel) * 100;
            const xpBar = document.getElementById('xpBar');
            const levelText = document.getElementById('levelText');
            
            if (xpBar) xpBar.style.width = `${Math.min(100, xpPercent)}%`;
            if (levelText) levelText.textContent = `Ур. ${this.game.level}`;
            
            // Монеты и волна
            const coinsValue = document.getElementById('coinsValue');
            const waveValue = document.getElementById('waveValue');
            
            if (coinsValue) coinsValue.textContent = Math.round(this.game.coins);
            if (waveValue) waveValue.textContent = this.game.waveManager.currentWave;
            
            // Обновить цены на улучшения
            this.updateUpgradeButtons();
            
        } catch (error) {
            console.error('Error updating HUD:', error);
        }
    }

    updateUpgradeButtons() {
        const upgrades = {
            damage: { basePrice: 10, multiplier: 1.5 },
            range: { basePrice: 15, multiplier: 1.6 },
            reload: { basePrice: 12, multiplier: 1.5 },
            health: { basePrice: 20, multiplier: 1.7 }
        };
        
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            const type = btn.dataset.upgrade;
            if (!type) return;
            
            const upgrade = this.game.upgradeManager.upgrades[type];
            if (!upgrade) return;
            
            const price = Math.floor(upgrades[type].basePrice * Math.pow(upgrades[type].multiplier, upgrade.level));
            const levelElement = btn.querySelector('.upgrade-level');
            const priceElement = btn.querySelector('.upgrade-price');
            
            if (levelElement) levelElement.textContent = `Ур. ${upgrade.level + 1}`;
            if (priceElement) priceElement.textContent = `${price} монет`;
            
            btn.disabled = this.game.coins < price;
        });
    }

    showGameOverScreen(wave, coins, exp) {
        const finalWave = document.getElementById('finalWave');
        const finalCoins = document.getElementById('finalCoins');
        const finalExp = document.getElementById('finalExp');
        
        if (finalWave) finalWave.textContent = wave;
        if (finalCoins) finalCoins.textContent = coins;
        if (finalExp) finalExp.textContent = exp;
        
        this.showScreen('gameOverScreen');
    }
}
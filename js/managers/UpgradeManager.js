class UpgradeManager {
    constructor(game) {
        this.game = game;
        
        // Постоянные улучшения
        this.upgrades = {
            damage: { level: 0, multiplier: 1.0, basePrice: GameConfig.upgradePrices.damage.base },
            range: { level: 0, multiplier: 1.0, basePrice: GameConfig.upgradePrices.range.base },
            reload: { level: 0, multiplier: 1.0, basePrice: GameConfig.upgradePrices.reload.base },
            health: { level: 0, multiplier: 1.0, basePrice: GameConfig.upgradePrices.health.base }
        };
        
        // Тактические улучшения
        this.tacticalUpgrades = {
            wall: false,
            tower: false,
            moat: false,
            defenders: false
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Удаляем старые обработчики и добавляем новые
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const upgradeType = btn.dataset.upgrade;
                console.log('Upgrade button clicked:', upgradeType);
                
                if (upgradeType) {
                    this.purchaseUpgrade(upgradeType);
                }
            });
        });
    }

    getCurrentPrice(type) {
        const upgrade = this.upgrades[type];
        const priceConfig = GameConfig.upgradePrices[type];
        return Math.floor(priceConfig.base * Math.pow(priceConfig.multiplier, upgrade.level));
    }

    purchaseUpgrade(type) {
        const price = this.getCurrentPrice(type);
        
        console.log(`Attempting to purchase ${type} upgrade for ${price} coins. Current coins: ${this.game.coins}`);
        
        if (this.game.coins >= price) {
            this.game.coins -= price;
            this.upgrades[type].level++;
            
            this.applyUpgrade(type);
            this.game.uiManager.updateHUD();
            
            console.log(`Upgrade ${type} purchased. New level: ${this.upgrades[type].level}`);
            
            this.showPurchaseEffect(type);
        } else {
            console.log(`Not enough coins. Need ${price}, have ${this.game.coins}`);
            this.showErrorEffect(type);
        }
    }

    applyUpgrade(type) {
        const castle = this.game.castle;
        
        switch(type) {
            case 'damage':
                castle.damage = Math.floor(castle.damage * 1.1);
                this.upgrades.damage.multiplier *= 1.1;
                break;
            case 'range':
                castle.attackRange = Math.floor(castle.attackRange * 1.05);
                this.upgrades.range.multiplier *= 1.05;
                break;
            case 'reload':
                castle.attackSpeed *= 1.05;
                this.upgrades.reload.multiplier *= 1.05;
                break;
            case 'health':
                castle.maxHealth = Math.floor(castle.maxHealth * 1.2);
                castle.health = castle.maxHealth;
                this.upgrades.health.multiplier *= 1.2;
                break;
        }
    }

    applyLevelUpUpgrade(type) {
        console.log('Applying level up upgrade:', type);
        
        const reward = GameConfig.levelUpRewards[type];
        if (!reward) return;
        
        switch(type) {
            case 'wall':
                this.tacticalUpgrades.wall = true;
                reward.apply(this.game.castle);
                break;
                
            case 'tower':
                if (!this.tacticalUpgrades.tower) {
                    this.tacticalUpgrades.tower = true;
                    // Добавляем башню
                    const success = this.game.castle.addTower();
                    if (!success) {
                        console.log('Cannot add more towers');
                    }
                } else {
                    // Пытаемся добавить еще одну башню
                    this.game.castle.addTower();
                }
                break;
                
            case 'moat':
                if (!this.tacticalUpgrades.moat) {
                    this.tacticalUpgrades.moat = true;
                    this.game.isMoatActive = true;
                    this.createMoatVisual();
                }
                break;
                
            case 'defenders':
                this.tacticalUpgrades.defenders = true;
                this.game.addDefenders(2);
                break;
        }
        
        this.game.uiManager.showScreen('gameScreen');
        this.game.gameState = 'playing';
    }
    
    createMoatVisual() {
        const moatElement = document.createElement('div');
        moatElement.className = 'moat-visual';
        moatElement.style.position = 'absolute';
        moatElement.style.left = '250px';
        moatElement.style.top = '0';
        moatElement.style.width = '20px';
        moatElement.style.height = '100%';
        moatElement.style.background = 'linear-gradient(90deg, #4a90e2, #357abd)';
        moatElement.style.opacity = '0.3';
        moatElement.style.borderLeft = '3px solid #4cc9f0';
        moatElement.style.borderRight = '3px solid #4cc9f0';
        moatElement.style.zIndex = '5';
        moatElement.style.pointerEvents = 'none';
        
        const waterSprite = document.createElement('div');
        waterSprite.style.position = 'absolute';
        waterSprite.style.left = '-20px';
        waterSprite.style.top = '50%';
        waterSprite.style.transform = 'translateY(-50%)';
        waterSprite.style.fontSize = '40px';
        waterSprite.innerHTML = '💧🌊💧';
        moatElement.appendChild(waterSprite);
        
        this.game.uiManager.gameField.appendChild(moatElement);
    }

    showPurchaseEffect(type) {
        const btn = document.querySelector(`.upgrade-btn[data-upgrade="${type}"]`);
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            btn.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                btn.style.transform = '';
                btn.style.backgroundColor = '';
            }, 200);
        }
    }

    showErrorEffect(type) {
        const btn = document.querySelector(`.upgrade-btn[data-upgrade="${type}"]`);
        if (btn) {
            btn.style.backgroundColor = '#ff4444';
            setTimeout(() => {
                btn.style.backgroundColor = '';
            }, 200);
        }
    }

    reset() {
        this.tacticalUpgrades = {
            wall: false,
            tower: false,
            moat: false,
            defenders: false
        };
    }
}
class UpgradeManager {
    constructor(game) {
        this.game = game;
        
        // Постоянные улучшения (покупаются за монеты)
        this.upgrades = {
            damage: { level: 0, multiplier: 1.0 },
            range: { level: 0, multiplier: 1.0 },
            reload: { level: 0, multiplier: 1.0 },
            health: { level: 0, multiplier: 1.0 }
        };
        
        // Тактические улучшения (выбираются при повышении уровня)
        this.tacticalUpgrades = {
            wall: false,
            tower: false,
            moat: false,
            defenders: false
        };
    }

    purchaseUpgrade(type) {
        const prices = {
            damage: 10,
            range: 15,
            reload: 12,
            health: 20
        };
        
        const price = Math.floor(prices[type] * Math.pow(1.5, this.upgrades[type].level));
        
        if (this.game.coins >= price) {
            this.game.coins -= price;
            this.upgrades[type].level++;
            
            this.applyUpgrade(type);
        }
    }

    applyUpgrade(type) {
        const castle = this.game.castle;
        
        switch(type) {
            case 'damage':
                castle.damage *= 1.1;
                this.upgrades.damage.multiplier *= 1.1;
                break;
            case 'range':
                castle.attackRange *= 1.05;
                this.upgrades.range.multiplier *= 1.05;
                break;
            case 'reload':
                castle.attackSpeed *= 1.05;
                this.upgrades.reload.multiplier *= 1.05;
                break;
            case 'health':
                castle.maxHealth *= 1.2;
                castle.health *= 1.2;
                this.upgrades.health.multiplier *= 1.2;
                break;
        }
    }

    applyLevelUpUpgrade(type) {
        switch(type) {
            case 'wall':
                this.tacticalUpgrades.wall = true;
                this.game.castle.maxHealth *= 1.5;
                this.game.castle.health *= 1.5;
                break;
                
            case 'tower':
                this.tacticalUpgrades.tower = true;
                if (this.game.castle.towers < this.game.castle.maxTowers) {
                    this.game.castle.towers++;
                }
                break;
                
            case 'moat':
                this.tacticalUpgrades.moat = true;
                // Замедление врагов (будет применено в Enemy.js)
                break;
                
            case 'defenders':
                this.tacticalUpgrades.defenders = true;
                this.spawnDefenders();
                break;
        }
    }

    spawnDefenders() {
        const fieldRect = this.game.uiManager.gameFieldRect;
        
        // Спауним 2 защитника перед замком
        for (let i = 0; i < 2; i++) {
            const x = 200 + i * 60;
            const y = fieldRect.height / 2 - 30 + (i === 0 ? -40 : 40);
            this.game.defenders.push(new Defender(this.game, x, y));
        }
    }

    reset() {
        // Сбрасываем только тактические улучшения
        // Постоянные улучшения сохраняются между играми
        this.tacticalUpgrades = {
            wall: false,
            tower: false,
            moat: false,
            defenders: false
        };
    }
}
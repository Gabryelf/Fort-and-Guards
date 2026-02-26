class Castle {
    constructor(game) {
        this.game = game;
        
        // Используем конфиг
        this.config = GameConfig.castle;
        
        this.health = this.config.baseHealth;
        this.maxHealth = this.config.baseHealth;
        this.damage = this.config.baseDamage;
        this.attackRange = this.config.baseAttackRange;
        this.attackSpeed = this.config.baseAttackSpeed;
        this.attackCooldown = 0;
        this.criticalChance = this.config.criticalChance;
        this.criticalMultiplier = this.config.criticalMultiplier;
        
        this.element = document.getElementById('castle');
        this.towers = 1;
        this.maxTowers = this.config.maxTowers;
        
        this.createAttackRangeVisual();
    }

    createAttackRangeVisual() {
        this.rangeVisual = document.createElement('div');
        this.rangeVisual.className = 'attack-range-visual';
        this.game.uiManager.gameField.appendChild(this.rangeVisual);
        this.updateRangeVisualPosition();
    }

    updateRangeVisualPosition() {
        if (!this.rangeVisual || !this.element) return;
        
        const castleRect = this.element.getBoundingClientRect();
        const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
        
        // Корректируем позицию относительно gameField
        const relativeLeft = castleRect.left - gameFieldRect.left + castleRect.width;
        const relativeTop = castleRect.top - gameFieldRect.top - 100;
        
        this.rangeVisual.style.left = `${relativeLeft}px`;
        this.rangeVisual.style.top = `${relativeTop}px`;
        this.rangeVisual.style.width = `${this.attackRange}px`;
        this.rangeVisual.style.height = `${castleRect.height + 200}px`;
    }

    update(deltaTime) {
        this.attackCooldown -= deltaTime;
        
        if (this.attackCooldown <= 0) {
            this.attack();
            this.attackCooldown = 1 / this.attackSpeed;
        }
        
        // Медленное восстановление здоровья
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + 0.1 * deltaTime);
        }

        this.updateRangeVisualPosition();
    }

    attack() {
        const target = this.findTarget();
        if (target) {
            for (let i = 0; i < this.towers; i++) {
                // Небольшая задержка между выстрелами из разных башен
                setTimeout(() => {
                    if (!target.isDead && this.game.gameState === 'playing') {
                        this.game.projectiles.push(new Projectile(this.game, this, target));
                    }
                }, i * 50);
            }
        }
    }

    findTarget() {
        let closestEnemy = null;
        let closestDistance = this.attackRange;

        this.game.enemies.forEach(enemy => {
            const distance = this.calculateDistance(enemy);
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });

        return closestEnemy;
    }

    calculateDistance(enemy) {
        const castleRect = this.element.getBoundingClientRect();
        const enemyRect = enemy.element.getBoundingClientRect();
        
        const castleCenter = {
            x: castleRect.left + castleRect.width,
            y: castleRect.top + castleRect.height / 2
        };
        
        const enemyCenter = {
            x: enemyRect.left + enemyRect.width / 2,
            y: enemyRect.top + enemyRect.height / 2
        };
        
        return Math.sqrt(
            Math.pow(castleCenter.x - enemyCenter.x, 2) + 
            Math.pow(castleCenter.y - enemyCenter.y, 2)
        );
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Визуальный эффект
        this.element.style.animation = 'damageFlash 0.3s';
        setTimeout(() => {
            this.element.style.animation = '';
        }, 300);
    }

    getBoundingRect() {
        const rect = this.element.getBoundingClientRect();
        const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
        
        return {
            x: rect.left - gameFieldRect.left,
            y: rect.top - gameFieldRect.top,
            width: rect.width,
            height: rect.height
        };
    }

    reset() {
        this.health = this.maxHealth;
        this.towers = 1;
        if (this.rangeVisual) {
            this.rangeVisual.style.width = `${this.attackRange}px`;
        }
    }
}
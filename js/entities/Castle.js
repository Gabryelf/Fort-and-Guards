class Castle {
    constructor(game) {
        this.game = game;
        
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
        this.spriteUrl = this.config.sprite;
        
        // Загружаем спрайт замка
        this.loadSprite();
        
        this.towers = [];
        this.maxTowers = this.config.maxTowers;
        
        this.createAttackRangeVisual();
    }

    loadSprite() {
        if (window.spriteLoader && this.spriteUrl) {
            window.spriteLoader.loadSprite(this.spriteUrl, this.element, '🏰', false);
        } else {
            this.element.innerHTML = '🏰';
        }
    }

    reset() {
        this.health = this.maxHealth;
        this.towers.forEach(tower => tower.element?.remove());
        this.towers = [];
        console.log('Castle reset');
    }

    createAttackRangeVisual() {
        this.rangeVisual = document.createElement('div');
        this.rangeVisual.className = 'attack-range-visual';
        if (this.game?.uiManager?.gameField) {
            this.game.uiManager.gameField.appendChild(this.rangeVisual);
            this.updateRangeVisualPosition();
        }
    }

    addTower() {
        if (this.towers.length >= this.maxTowers) {
            console.log('Max towers reached');
            return false;
        }
        
        const gameField = this.game?.uiManager?.gameField;
        if (!gameField) return false;
        
        const gameFieldRect = gameField.getBoundingClientRect();
        
        // Фиксированные позиции для башен
        const positions = [
            { x: 80, y: gameFieldRect.height * 0.25, side: 'left' },
            { x: 80, y: gameFieldRect.height * 0.75, side: 'left' },
            { x: 220, y: gameFieldRect.height * 0.35, side: 'right' },
            { x: 220, y: gameFieldRect.height * 0.65, side: 'right' }
        ];
        
        const index = this.towers.length;
        if (index < positions.length) {
            try {
                const tower = new Tower(
                    this.game, 
                    index, 
                    positions[index].x, 
                    positions[index].y,
                    positions[index].side
                );
                this.towers.push(tower);
                console.log(`Tower ${index + 1} added at (${positions[index].x}, ${positions[index].y}) on ${positions[index].side} side`);
                return true;
            } catch (error) {
                console.error('Error creating tower:', error);
                return false;
            }
        }
        
        return false;
    }

    updateRangeVisualPosition() {
        if (!this.rangeVisual || !this.element || !this.game?.uiManager?.gameField) return;
        
        try {
            const castleRect = this.element.getBoundingClientRect();
            const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
            
            const relativeLeft = castleRect.left - gameFieldRect.left + castleRect.width;
            const relativeTop = castleRect.top - gameFieldRect.top - 100;
            
            this.rangeVisual.style.left = `${relativeLeft}px`;
            this.rangeVisual.style.top = `${relativeTop}px`;
            this.rangeVisual.style.width = `${this.attackRange}px`;
            this.rangeVisual.style.height = `${castleRect.height + 200}px`;
        } catch (error) {
            console.error('Error updating range visual:', error);
        }
    }

    update(deltaTime) {
        if (!this.game || this.game.gameState !== 'playing') return;
        
        // Уменьшаем кулдаун
        this.attackCooldown -= deltaTime;
        
        // Проверяем наличие врагов в радиусе и атакуем сразу
        const target = this.findTarget();
        if (target && this.attackCooldown <= 0) {
            this.attack(target);
            this.attackCooldown = 1 / this.attackSpeed;
        }
        
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + 0.1 * deltaTime);
        }

        this.updateRangeVisualPosition();
        
        this.towers.forEach(tower => {
            if (tower && typeof tower.update === 'function') {
                tower.update(deltaTime);
            }
        });
    }

    attack(target) {
        if (!this.game || !target) return;
        
        try {
            this.game.projectiles.push(new Projectile(this.game, this, target));
        } catch (error) {
            console.error('Error creating projectile from castle:', error);
        }
    }

    findTarget() {
        let closestEnemy = null;
        let closestDistance = Infinity;

        if (this.game?.enemies) {
            this.game.enemies.forEach(enemy => {
                if (enemy.isDead) return;
                
                const distance = this.calculateDistance(enemy);
                if (distance < this.attackRange && distance < closestDistance) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });
        }

        return closestEnemy;
    }

    calculateDistance(enemy) {
        if (!enemy || !enemy.element) return Infinity;
        
        try {
            const castleRect = this.element.getBoundingClientRect();
            const enemyRect = enemy.element.getBoundingClientRect();
            
            const castleX = castleRect.left + castleRect.width / 2;
            const castleY = castleRect.top + castleRect.height / 2;
            const enemyX = enemyRect.left + enemyRect.width / 2;
            const enemyY = enemyRect.top + enemyRect.height / 2;
            
            return Math.sqrt(
                Math.pow(castleX - enemyX, 2) + 
                Math.pow(castleY - enemyY, 2)
            );
        } catch (error) {
            return Infinity;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        if (this.element) {
            this.element.style.animation = 'damageFlash 0.3s';
            setTimeout(() => {
                if (this.element) {
                    this.element.style.animation = '';
                }
            }, 300);
        }
    }

    getBoundingRect() {
        if (!this.element || !this.game?.uiManager?.gameField) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        try {
            const rect = this.element.getBoundingClientRect();
            const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
            
            return {
                x: rect.left - gameFieldRect.left,
                y: rect.top - gameFieldRect.top,
                width: rect.width,
                height: rect.height
            };
        } catch (error) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
    }
}
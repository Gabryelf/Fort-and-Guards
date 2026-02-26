class Castle {
    constructor(game) {
        this.game = game;
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 10;
        this.attackRange = 200;
        this.attackSpeed = 1;
        this.attackCooldown = 0;
        this.criticalChance = 0.1;
        this.criticalMultiplier = 2;
        
        this.element = document.getElementById('castle');
        this.towers = 1;
        this.maxTowers = 4;
        
        this.createAttackRangeVisual();
        console.log('Castle created with attack range:', this.attackRange);
    }

    createAttackRangeVisual() {
        // Создаем визуализацию радиуса атаки
        this.rangeVisual = document.createElement('div');
        this.rangeVisual.className = 'attack-range-visual';
        this.rangeVisual.style.position = 'absolute';
        this.rangeVisual.style.left = '0';
        this.rangeVisual.style.top = '50%';
        this.rangeVisual.style.transform = 'translateY(-50%)';
        this.rangeVisual.style.width = this.attackRange + 'px';
        this.rangeVisual.style.height = '200px';
        this.rangeVisual.style.background = 'radial-gradient(circle, rgba(76, 201, 240, 0.2) 0%, rgba(76, 201, 240, 0) 70%)';
        this.rangeVisual.style.border = '2px dashed rgba(76, 201, 240, 0.5)';
        this.rangeVisual.style.borderRadius = '0 100px 100px 0';
        this.rangeVisual.style.pointerEvents = 'none';
        this.rangeVisual.style.zIndex = '1';
        
        this.game.uiManager.gameField.appendChild(this.rangeVisual);
        this.updateRangeVisualPosition();
    }

    updateRangeVisualPosition() {
        if (!this.rangeVisual) return;
        
        const castleRect = this.getBoundingRect();
        this.rangeVisual.style.left = castleRect.width + 'px';
        this.rangeVisual.style.top = (castleRect.top - 100) + 'px';
        this.rangeVisual.style.width = this.attackRange + 'px';
        this.rangeVisual.style.height = (castleRect.height + 200) + 'px';
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
            console.log('Castle attacking enemy at distance:', this.calculateDistance(target));
            for (let i = 0; i < this.towers; i++) {
                this.game.projectiles.push(new Projectile(this.game, this, target));
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
        const castleRect = this.getBoundingRect();
        const enemyRect = enemy.getBoundingRect();
        
        const castleCenter = {
            x: castleRect.x + castleRect.width,
            y: castleRect.y + castleRect.height / 2
        };
        
        const enemyCenter = {
            x: enemyRect.x + enemyRect.width / 2,
            y: enemyRect.y + enemyRect.height / 2
        };
        
        return Math.sqrt(
            Math.pow(castleCenter.x - enemyCenter.x, 2) + 
            Math.pow(castleCenter.y - enemyCenter.y, 2)
        );
    }

    takeDamage(amount) {
        this.health -= amount;
        console.log('Castle took damage:', amount, 'Health remaining:', this.health);
        if (this.health < 0) this.health = 0;
    }

    getBoundingRect() {
        return this.element.getBoundingClientRect();
    }

    reset() {
        this.health = this.maxHealth;
        this.towers = 1;
        if (this.rangeVisual) {
            this.rangeVisual.style.width = this.attackRange + 'px';
        }
    }
}
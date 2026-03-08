class Tower {
    constructor(game, index, x, y, side = 'right') {
        this.game = game;
        this.index = index;
        this.x = x;
        this.y = y;
        this.side = side;
        
        // Конфиг башни
        this.damage = game?.castle?.damage || 10;
        this.attackRange = game?.castle?.attackRange || 250;
        this.attackSpeed = game?.castle?.attackSpeed || 1;
        this.attackCooldown = Math.random() * 0.2; // Быстрый старт
        
        this.spriteUrl = GameConfig.towers?.sprite;
        this.emoji = side === 'left' ? '🏯' : '🏰';
        this.width = GameConfig.towers?.width || 40;
        this.height = GameConfig.towers?.height || 60;
        
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'tower';
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '18';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.fontSize = '30px';
        this.element.style.background = 'none';
        this.element.style.border = 'none';
        
        // Показываем эмодзи как запасной вариант
        this.element.style.color = this.side === 'left' ? '#ffaa00' : '#4cc9f0';
        this.element.innerHTML = this.emoji;
        
        // Загружаем спрайт
        if (window.spriteLoader && this.spriteUrl) {
            window.spriteLoader.loadSprite(this.spriteUrl, this.element, this.emoji, false);
        }
        
        if (this.game?.uiManager?.gameField) {
            this.game.uiManager.gameField.appendChild(this.element);
            this.updateElementPosition();
        }
    }

    update(deltaTime) {
        if (!this.game || this.game.gameState !== 'playing') return;
        
        // Уменьшаем кулдаун
        this.attackCooldown -= deltaTime;
        
        // Ищем цель и атакуем если кулдаун прошел
        const target = this.findTarget();
        if (target && this.attackCooldown <= 0) {
            this.attack(target);
            this.attackCooldown = 1 / this.attackSpeed;
        }
    }

    attack(target) {
        if (!this.game || !target) return;
        
        if (window.Projectile) {
            try {
                const projectile = new Projectile(this.game, this, target);
                this.game.projectiles.push(projectile);
                
                // Визуальный эффект
                if (this.element) {
                    this.element.classList.add('attacking');
                    setTimeout(() => {
                        if (this.element) {
                            this.element.classList.remove('attacking');
                        }
                    }, 200);
                }
            } catch (error) {
                console.error('Error creating projectile from tower:', error);
            }
        }
    }

    findTarget() {
        if (!this.game?.enemies) return null;
        
        let closestEnemy = null;
        let closestDistance = Infinity;

        this.game.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const distance = this.calculateDistance(enemy);
            // Проверяем, что враг в радиусе атаки
            if (distance < this.attackRange && distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });

        return closestEnemy;
    }

    calculateDistance(enemy) {
        if (!enemy) return Infinity;
        
        try {
            const enemyRect = enemy.getBoundingRect();
            const towerX = this.x + this.width / 2;
            const towerY = this.y + this.height / 2;
            const enemyX = enemyRect.x + enemyRect.width / 2;
            const enemyY = enemyRect.y + enemyRect.height / 2;
            
            return Math.sqrt(
                Math.pow(towerX - enemyX, 2) + 
                Math.pow(towerY - enemyY, 2)
            );
        } catch (error) {
            return Infinity;
        }
    }

    updateElementPosition() {
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
    }
}
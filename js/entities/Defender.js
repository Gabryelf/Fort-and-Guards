class Defender {
    constructor(game, x, y, type = 'archer') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = GameConfig.defenders[type] || GameConfig.defenders.archer;
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.damage = this.config.damage;
        this.attackRange = this.config.attackRange;
        this.attackSpeed = this.config.attackSpeed;
        this.attackCooldown = 0;
        this.speed = this.config.speed || 50;
        this.spriteUrl = this.config.sprite;
        this.isDead = false;
        this.isAttacking = false;
        this.currentTarget = null;
        this.formationX = x;
        this.formationY = y;
        this.patrolRange = 30;
        this.width = this.config.width || 40;
        this.height = this.config.height || 40;
        this.collisionRadius = 25;
        this.emoji = this.config.emoji || '🛡️';
        
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `defender ${this.type}`;
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '15';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.fontSize = '24px';
        this.element.style.background = 'none';
        this.element.style.border = 'none';
        this.element.style.pointerEvents = 'none';
        
        // Создаем контейнер для спрайта и здоровья
        this.spriteContainer = document.createElement('div');
        this.spriteContainer.style.width = '100%';
        this.spriteContainer.style.height = '100%';
        this.spriteContainer.style.display = 'flex';
        this.spriteContainer.style.alignItems = 'center';
        this.spriteContainer.style.justifyContent = 'center';
        this.spriteContainer.style.position = 'relative';
        
        // Показываем эмодзи
        this.spriteContainer.innerHTML = this.type === 'archer' ? '🏹' : '⚔️';
        
        // Загружаем спрайт если есть
        if (window.spriteLoader && this.spriteUrl) {
            window.spriteLoader.loadSprite(this.spriteUrl, this.spriteContainer, this.emoji, false);
        }
        
        this.element.appendChild(this.spriteContainer);
        
        // Индикатор здоровья - создаем с правильным позиционированием
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'defender-health-bar';
        this.healthBar.style.position = 'absolute';
        this.healthBar.style.bottom = '-10px';
        this.healthBar.style.left = '50%';
        this.healthBar.style.transform = 'translateX(-50%)';
        this.healthBar.style.width = '80%';
        this.healthBar.style.height = '5px';
        this.healthBar.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
        this.healthBar.style.borderRadius = '3px';
        this.healthBar.style.overflow = 'hidden';
        this.healthBar.style.zIndex = '20';
        this.healthBar.style.border = '1px solid rgba(0,0,0,0.3)';
        
        this.healthFill = document.createElement('div');
        this.healthFill.className = 'defender-health-fill';
        this.healthFill.style.height = '100%';
        this.healthFill.style.width = '100%';
        this.healthFill.style.backgroundColor = '#4CAF50';
        this.healthFill.style.transition = 'width 0.2s ease';
        
        this.healthBar.appendChild(this.healthFill);
        this.element.appendChild(this.healthBar);
        
        if (this.game?.uiManager?.gameField) {
            this.game.uiManager.gameField.appendChild(this.element);
            this.updateElementPosition();
            // Принудительно обновляем полоску
            setTimeout(() => this.updateHealthBar(), 50);
        }
    }

    updateHealthBar() {
        if (this.healthFill) {
            const percent = Math.max(0, (this.health / this.maxHealth) * 100);
            this.healthFill.style.width = `${percent}%`;
            // Меняем цвет в зависимости от здоровья
            if (percent < 25) {
                this.healthFill.style.backgroundColor = '#ff4444';
            } else if (percent < 50) {
                this.healthFill.style.backgroundColor = '#ffaa00';
            } else {
                this.healthFill.style.backgroundColor = '#4CAF50';
            }
        }
    }

    update(deltaTime) {
        if (this.isDead) return;
        
        // Проверяем коллизии с другими защитниками
        this.checkCollisions();
        
        // Поиск ближайшего врага
        this.currentTarget = this.findNearestEnemy();
        
        if (this.currentTarget) {
            // Поведение в зависимости от типа
            if (this.type === 'archer') {
                this.archerBehavior(deltaTime);
            } else {
                this.knightBehavior(deltaTime);
            }
        } else {
            // Если нет врагов, возвращаемся в строй
            this.returnToFormation(deltaTime);
        }
        
        // Атака, если есть цель и она в радиусе
        if (this.currentTarget && this.isInAttackRange(this.currentTarget)) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 0) {
                this.attack(this.currentTarget);
                this.attackCooldown = 1 / this.attackSpeed;
            }
        }
        
        this.updateElementPosition();
    }

    checkCollisions() {
        // Проверяем столкновения с другими защитниками
        this.game.defenders.forEach(other => {
            if (other === this || other.isDead) return;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.collisionRadius + other.collisionRadius) {
                // Раздвигаем защитников
                const angle = Math.atan2(dy, dx);
                const pushX = Math.cos(angle) * 2;
                const pushY = Math.sin(angle) * 2;
                
                this.x += pushX;
                this.y += pushY;
                other.x -= pushX;
                other.y -= pushY;
                
                // Ограничиваем движение
                this.clampPosition();
                other.clampPosition();
            }
        });
    }

    clampPosition() {
        // Ограничиваем позицию в пределах поля
        const gameField = this.game?.uiManager?.gameField;
        if (gameField) {
            const fieldRect = gameField.getBoundingClientRect();
            this.x = Math.max(30, Math.min(fieldRect.width - this.width - 30, this.x));
            this.y = Math.max(30, Math.min(fieldRect.height - this.height - 30, this.y));
        }
    }

    archerBehavior(deltaTime) {
        if (!this.currentTarget) return;
        
        const distance = this.getDistanceToEnemy(this.currentTarget);
        
        if (distance < this.attackRange * 0.4) {
            // Враг слишком близко - отступаем
            const direction = -1;
            this.move(direction * this.speed * deltaTime, 0);
        } else if (distance > this.attackRange * 0.8) {
            // Враг далеко - немного приближаемся
            const direction = 1;
            this.move(direction * this.speed * deltaTime * 0.5, 0);
        }
    }

    knightBehavior(deltaTime) {
        if (!this.currentTarget) return;
        
        const distance = this.getDistanceToEnemy(this.currentTarget);
        
        if (distance > this.attackRange * 0.6) {
            const enemy = this.currentTarget;
            const enemyRect = enemy.getBoundingRect();
            const enemyX = enemyRect.x + enemyRect.width / 2;
            const enemyY = enemyRect.y + enemyRect.height / 2;
            
            const dx = enemyX - (this.x + this.width / 2);
            const dy = enemyY - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const moveX = (dx / dist) * this.speed * deltaTime;
                const moveY = (dy / dist) * this.speed * deltaTime;
                
                const newX = this.x + moveX;
                if (newX <= this.formationX + 150) {
                    this.x = newX;
                    this.y += moveY;
                }
            }
        }
    }

    move(deltaX, deltaY) {
        const newX = this.x + deltaX;
        const newY = this.y + deltaY;
        
        if (Math.abs(newX - this.formationX) <= 150) {
            this.x = newX;
        }
        
        const gameField = this.game?.uiManager?.gameField;
        if (gameField) {
            const fieldRect = gameField.getBoundingClientRect();
            this.y = Math.max(30, Math.min(fieldRect.height - this.height - 30, newY));
        }
    }

    returnToFormation(deltaTime) {
        const dx = this.formationX - this.x;
        const dy = this.formationY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveX = (dx / distance) * this.speed * deltaTime * 0.5;
            const moveY = (dy / distance) * this.speed * deltaTime * 0.5;
            
            this.x += moveX;
            this.y += moveY;
        }
    }

    findNearestEnemy() {
        let nearest = null;
        let minDistance = Infinity;
        
        this.game.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const distance = this.getDistanceToEnemy(enemy);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });
        
        return nearest;
    }

    getDistanceToEnemy(enemy) {
        const enemyRect = enemy.getBoundingRect();
        const enemyX = enemyRect.x + enemyRect.width / 2;
        const enemyY = enemyRect.y + enemyRect.height / 2;
        const defenderX = this.x + this.width / 2;
        const defenderY = this.y + this.height / 2;
        
        return Math.sqrt(
            Math.pow(defenderX - enemyX, 2) + 
            Math.pow(defenderY - enemyY, 2)
        );
    }

    isInAttackRange(enemy) {
        const distance = this.getDistanceToEnemy(enemy);
        return distance <= this.attackRange;
    }

    attack(enemy) {
        if (!enemy || enemy.isDead) return;
        
        enemy.takeDamage(this.damage);
        this.isAttacking = true;
        
        if (this.element) {
            this.element.classList.add('attacking');
            setTimeout(() => {
                if (this.element) {
                    this.element.classList.remove('attacking');
                    this.isAttacking = false;
                }
            }, 200);
        }
        
        if (this.type === 'knight') {
            this.takeDamage(enemy.damage * 0.3);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        if (this.element) {
            this.element.classList.add('dead');
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.remove();
                }
            }, 400);
        }
    }

    updateElementPosition() {
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
    }

    getBoundingRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
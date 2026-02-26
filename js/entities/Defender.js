class Defender {
    constructor(game, x, y, type = 'archer') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Используем конфиг
        this.config = GameConfig.defenders[type] || GameConfig.defenders.archer;
        
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.damage = this.config.damage;
        this.attackRange = this.config.attackRange;
        this.attackSpeed = this.config.attackSpeed;
        this.attackCooldown = 0;
        this.speed = this.config.speed || 50;
        this.preferredDistance = this.config.preferredDistance || 100;
        this.retreatDistance = this.config.retreatDistance || 30;
        
        this.spriteUrl = this.config.sprite;
        
        this.isDead = false;
        this.isMoving = false;
        this.currentTarget = null;
        this.originalX = x; // Запоминаем исходную позицию
        this.maxRightOffset = 150; // Максимальное смещение вправо от исходной позиции
        
        // Размеры
        this.width = this.config.width || 40;
        this.height = this.config.height || 40;
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
        
        // Загружаем спрайт
        spriteLoader.loadSprite(this.spriteUrl, this.element, this.emoji, false);
        
        // Добавляем индикатор здоровья
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'defender-health-bar';
        this.element.appendChild(this.healthBar);
        
        this.healthFill = document.createElement('div');
        this.healthFill.className = 'defender-health-fill';
        this.healthBar.appendChild(this.healthFill);
        
        this.game.uiManager.gameField.appendChild(this.element);
        this.updateElementPosition();
        this.updateHealthBar();
    }

    update(deltaTime) {
        if (this.isDead) return;
        
        // Поиск ближайшего врага
        this.currentTarget = this.findNearestEnemy();
        
        if (this.currentTarget) {
            // Поведение в зависимости от типа защитника
            if (this.type === 'archer') {
                this.archerBehavior(deltaTime);
            } else {
                this.knightBehavior(deltaTime);
            }
        } else {
            // Если нет врагов, возвращаемся на исходную позицию
            this.returnToBase(deltaTime);
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

    archerBehavior(deltaTime) {
        if (!this.currentTarget) return;
        
        const distance = this.getDistanceToEnemy(this.currentTarget);
        const targetRect = this.currentTarget.getBoundingRect();
        
        // Лучник держит дистанцию
        if (distance < this.preferredDistance - this.retreatDistance) {
            // Враг слишком близко - отступаем
            const direction = -1; // Двигаемся влево (от врага)
            this.move(direction, deltaTime);
            this.isMoving = true;
        } else if (distance > this.preferredDistance + this.retreatDistance) {
            // Враг слишком далеко - приближаемся, но не дальше исходной позиции
            if (this.x < this.originalX + this.maxRightOffset) {
                const direction = 1; // Двигаемся вправо (к врагу)
                this.move(direction, deltaTime);
                this.isMoving = true;
            }
        } else {
            this.isMoving = false;
        }
    }

    knightBehavior(deltaTime) {
        if (!this.currentTarget) return;
        
        const distance = this.getDistanceToEnemy(this.currentTarget);
        
        // Рыцарь идет на врага, но не дальше исходной позиции
        if (distance > this.attackRange * 0.8 && this.x < this.originalX + this.maxRightOffset) {
            const direction = 1; // Двигаемся к врагу
            this.move(direction, deltaTime);
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
    }

    move(direction, deltaTime) {
        // direction: 1 - вправо (к врагу), -1 - влево (к замку)
        const newX = this.x + direction * this.speed * deltaTime;
        
        // Ограничиваем движение (не даем уйти далеко вправо и не даем зайти в замок)
        if (newX >= this.originalX - 50 && newX <= this.originalX + this.maxRightOffset) {
            this.x = newX;
        }
    }

    returnToBase(deltaTime) {
        if (Math.abs(this.x - this.originalX) > 5) {
            const direction = this.x < this.originalX ? 1 : -1;
            this.x += direction * this.speed * deltaTime * 0.5; // Медленнее возвращаемся
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
        
        // Визуальный эффект атаки
        this.element.classList.add('attacking');
        setTimeout(() => {
            if (this.element) {
                this.element.classList.remove('attacking');
            }
        }, 200);
        
        if (enemy.isDead) {
            this.game.addCoins(enemy.reward);
            this.game.addExperience(enemy.experience);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            if (this.element) {
                this.element.remove();
            }
        }
    }

    updateHealthBar() {
        if (this.healthFill) {
            const percent = this.health / this.maxHealth;
            this.healthFill.style.width = `${Math.max(0, percent * 100)}%`;
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
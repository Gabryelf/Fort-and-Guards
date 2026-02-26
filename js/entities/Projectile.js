class Projectile {
    constructor(game, castle, target) {
        this.game = game;
        this.castle = castle;
        this.target = target;
        
        // Используем конфиг
        this.config = GameConfig.projectiles;
        
        this.damage = castle.damage;
        this.isCritical = Math.random() < castle.criticalChance;
        
        if (this.isCritical) {
            this.damage *= castle.criticalMultiplier;
            this.speed = this.config.critical.speed;
            this.emoji = this.config.critical.emoji;
        } else {
            this.speed = this.config.normal.speed;
            this.emoji = this.config.normal.emoji;
        }
        
        // Позиция старта (из замка)
        const castleRect = castle.getBoundingRect();
        this.x = castleRect.x + castleRect.width;
        this.y = castleRect.y + castleRect.height / 2;
        
        this.maxDistance = castle.attackRange * 1.5;
        this.traveledDistance = 0;
        
        this.isExpired = false;
        
        // Размер снаряда
        this.width = 20;
        this.height = 20;
        
        this.createElement();
        this.calculateTrajectory();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `projectile ${this.isCritical ? 'critical' : 'normal'}`;
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '5';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.fontSize = this.isCritical ? '20px' : '16px';
        this.element.innerHTML = this.emoji;
        
        this.game.uiManager.gameField.appendChild(this.element);
        this.updateElementPosition();
    }

    calculateTrajectory() {
        if (!this.target || this.target.isDead) {
            this.expire();
            return;
        }
        
        const targetRect = this.target.getBoundingRect();
        const targetX = targetRect.x + targetRect.width / 2;
        const targetY = targetRect.y + targetRect.height / 2;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            this.expire();
            return;
        }
        
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
    }

    update(deltaTime) {
        if (this.isExpired) return;

        const prevX = this.x;
        const prevY = this.y;
        
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        const deltaDistance = Math.sqrt(
            Math.pow(this.x - prevX, 2) + 
            Math.pow(this.y - prevY, 2)
        );
        this.traveledDistance += deltaDistance;
        
        this.updateElementPosition();
        
        // Проверка на столкновение с целью
        if (this.target && !this.target.isDead) {
            const targetRect = this.target.getBoundingRect();
            
            if (this.checkCollision(targetRect)) {
                this.target.takeDamage(this.damage);
                this.expire();
                return;
            }
        }
        
        // Проверка на исчезновение
        if (this.shouldExpire()) {
            this.expire();
        }
    }

    checkCollision(targetRect) {
        return this.x < targetRect.x + targetRect.width &&
               this.x + this.width > targetRect.x &&
               this.y < targetRect.y + targetRect.height &&
               this.y + this.height > targetRect.y;
    }

    shouldExpire() {
        if (this.traveledDistance > this.maxDistance) {
            return true;
        }
        
        const gameField = this.game.uiManager.gameField;
        if (this.x > gameField.offsetWidth + 100 || 
            this.x < -100 || 
            this.y > gameField.offsetHeight + 100 || 
            this.y < -100) {
            return true;
        }
        
        if (!this.target || this.target.isDead) {
            return true;
        }
        
        return false;
    }

    expire() {
        this.isExpired = true;
        
        if (this.element) {
            this.element.style.transition = 'opacity 0.2s';
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.remove();
                }
            }, 200);
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
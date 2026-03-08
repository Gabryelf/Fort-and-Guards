class Projectile {
    constructor(game, source, target) {
        this.game = game;
        this.source = source;
        this.target = target;
        
        // Определяем характеристики снаряда
        if (source instanceof Castle) {
            this.damage = source.damage;
            this.isCritical = Math.random() < source.criticalChance;
            if (this.isCritical) {
                this.damage *= source.criticalMultiplier;
            }
            this.emoji = this.isCritical ? '💥' : '⚔️';
            this.color = this.isCritical ? '#ff0000' : '#4cc9f0';
        } else {
            this.damage = source.damage;
            this.isCritical = Math.random() < 0.1;
            this.emoji = this.isCritical ? '💫' : '🏹';
            this.color = source.side === 'left' ? '#ffaa00' : '#4cc9f0';
        }
        
        this.speed = 500;
        
        // Позиция старта
        if (source instanceof Castle) {
            const sourceRect = source.getBoundingRect();
            this.x = sourceRect.x + sourceRect.width;
            this.y = sourceRect.y + sourceRect.height / 2;
        } else {
            this.x = source.x + source.width / 2;
            this.y = source.y + source.height / 2;
        }
        
        this.width = 20;
        this.height = 20;
        this.isExpired = false;
        
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `projectile ${this.isCritical ? 'critical' : 'normal'}`;
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '12';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.fontSize = this.isCritical ? '24px' : '20px';
        this.element.style.background = 'none';
        this.element.style.border = 'none';
        this.element.style.color = this.color;
        this.element.style.textShadow = `0 0 10px ${this.color}`;
        this.element.style.transition = 'all 0.05s linear';
        this.element.innerHTML = this.emoji;
        
        if (this.game?.uiManager?.gameField) {
            this.game.uiManager.gameField.appendChild(this.element);
            this.updateElementPosition();
        }
    }

    update(deltaTime) {
        if (this.isExpired || !this.target || this.target.isDead) {
            this.expire();
            return;
        }

        const targetRect = this.target.getBoundingRect();
        const targetX = targetRect.x + targetRect.width / 2;
        const targetY = targetRect.y + targetRect.height / 2;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
            this.target.takeDamage(this.damage);
            this.expire();
            return;
        }
        
        if (distance > 0) {
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }
        
        this.updateElementPosition();
    }

    expire() {
        this.isExpired = true;
        
        if (this.element) {
            this.element.style.transition = 'opacity 0.1s';
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.remove();
                }
            }, 100);
        }
    }

    updateElementPosition() {
        if (this.element) {
            this.element.style.left = `${this.x - this.width/2}px`;
            this.element.style.top = `${this.y - this.height/2}px`;
        }
    }
}
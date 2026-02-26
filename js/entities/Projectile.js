class Projectile {
    constructor(game, castle, target) {
        this.game = game;
        this.castle = castle;
        this.target = target;
        
        this.damage = castle.damage;
        this.speed = 400; // Увеличил скорость для лучшей видимости
        this.isCritical = Math.random() < castle.criticalChance;
        
        if (this.isCritical) {
            this.damage *= castle.criticalMultiplier;
        }
        
        // Позиция старта (из замка)
        const castleRect = castle.getBoundingRect();
        this.x = castleRect.x + castleRect.width;
        this.y = castleRect.y + castleRect.height / 2;
        
        this.isExpired = false;
        this.createElement();
        
        // Расчет направления
        this.calculateTrajectory();
        
        console.log(`Projectile created at (${this.x}, ${this.y})`);
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `projectile ${this.isCritical ? 'critical' : 'normal'}`;
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '5';
        
        if (this.isCritical) {
            this.element.innerHTML = '💥';
            this.element.style.fontSize = '16px';
        } else {
            this.element.innerHTML = '✨';
            this.element.style.fontSize = '12px';
        }
        
        this.game.uiManager.gameField.appendChild(this.element);
        this.updateElementPosition();
    }

    calculateTrajectory() {
        const targetRect = this.target.getBoundingRect();
        const targetX = targetRect.x + targetRect.width / 2;
        const targetY = targetRect.y + targetRect.height / 2;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Нормализуем и умножаем на скорость
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
    }

    update(deltaTime) {
        if (this.isExpired) return;

        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        this.updateElementPosition();
        
        // Проверка достижения цели или выхода за границы
        const gameField = this.game.uiManager.gameField;
        if (this.x > gameField.offsetWidth + 50 || 
            this.x < -50 || 
            this.y > gameField.offsetHeight + 50 || 
            this.y < -50) {
            this.isExpired = true;
            this.element.remove();
        }
        
        // Проверка столкновения с целью
        if (this.target && !this.target.isDead) {
            const distance = Math.sqrt(
                Math.pow(this.target.x - this.x, 2) + 
                Math.pow(this.target.y - this.y, 2)
            );
            
            if (distance < 40) { // Увеличил радиус столкновения
                this.isExpired = true;
                this.element.remove();
            }
        }
    }

    updateElementPosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
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
}
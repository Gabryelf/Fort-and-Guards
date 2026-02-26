class Enemy {
    constructor(game, type = 'normal') {
        this.game = game;
        this.type = type;
        
        // Используем конфиг
        this.config = GameConfig.enemies[type] || GameConfig.enemies.normal;
        
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.baseSpeed = this.config.speed;
        this.speed = this.baseSpeed;
        this.damage = this.config.damage;
        this.reward = this.config.reward;
        this.experience = this.config.experience;
        this.spriteUrl = this.config.sprite;
        
        this.isDead = false;
        this.isSlowed = false;
        
        // Размеры для коллизий
        this.width = this.config.width || 50;
        this.height = this.config.height || 50;
        
        // Анимация ходьбы
        this.walkOffset = 0;
        this.walkDirection = 1;
        this.walkSpeed = 0.1;
        
        this.createElement();
        this.initPosition();
    }

    getEnemyEmoji() {
        const emojis = {
            normal: '👹',
            fast: '👻', 
            tank: '🤖'
        };
        return emojis[this.type] || '👹';
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `enemy ${this.type}`;
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '10';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        
        // Загружаем спрайт с отзеркаливанием (враги идут справа налево)
        spriteLoader.loadSprite(this.spriteUrl, this.element, this.getEnemyEmoji(), true);
        
        // Добавляем индикатор здоровья
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'enemy-health-bar';
        this.element.appendChild(this.healthBar);
        
        this.healthFill = document.createElement('div');
        this.healthFill.className = 'enemy-health-fill';
        this.healthBar.appendChild(this.healthFill);
        
        this.game.uiManager.gameField.appendChild(this.element);
        this.updateHealthBar();
    }

    initPosition() {
        const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
        this.x = gameFieldRect.width - 100;
        this.y = Math.random() * (gameFieldRect.height - this.height - 100) + 50;
        
        this.updateElementPosition();
    }

    update(deltaTime) {
        if (this.isDead) return;

        // Анимация ходьбы (покачивание вверх-вниз)
        this.walkOffset += deltaTime * this.walkSpeed * this.walkDirection;
        if (Math.abs(this.walkOffset) > 3) {
            this.walkDirection *= -1;
        }

        let effectiveSpeed = this.speed;
        if (this.isSlowed || this.game.isMoatActive) {
            effectiveSpeed *= 0.5;
        }
        
        // Движение к замку (влево)
        this.x -= effectiveSpeed * deltaTime;
        
        this.updateElementPosition();
        
        // Проверка достижения замка
        if (this.x < 200) {
            this.attackCastle();
        }

        // Проверка выхода за левую границу
        if (this.x < -this.width) {
            this.isDead = true;
            this.element.remove();
        }
    }

    updateElementPosition() {
        if (this.element) {
            // Применяем смещение для анимации ходьбы
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y + this.walkOffset}px`;
        }
    }

    updateHealthBar() {
        if (this.healthFill) {
            const percent = this.health / this.maxHealth;
            this.healthFill.style.width = `${Math.max(0, percent * 100)}%`;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        
        this.health -= amount;
        this.updateHealthBar();
        
        // Эффект попадания
        this.element.classList.add('hit');
        setTimeout(() => {
            if (!this.isDead && this.element) {
                this.element.classList.remove('hit');
            }
        }, 200);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.element.classList.add('dead');
        
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.remove();
            }
        }, 400);
    }

    attackCastle() {
        if (!this.isDead) {
            this.game.castle.takeDamage(this.damage);
            this.die();
        }
    }

    getBoundingRect() {
        return {
            x: this.x,
            y: this.y + this.walkOffset,
            width: this.width,
            height: this.height
        };
    }
}
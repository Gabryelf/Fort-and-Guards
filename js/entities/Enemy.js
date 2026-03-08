class Enemy {
    constructor(game, type = 'normal') {
        this.game = game;
        this.type = type;
        
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
        
        this.width = this.config.width || 50;
        this.height = this.config.height || 50;
        
        // Анимация ходьбы
        this.walkOffset = 0;
        this.walkDirection = 1;
        this.walkSpeed = 3.0;
        this.walkAmplitude = 8;
        
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
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.fontSize = '24px';
        this.element.style.background = 'none';
        this.element.style.border = 'none';
        this.element.style.borderRadius = '0';
        
        // Разворачиваем врага один раз при создании (они идут справа налево)
        this.element.style.transform = 'scaleX(-1)';
        
        // Показываем эмодзи
        this.element.innerHTML = this.getEnemyEmoji();
        
        // Загружаем спрайт если есть
        if (window.spriteLoader && this.spriteUrl) {
            window.spriteLoader.loadSprite(this.spriteUrl, this.element, this.getEnemyEmoji(), true);
        }
        
        // Индикатор здоровья
        this.healthContainer = document.createElement('div');
        this.healthContainer.className = 'enemy-health-container';
        this.healthContainer.style.position = 'absolute';
        this.healthContainer.style.bottom = '-12px';
        this.healthContainer.style.left = '0';
        this.healthContainer.style.width = '100%';
        this.healthContainer.style.height = '6px';
        this.healthContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        this.healthContainer.style.borderRadius = '3px';
        this.healthContainer.style.overflow = 'hidden';
        this.healthContainer.style.zIndex = '20';
        this.healthContainer.style.pointerEvents = 'none';
        
        this.healthFill = document.createElement('div');
        this.healthFill.className = 'enemy-health-fill';
        this.healthFill.style.height = '100%';
        this.healthFill.style.width = '100%';
        this.healthFill.style.backgroundColor = '#4CAF50';
        this.healthFill.style.transition = 'width 0.2s ease';
        
        this.healthContainer.appendChild(this.healthFill);
        this.element.appendChild(this.healthContainer);
        
        if (this.game?.uiManager?.gameField) {
            this.game.uiManager.gameField.appendChild(this.element);
        }
        
        this.updateHealthBar();
    }

    initPosition() {
        if (!this.game?.uiManager?.gameField) {
            setTimeout(() => this.initPosition(), 100);
            return;
        }
        
        const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
        this.x = gameFieldRect.width - 100;
        this.y = Math.random() * (gameFieldRect.height - this.height - 100) + 50;
        
        this.updateElementPosition();
    }

    update(deltaTime) {
        if (this.isDead || !this.element) return;

        // Анимация ходьбы (без изменения transform)
        this.walkOffset += deltaTime * this.walkSpeed * this.walkDirection;
        if (Math.abs(this.walkOffset) > this.walkAmplitude) {
            this.walkDirection *= -1;
        }

        let effectiveSpeed = this.speed;
        if (this.isSlowed || this.game?.isMoatActive) {
            effectiveSpeed *= 0.5;
        }
        
        this.x -= effectiveSpeed * deltaTime;
        
        this.updateElementPosition();
        
        if (this.x < 200) {
            this.attackCastle();
        }

        if (this.x < -this.width) {
            this.die();
        }
    }

    updateElementPosition() {
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y + this.walkOffset}px`;
        }
    }

    updateHealthBar() {
        if (this.healthFill) {
            const percent = Math.max(0, (this.health / this.maxHealth) * 100);
            this.healthFill.style.width = `${percent}%`;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        
        this.health -= amount;
        this.updateHealthBar();
        
        // Эффект попадания (без изменения transform)
        if (this.element) {
            this.element.style.filter = 'brightness(1.5)';
            
            setTimeout(() => {
                if (this.element && !this.isDead) {
                    this.element.style.filter = 'brightness(1)';
                }
            }, 150);
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        
        if (this.element) {
            this.element.style.transition = 'all 0.3s ease';
            this.element.style.opacity = '0';
            this.element.style.transform = 'scaleX(-1) scale(0)';
            
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.remove();
                }
            }, 300);
        }
    }

    attackCastle() {
        if (!this.isDead && this.game?.castle) {
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
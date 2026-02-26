class Enemy {
    constructor(game, type = 'normal') {
        this.game = game;
        this.type = type;
        
        const stats = this.getStatsByType(type);
        this.health = stats.health;
        this.maxHealth = stats.health;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.reward = stats.reward;
        this.experience = stats.experience;
        
        this.isDead = false;
        this.isSlowed = false;
        
        this.createElement();
        this.initPosition();
        
        console.log(`🎯 Enemy ${type} created at (${Math.round(this.x)}, ${Math.round(this.y)})`);
    }

    getStatsByType(type) {
        const types = {
            normal: { health: 30, speed: 60, damage: 5, reward: 5, experience: 10 },
            fast: { health: 15, speed: 90, damage: 3, reward: 3, experience: 7 },
            tank: { health: 100, speed: 40, damage: 10, reward: 15, experience: 20 }
        };
        return types[type] || types.normal;
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = `enemy ${this.type}`;
        this.element.innerHTML = this.getEnemyEmoji();
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '10';
        this.game.uiManager.gameField.appendChild(this.element);
    }

    initPosition() {
        const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
        this.x = gameFieldRect.width + 50;
        this.y = Math.random() * (gameFieldRect.height - 100) + 50;
        
        this.updateElementPosition();
    }

    getEnemyEmoji() {
        const emojis = {
            normal: '👹',
            fast: '👻', 
            tank: '🤖'
        };
        return emojis[this.type] || '👹';
    }

    update(deltaTime) {
        if (this.isDead) return;

        let effectiveSpeed = this.speed;
        if (this.isSlowed) {
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
        if (this.x < -100) {
            console.log('❌ Enemy out of bounds, removing');
            this.isDead = true;
            this.element.remove();
        }
    }

    updateElementPosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    takeDamage(amount) {
        if (this.isDead) return;
        
        this.health -= amount;
        
        // Эффект попадания
        this.element.classList.add('hit');
        setTimeout(() => {
            if (!this.isDead) {
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
            if (this.element.parentNode) {
                this.element.remove();
            }
        }, 400);
    }

    attackCastle() {
        if (!this.isDead) {
            console.log(`💥 Enemy ${this.type} reached castle! Damage: ${this.damage}`);
            this.game.castle.takeDamage(this.damage);
            this.die();
        }
    }

    getBoundingRect() {
        const rect = this.element.getBoundingClientRect();
        const gameFieldRect = this.game.uiManager.gameField.getBoundingClientRect();
        
        return {
            x: this.x,
            y: this.y,
            width: rect.width,
            height: rect.height
        };
    }
}
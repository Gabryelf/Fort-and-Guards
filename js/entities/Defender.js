class Defender {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 3;
        this.attackRange = 80;
        this.attackSpeed = 1.5;
        this.attackCooldown = 0;
        
        this.isDead = false;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'defender';
        this.game.uiManager.gameField.appendChild(this.element);
        this.updateElementPosition();
    }

    update(deltaTime) {
        this.attackCooldown -= deltaTime;
        
        if (this.attackCooldown <= 0) {
            this.attack();
            this.attackCooldown = 1 / this.attackSpeed;
        }
    }

    attack() {
        const target = this.findTarget();
        if (target) {
            target.takeDamage(this.damage);
            
            if (target.isDead) {
                this.game.addCoins(target.reward);
                this.game.addExperience(target.experience);
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
        const defenderRect = this.getBoundingRect();
        const enemyRect = enemy.getBoundingRect();
        
        const defenderCenter = {
            x: defenderRect.x + defenderRect.width / 2,
            y: defenderRect.y + defenderRect.height / 2
        };
        
        const enemyCenter = {
            x: enemyRect.x + enemyRect.width / 2,
            y: enemyRect.y + enemyRect.height / 2
        };
        
        return Math.sqrt(
            Math.pow(defenderCenter.x - enemyCenter.x, 2) + 
            Math.pow(defenderCenter.y - enemyCenter.y, 2)
        );
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.element.remove();
        }
    }

    updateElementPosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    getBoundingRect() {
        return this.element.getBoundingClientRect();
    }
}
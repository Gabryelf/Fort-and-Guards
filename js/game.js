class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'loading';
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Основные объекты игры
        this.castle = null;
        this.enemies = [];
        this.projectiles = [];
        this.defenders = [];
        
        // Специальные эффекты
        this.isMoatActive = false;
        
        // Менеджеры
        this.waveManager = null;
        this.uiManager = null;
        this.upgradeManager = null;
        this.yandexSDKManager = null;
        
        // Игровые ресурсы
        this.coins = 100;
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log('Game initializing...');
        
        // Инициализация Яндекс SDK
        this.yandexSDKManager = new YandexSDKManager(this);
        await this.yandexSDKManager.initialize();
        
        // Инициализация менеджеров
        this.waveManager = new WaveManager(this);
        this.uiManager = new UIManager(this);
        this.upgradeManager = new UpgradeManager(this);
        
        // Инициализация замка
        this.castle = new Castle(this);
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Запуск игры
        this.gameState = 'menu';
        this.uiManager.showScreen('mainMenu');
        
        // Запуск игрового цикла
        this.gameLoop();
        
        console.log('Game initialized');
    }

    setupEventListeners() {
        // Кнопки меню
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            this.gameState = 'menu';
            this.uiManager.showScreen('mainMenu');
        });

        document.getElementById('rewardBtn').addEventListener('click', () => {
            if (this.yandexSDKManager) {
                this.yandexSDKManager.showRewardedAd();
            }
        });

        // Карты улучшений при повышении уровня
        document.querySelectorAll('.upgradeCard').forEach(card => {
            card.addEventListener('click', (e) => {
                const upgradeType = card.dataset.upgrade;
                console.log('Level up upgrade selected:', upgradeType);
                if (upgradeType && this.upgradeManager) {
                    this.upgradeManager.applyLevelUpUpgrade(upgradeType);
                }
            });
        });
    }

    startGame() {
        console.log('Starting new game...');
        
        // Сброс состояния игры
        this.coins = 100;
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        this.isMoatActive = false;
        
        // Очистка массивов
        this.enemies.forEach(enemy => enemy.element?.remove());
        this.projectiles.forEach(p => p.element?.remove());
        this.defenders.forEach(d => d.element?.remove());
        
        this.enemies = [];
        this.projectiles = [];
        this.defenders = [];
        
        // Сброс объектов
        this.castle.reset();
        this.waveManager.reset();
        this.upgradeManager.reset();
        
        // Пересоздаем обработчики кнопок улучшений
        this.upgradeManager.setupEventListeners();
        
        // Показать игровой экран
        this.uiManager.showScreen('gameScreen');
        this.gameState = 'playing';
        
        // Обновляем HUD
        this.uiManager.updateHUD();
    }

    gameLoop(currentTime = 0) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        if (this.gameState === 'playing') {
            this.update();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update() {
        try {
            // Обновление волн
            this.waveManager.update(this.deltaTime);
            
            // Обновление врагов
            this.enemies.forEach(enemy => enemy.update(this.deltaTime));
            this.enemies = this.enemies.filter(enemy => !enemy.isDead);
            
            // Обновление снарядов
            this.projectiles.forEach(projectile => projectile.update(this.deltaTime));
            this.projectiles = this.projectiles.filter(projectile => !projectile.isExpired);
            
            // Обновление защитников
            this.defenders.forEach(defender => defender.update(this.deltaTime));
            this.defenders = this.defenders.filter(defender => !defender.isDead);
            
            // Проверка столкновений
            this.checkCollisions();
            
            // Обновление замка
            this.castle.update(this.deltaTime);
            
            // Обновление интерфейса
            this.uiManager.updateHUD();
            
            // Проверка условий проигрыша
            if (this.castle.health <= 0 && this.gameState === 'playing') {
                this.gameOver();
            }
        } catch (error) {
            console.error('Error in game update:', error);
        }
    }

    checkCollisions() {
        // Проверка столкновений снарядов с врагами
        this.projectiles.forEach(projectile => {
            if (projectile.isExpired) return;
            
            this.enemies.forEach(enemy => {
                if (enemy.isDead) return;
                
                const distance = Math.sqrt(
                    Math.pow(projectile.x - enemy.x, 2) + 
                    Math.pow(projectile.y - enemy.y, 2)
                );
                
                if (distance < 30) {
                    enemy.takeDamage(projectile.damage);
                    projectile.expire();
                    
                    if (enemy.isDead) {
                        this.addCoins(enemy.reward);
                        this.addExperience(enemy.experience);
                    }
                }
            });
        });

        // Проверка достижения врагами замка
        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const castleRect = this.castle.getBoundingRect();
            const distance = Math.sqrt(
                Math.pow(enemy.x - castleRect.x, 2) + 
                Math.pow(enemy.y - castleRect.y, 2)
            );
            
            if (distance < 50) {
                this.castle.takeDamage(enemy.damage);
                enemy.die();
            }
        });
    }

    addDefenders(count) {
        console.log(`Adding ${count} defenders`);
        
        const gameField = document.getElementById('gameField');
        const fieldRect = gameField.getBoundingClientRect();
        
        // Создаем сетку позиций для защитников
        const rows = 3; // Три ряда
        const cols = 4; // Четыре колонки
        const startX = 250;
        const startY = fieldRect.height * 0.2;
        const spacingX = 70;
        const spacingY = 60;
        
        // Создаем массив всех возможных позиций
        const positions = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                positions.push({
                    x: startX + col * spacingX,
                    y: startY + row * spacingY,
                    taken: false
                });
            }
        }
        
        // Отмечаем занятые позиции
        this.defenders.forEach(defender => {
            if (!defender.isDead) {
                // Находим ближайшую позицию в сетке
                for (let pos of positions) {
                    const distance = Math.sqrt(
                        Math.pow(defender.x - pos.x, 2) + 
                        Math.pow(defender.y - pos.y, 2)
                    );
                    if (distance < 30) {
                        pos.taken = true;
                        break;
                    }
                }
            }
        });
        
        // Добавляем новых защитников на свободные позиции
        let added = 0;
        for (let pos of positions) {
            if (!pos.taken && added < count) {
                const type = (added % 2 === 0) ? 'archer' : 'knight';
                
                console.log(`Creating defender ${type} at (${pos.x}, ${pos.y})`);
                
                const defender = new Defender(this, pos.x, pos.y, type);
                this.defenders.push(defender);
                added++;
            }
        }
        
        console.log(`Total defenders: ${this.defenders.length}`);
    }

    addCoins(amount) {
        this.coins += amount;
        this.uiManager.updateHUD();
    }

    addExperience(amount) {
        this.experience += amount;
        
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        this.uiManager.updateHUD();
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        this.gameState = 'levelUp';
        this.uiManager.showScreen('levelUpScreen');
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        const finalWave = this.waveManager?.currentWave || 1;
        const finalCoins = Math.floor(this.coins);
        const finalExp = Math.floor(this.experience);
        
        this.uiManager.showGameOverScreen(finalWave, finalCoins, finalExp);
        
        if (this.yandexSDKManager?.isInitialized) {
            this.yandexSDKManager.setLeaderboardScore(finalWave);
        }
    }
}

document.getElementById('leaderboardBtn').addEventListener('click', () => {
    if (this.yandexSDKManager) {
        this.yandexSDKManager.showLeaderboard();
    } else {
        alert('Таблица лидеров доступна только в Яндекс Играх');
    }
});

// Запуск игры
window.game = new Game();
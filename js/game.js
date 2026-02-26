class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'loading'; // loading, menu, playing, levelUp, gameOver
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Основные объекты игры
        this.castle = null;
        this.enemies = [];
        this.projectiles = [];
        this.defenders = [];
        
        // Менеджеры
        this.waveManager = null;
        this.uiManager = null;
        this.upgradeManager = null;
        this.yandexSDKManager = null;
        
        // Игровые ресурсы
        this.coins = 0;
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        
        this.init();
    }

    async init() {
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

        // Кнопки улучшений
        document.querySelectorAll('.upgradeBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeType = e.target.dataset.upgrade;
                this.upgradeManager.purchaseUpgrade(upgradeType);
            });
        });

        // Карты улучшений при повышении уровня
        document.querySelectorAll('.upgradeCard').forEach(card => {
            card.addEventListener('click', (e) => {
                const upgradeType = e.target.dataset.upgrade;
                this.upgradeManager.applyLevelUpUpgrade(upgradeType);
                this.uiManager.showScreen('gameScreen');
                this.gameState = 'playing';
            });
        });
    }

    startGame() {
        // Сброс состояния игры
        this.coins = 0;
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        
        this.enemies = [];
        this.projectiles = [];
        this.defenders = [];
        
        this.castle.reset();
        this.waveManager.reset();
        
        // Показать игровой экран
        this.uiManager.showScreen('gameScreen');
        this.gameState = 'playing';
    }

    gameLoop(currentTime = 0) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Ограничиваем deltaTime для избежания аномалий при переключении вкладок
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        if (this.gameState === 'playing') {
            this.update();
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update() {
        if (this.gameState !== 'playing') return;

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
                console.log('Castle destroyed! Game over.');
                this.gameOver();
            }
        } catch (error) {
            console.error('Error in game update:', error);
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        // Сохраняем статистику
        this.finalWave = this.waveManager.currentWave;
        this.finalCoins = Math.floor(this.coins);
        this.finalExp = Math.floor(this.experience);
        
        // Показываем экран окончания
        this.uiManager.showGameOverScreen(this.finalWave, this.finalCoins, this.finalExp);
        
        // Сохраняем в лидерборд
        if (this.yandexSDKManager.isInitialized) {
            this.yandexSDKManager.setLeaderboardScore(this.finalWave);
        }
        
        console.log('Game over screen shown');
    }

    render() {
       
    }

    checkCollisions() {
        // Проверка столкновений снарядов с врагами
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (this.isColliding(projectile, enemy)) {
                    enemy.takeDamage(projectile.damage);
                    projectile.isExpired = true;
                    
                    if (enemy.isDead) {
                        this.addCoins(enemy.reward);
                        this.addExperience(enemy.experience);
                    }
                }
            });
        });

        // Проверка достижения врагами замка
        this.enemies.forEach(enemy => {
            if (this.isColliding(enemy, this.castle)) {
                this.castle.takeDamage(enemy.damage);
                enemy.isDead = true;
            }
        });
    }

    isColliding(obj1, obj2) {
        // Простая проверка столкновения прямоугольников
        // В будущем можно заменить на более точную
        const rect1 = obj1.getBoundingRect();
        const rect2 = obj2.getBoundingRect();
        
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    addCoins(amount) {
        this.coins += amount;
    }

    addExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        this.gameState = 'levelUp';
        this.uiManager.showScreen('levelUpScreen');
    }

}

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    window.game = new Game();
});
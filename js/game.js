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

        // Ресурсы и свойства времени игры
        this.gameSpeed = 1;
        this.currentLevel = 1;
        this.maxUnlockedLevel = 1;
        this.resources = {
            wood: 0,
            stone: 0,
            iron: 0,
            gold: 0
        };
        this.levelConfig = null;
        this.wavesForLevel = 0;
        this.wavesCompleted = 0;
        this.isLevelComplete = false;
        
        // Флаг инициализации
        this.isInitialized = false;
        
        // Загрузка сохранений
        this.loadProgress();
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log('Game initializing...');
        
        // Инициализация менеджеров ДО Яндекс SDK
        this.waveManager = new WaveManager(this);
        this.uiManager = new UIManager(this);
        this.upgradeManager = new UpgradeManager(this);
        
        // Инициализация замка
        this.castle = new Castle(this);
        
        // Инициализация Яндекс SDK (с обработкой ошибок)
        try {
            this.yandexSDKManager = new YandexSDKManager(this);
            await this.yandexSDKManager.initialize();
        } catch (error) {
            console.warn('Yandex SDK initialization failed, using local mode:', error);
        }
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Обновляем меню
        this.updateLevelDisplay();
        this.updateMenuUI();
        
        // Запуск игры
        this.gameState = 'menu';
        this.uiManager.showScreen('mainMenu');
        
        // Запуск игрового цикла
        this.isInitialized = true;
        this.gameLoop();
        
        console.log('Game initialized successfully');
    }

    setupEventListeners() {
        // Кнопки меню
        document.getElementById('startGameBtn')?.addEventListener('click', () => {
            this.startGame(this.currentLevel);
        });

        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.startGame(this.currentLevel);
        });

        document.getElementById('menuBtn')?.addEventListener('click', () => {
            this.gameState = 'menu';
            this.uiManager.showScreen('mainMenu');
            this.updateMenuUI();
        });

        document.getElementById('rewardBtn')?.addEventListener('click', () => {
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

        // Кнопка скорости
        const speedControl = document.getElementById('speedControl');
        if (speedControl) {
            speedControl.addEventListener('click', () => {
                const speeds = [1, 2, 3, 4, 5];
                const currentSpeed = this.gameSpeed || 1;
                const currentIndex = speeds.indexOf(currentSpeed);
                const nextIndex = (currentIndex + 1) % speeds.length;
                this.setGameSpeed(speeds[nextIndex]);
            });
        }

        // Навигация по уровням
        document.getElementById('prevLevelBtn')?.addEventListener('click', () => {
            this.navigateLevels(-1);
        });

        document.getElementById('nextLevelBtn')?.addEventListener('click', () => {
            this.navigateLevels(1);
        });

        // Кнопка старта уровня
        document.getElementById('startLevelBtn')?.addEventListener('click', () => {
            if (this.currentLevel <= this.maxUnlockedLevel) {
                this.startGame(this.currentLevel);
            }
        });

        // Кнопки наград
        document.getElementById('claimVictoryReward')?.addEventListener('click', () => {
            this.uiManager?.showScreen('mainMenu');
            this.updateMenuUI();
            this.updateLevelDisplay();
        });

        document.getElementById('claimDefeatReward')?.addEventListener('click', () => {
            this.uiManager?.showScreen('mainMenu');
            this.updateMenuUI();
            this.updateLevelDisplay();
        });

        // Кнопка таблицы лидеров
        document.getElementById('leaderboardBtn')?.addEventListener('click', () => {
            if (this.yandexSDKManager) {
                this.yandexSDKManager.showLeaderboard();
            } else {
                alert('Таблица лидеров доступна только в Яндекс Играх');
            }
        });
    }

    startGame(levelNumber = null) {
        console.log(`Starting level ${levelNumber || this.currentLevel}...`);
        
        // Если указан номер уровня, используем его
        if (levelNumber) {
            this.currentLevel = levelNumber;
        }
        
        // Настраиваем уровень
        if (!this.setupLevel(this.currentLevel)) {
            console.error('Failed to setup level');
            return;
        }
        
        // Сброс состояния игры
        this.coins = 100;
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        this.isMoatActive = false;
        this.wavesCompleted = 0;
        this.isLevelComplete = false;
        this.gameSpeed = 1; // Сбрасываем скорость
        
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
        
        // Обновляем спрайт замка
        this.updateCastleSprite(this.currentLevel);
        
        // Обновляем количество врагов в волне
        if (this.levelConfig) {
            this.waveManager.enemiesToSpawn = this.levelConfig.enemiesPerWave || 3;
        }
        
        // Пересоздаем обработчики кнопок улучшений
        this.upgradeManager.setupEventListeners();
        
        // Сбрасываем скорость в UI
        const speedDisplay = document.querySelector('.speed-value');
        if (speedDisplay) {
            speedDisplay.textContent = '1x';
        }
        
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
        if (this.gameState !== 'playing') return;
        
        const speedFactor = this.gameSpeed || 1;
        
        try {
            // Обновление волн с учетом скорости
            this.waveManager.update(this.deltaTime * speedFactor);
            
            // Обновление врагов с учетом скорости
            this.enemies.forEach(enemy => enemy.update(this.deltaTime * speedFactor));
            this.enemies = this.enemies.filter(enemy => !enemy.isDead);
            
            // Обновление снарядов с учетом скорости
            this.projectiles.forEach(projectile => projectile.update(this.deltaTime * speedFactor));
            this.projectiles = this.projectiles.filter(projectile => !projectile.isExpired);
            
            // Обновление защитников с учетом скорости
            this.defenders.forEach(defender => defender.update(this.deltaTime * speedFactor));
            this.defenders = this.defenders.filter(defender => !defender.isDead);
            
            // Проверка столкновений
            this.checkCollisions();
            
            // Обновление замка с учетом скорости
            this.castle.update(this.deltaTime * speedFactor);
            
            // Обновление интерфейса
            this.uiManager.updateHUD();
            
            // Проверка условий проигрыша
            if (this.castle.health <= 0 && this.gameState === 'playing') {
                this.levelComplete(false);
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
        if (!gameField) return;
        
        const fieldRect = gameField.getBoundingClientRect();
        
        // Создаем сетку позиций для защитников
        const rows = 3;
        const cols = 4;
        const startX = 250;
        const startY = fieldRect.height * 0.2;
        const spacingX = 70;
        const spacingY = 60;
        
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
        
        // Добавляем новых защитников
        let added = 0;
        for (let pos of positions) {
            if (!pos.taken && added < count) {
                const type = (added % 2 === 0) ? 'archer' : 'knight';
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

    loadProgress() {
        try {
            const saved = localStorage.getItem('towerDefenseProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.maxUnlockedLevel = data.maxUnlockedLevel || 1;
                this.resources = data.resources || { wood: 0, stone: 0, iron: 0, gold: 0 };
                this.currentLevel = data.currentLevel || 1;
                console.log('Progress loaded:', this.resources);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    saveProgress() {
        try {
            const data = {
                maxUnlockedLevel: this.maxUnlockedLevel,
                resources: this.resources,
                currentLevel: this.currentLevel
            };
            localStorage.setItem('towerDefenseProgress', JSON.stringify(data));
            console.log('Progress saved:', data);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    getResources() {
        return this.resources;
    }

    addResources(rewards) {
        if (!rewards) return;
        
        for (const [key, value] of Object.entries(rewards)) {
            if (this.resources[key] !== undefined) {
                this.resources[key] += value;
            }
        }
        this.saveProgress();
        this.updateMenuUI();
    }

    updateMenuUI() {
        const resourcesElement = document.getElementById('menuResources');
        if (resourcesElement) {
            resourcesElement.innerHTML = `
                <span>🪵 ${this.resources.wood || 0}</span>
                <span>🪨 ${this.resources.stone || 0}</span>
                <span>⛏️ ${this.resources.iron || 0}</span>
                <span>🪙 ${this.resources.gold || 0}</span>
            `;
        }
    }

    setupLevel(levelNumber) {
        if (typeof LevelConfig === 'undefined') {
            console.error('LevelConfig not loaded!');
            return false;
        }
        
        this.currentLevel = levelNumber;
        this.levelConfig = LevelConfig.levels[levelNumber - 1];
        
        if (!this.levelConfig) {
            console.error('Level not found:', levelNumber);
            return false;
        }
        
        this.wavesForLevel = this.levelConfig.waves;
        this.wavesCompleted = 0;
        this.isLevelComplete = false;
        
        // Устанавливаем фон
        this.setBackground(this.levelConfig.background);
        
        // Добавляем декорации
        this.addDecorations();
        
        return true;
    }

    setBackground(url) {
        const gameField = document.getElementById('gameField');
        if (gameField && url) {
            gameField.style.backgroundImage = `url('${url}')`;
            gameField.style.backgroundSize = 'cover';
            gameField.style.backgroundPosition = 'center';
        }
    }

    addDecorations() {
        const gameField = document.getElementById('gameField');
        if (!gameField) return;
        
        // Удаляем старые декорации
        document.querySelectorAll('.field-decoration').forEach(el => el.remove());
        
        // Проверяем наличие LevelConfig
        if (typeof LevelConfig === 'undefined' || !LevelConfig.decorations) return;
        
        // Добавляем деревья
        const treeUrls = LevelConfig.decorations.trees || [];
        for (let i = 0; i < Math.min(5, treeUrls.length); i++) {
            const tree = document.createElement('div');
            tree.className = 'field-decoration';
            const url = treeUrls[Math.floor(Math.random() * treeUrls.length)];
            tree.style.width = '60px';
            tree.style.height = '80px';
            tree.style.left = `${50 + Math.random() * 100}px`;
            tree.style.top = `${20 + Math.random() * 60}%`;
            tree.style.backgroundImage = `url('${url}')`;
            tree.style.backgroundSize = 'contain';
            tree.style.backgroundRepeat = 'no-repeat';
            tree.style.backgroundPosition = 'center';
            gameField.appendChild(tree);
        }
        
        // Добавляем камни
        const rockUrls = LevelConfig.decorations.rocks || [];
        for (let i = 0; i < Math.min(3, rockUrls.length); i++) {
            const rock = document.createElement('div');
            rock.className = 'field-decoration';
            const url = rockUrls[Math.floor(Math.random() * rockUrls.length)];
            rock.style.width = '40px';
            rock.style.height = '30px';
            rock.style.right = `${30 + Math.random() * 80}px`;
            rock.style.top = `${10 + Math.random() * 80}%`;
            rock.style.backgroundImage = `url('${url}')`;
            rock.style.backgroundSize = 'contain';
            rock.style.backgroundRepeat = 'no-repeat';
            rock.style.backgroundPosition = 'center';
            gameField.appendChild(rock);
        }
    }

    updateCastleSprite(level) {
        const castleElement = document.getElementById('castle');
        if (!castleElement) return;
        
        if (typeof LevelConfig === 'undefined' || !LevelConfig.castleSprites) return;
        
        // Определяем индекс спрайта на основе уровня прокачки здоровья
        const healthUpgradeLevel = this.upgradeManager?.upgrades?.health?.level || 0;
        const spriteIndex = Math.min(healthUpgradeLevel, LevelConfig.castleSprites.length - 1);
        const spriteUrl = LevelConfig.castleSprites[spriteIndex];
        
        if (window.spriteLoader && spriteUrl) {
            window.spriteLoader.loadSprite(spriteUrl, castleElement, '🏰', false);
        }
    }

    handleWaveComplete() {
        this.wavesCompleted++;
        
        // Проверяем завершение уровня
        if (this.wavesCompleted >= this.wavesForLevel) {
            this.levelComplete(true);
        }
    }

    levelComplete(victory) {
        if (this.isLevelComplete) return;
        this.isLevelComplete = true;
        this.gameState = 'levelComplete';
        
        if (!this.levelConfig) {
            console.error('No level config!');
            return;
        }
        
        const rewards = this.levelConfig.rewards || {};
        
        if (victory) {
            // Победа - полная награда
            this.addResources(rewards);
            
            // Разблокируем следующий уровень
            if (this.currentLevel >= this.maxUnlockedLevel) {
                this.maxUnlockedLevel = Math.min(this.currentLevel + 1, LevelConfig.levels.length);
                this.saveProgress();
            }
            
            this.showVictoryScreen(rewards);
        } else {
            // Поражение - утешительная награда (30%)
            const consolationRewards = {};
            for (const [key, value] of Object.entries(rewards)) {
                consolationRewards[key] = Math.floor(value * 0.3);
            }
            this.addResources(consolationRewards);
            
            this.showDefeatScreen(consolationRewards);
        }
    }

    showVictoryScreen(rewards) {
        const screen = document.getElementById('victoryScreen');
        if (!screen) return;
        
        const rewardContainer = screen.querySelector('.reward-display');
        if (rewardContainer) {
            rewardContainer.innerHTML = '';
            for (const [key, value] of Object.entries(rewards)) {
                const emoji = {
                    wood: '🪵',
                    stone: '🪨',
                    iron: '⛏️',
                    gold: '🪙'
                }[key] || '📦';
                
                const item = document.createElement('div');
                item.className = 'reward-item';
                item.innerHTML = `${emoji} ${key}: ${value}`;
                rewardContainer.appendChild(item);
            }
        }
        
        const levelInfo = screen.querySelector('.victory-stats p');
        if (levelInfo) {
            levelInfo.textContent = `Уровень ${this.currentLevel} пройден!`;
        }
        
        this.uiManager.showScreen('victoryScreen');
    }

    showDefeatScreen(rewards) {
        const screen = document.getElementById('defeatScreen');
        if (!screen) return;
        
        const rewardContainer = screen.querySelector('.reward-display');
        if (rewardContainer) {
            rewardContainer.innerHTML = '';
            for (const [key, value] of Object.entries(rewards)) {
                const emoji = {
                    wood: '🪵',
                    stone: '🪨',
                    iron: '⛏️',
                    gold: '🪙'
                }[key] || '📦';
                
                const item = document.createElement('div');
                item.className = 'reward-item';
                item.innerHTML = `${emoji} ${key}: ${value}`;
                rewardContainer.appendChild(item);
            }
        }
        
        this.uiManager.showScreen('defeatScreen');
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        const speedDisplay = document.querySelector('.speed-value');
        if (speedDisplay) {
            speedDisplay.textContent = `${speed}x`;
        }
        
        if (this.waveManager) {
            this.waveManager.spawnInterval = 2 / speed;
        }
    }

    navigateLevels(direction) {
        if (typeof LevelConfig === 'undefined') return;
        
        const newLevel = this.currentLevel + direction;
        if (newLevel < 1 || newLevel > LevelConfig.levels.length) return;
        
        this.currentLevel = newLevel;
        this.updateLevelDisplay();
    }

    updateLevelDisplay() {
        if (typeof LevelConfig === 'undefined') return;
        
        const level = LevelConfig.levels[this.currentLevel - 1];
        if (!level) return;
        
        const display = document.querySelector('.level-display');
        const indicator = document.querySelector('.level-indicator');
        const startBtn = document.getElementById('startLevelBtn');
        
        if (display) {
            const img = display.querySelector('img');
            if (img) {
                img.src = level.image || '';
                img.alt = `Уровень ${this.currentLevel}`;
            }
            
            const number = display.querySelector('.level-number');
            if (number) {
                number.textContent = `Уровень ${this.currentLevel}`;
            }
            
            const status = display.querySelector('.level-status');
            if (status) {
                const isUnlocked = this.currentLevel <= this.maxUnlockedLevel;
                status.textContent = isUnlocked ? '✅ Открыт' : '🔒 Закрыт';
                status.style.borderColor = isUnlocked ? '#2ecc71' : '#e74c3c';
                status.style.color = isUnlocked ? '#2ecc71' : '#e74c3c';
            }
            
            display.classList.toggle('locked', this.currentLevel > this.maxUnlockedLevel);
        }
        
        if (indicator) {
            indicator.textContent = `${this.currentLevel} / ${LevelConfig.levels.length}`;
        }
        
        if (startBtn) {
            startBtn.disabled = this.currentLevel > this.maxUnlockedLevel;
            startBtn.textContent = this.currentLevel > this.maxUnlockedLevel ? '🔒 Закрыто' : '⚔️ Начать битву';
        }
    }
}

// Инициализация игры после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Запуск игры
    window.game = new Game();
});

// Аварийный запуск, если DOM уже загружен
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (!window.game) {
        window.game = new Game();
    }
}
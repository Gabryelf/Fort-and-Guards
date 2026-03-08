class YandexSDKManager {
    constructor(game) {
        this.game = game;
        this.isInitialized = false;
        this.player = null;
        this.ysdk = null;
        this.isLocalMode = true; // По умолчанию локальный режим
    }

    async initialize() {
        try {
            // Проверяем, запущена ли игра в окружении Яндекс Игр
            if (typeof YaGames === 'undefined') {
                console.log('YaGames SDK not found, using local mode');
                this.setupLocalMode();
                return;
            }

            // Проверяем, не в iframe ли мы (локальная разработка)
            if (window.self === window.top) {
                console.log('Not in iframe, using local mode');
                this.setupLocalMode();
                return;
            }

            // Пытаемся инициализировать Яндекс SDK с обработкой ошибок
            try {
                this.ysdk = await YaGames.init({
                    // Опции инициализации
                    screen: {
                        fullscreen: true
                    }
                });
                
                this.isInitialized = true;
                this.isLocalMode = false;
                
                // Получение данных игрока
                try {
                    this.player = await this.ysdk.getPlayer({ scopes: false });
                    this.updatePlayerName();
                } catch (playerError) {
                    console.log('Could not get player data, using anonymous', playerError);
                }
                
                // Инициализация рекламы
                this.initializeAds();
                
                // Инициализация лидербордов (новый API)
                this.initializeLeaderboards();
                
                console.log('Yandex SDK initialized successfully');
                
            } catch (sdkError) {
                console.log('Yandex SDK init failed, using local mode:', sdkError);
                this.setupLocalMode();
            }
            
        } catch (error) {
            console.error('Failed to initialize Yandex SDK:', error);
            this.setupLocalMode();
        }
    }

    setupLocalMode() {
        console.log('Using local mode (no Yandex SDK)');
        document.getElementById('playerName').textContent = 'Локальный игрок';
        this.isInitialized = false;
        this.isLocalMode = true;
    }

    updatePlayerName() {
        if (!this.isLocalMode && this.player && this.player.getName) {
            try {
                const playerName = this.player.getName();
                if (playerName) {
                    document.getElementById('playerName').textContent = playerName;
                }
            } catch (e) {
                console.log('Error getting player name');
            }
        }
    }

    initializeAds() {
        if (this.isLocalMode || !this.ysdk || !this.ysdk.adv) {
            console.log('Ads not available in local mode');
            return;
        }
        
        try {
            // Проверяем доступность рекламы
            if (typeof this.ysdk.adv.showRewardedVideo === 'function') {
                this.rewardedAd = this.ysdk.adv;
            } else {
                console.log('Rewarded video not available');
            }
        } catch (error) {
            console.log('Ads not available:', error);
        }
    }

    initializeLeaderboards() {
        if (this.isLocalMode || !this.ysdk) {
            console.log('Leaderboards not available in local mode');
            return;
        }
        
        try {
            // Новый API для лидербордов
            if (this.ysdk.leaderboards) {
                this.leaderboards = this.ysdk.leaderboards;
                console.log('Leaderboards initialized');
            } else {
                console.log('Leaderboards not available');
            }
        } catch (error) {
            console.log('Leaderboards not available:', error);
        }
    }

    async setLeaderboardScore(score) {
        if (this.isLocalMode || !this.leaderboards) {
            console.log('Local mode: would set leaderboard score to', score);
            return;
        }
        
        try {
            await this.leaderboards.setLeaderboardScore('waves', score);
        } catch (error) {
            console.log('Failed to update leaderboard:', error);
        }
    }

    async showLeaderboard() {
        if (this.isLocalMode || !this.leaderboards) {
            console.log('Local mode: would show leaderboard');
            alert('Таблица лидеров доступна только в Яндекс Играх');
            return;
        }
        
        try {
            await this.leaderboards.open();
        } catch (error) {
            console.log('Failed to open leaderboard:', error);
        }
    }

    showRewardedAd() {
        if (this.isLocalMode) {
            // Фолбэк для локальной разработки
            console.log('Local mode: showing test rewarded ad');
            if (this.game && this.game.gameState === 'gameOver') {
                this.game.addCoins(100);
                this.game.uiManager.updateHUD();
                alert('+100 монет (тестовый режим)');
            }
            return;
        }

        if (this.rewardedAd && typeof this.rewardedAd.showRewardedVideo === 'function') {
            try {
                this.rewardedAd.showRewardedVideo({
                    callbacks: {
                        onOpen: () => console.log('Rewarded ad opened'),
                        onClose: () => console.log('Rewarded ad closed'),
                        onError: (error) => console.log('Rewarded ad error:', error),
                        onRewarded: () => {
                            console.log('Reward received!');
                            if (this.game && this.game.gameState === 'gameOver') {
                                this.game.addCoins(100);
                                this.game.uiManager.updateHUD();
                            }
                        }
                    }
                });
            } catch (error) {
                console.log('Failed to show rewarded ad:', error);
                // Фолбэк при ошибке
                if (this.game && this.game.gameState === 'gameOver') {
                    this.game.addCoins(100);
                    this.game.uiManager.updateHUD();
                }
            }
        } else {
            console.log('Rewarded ad not available');
            // Фолбэк если реклама не доступна
            if (this.game && this.game.gameState === 'gameOver') {
                this.game.addCoins(100);
                this.game.uiManager.updateHUD();
                alert('+100 монет (реклама временно недоступна)');
            }
        }
    }
}
class YandexSDKManager {
    constructor(game) {
        this.game = game;
        this.isInitialized = false;
        this.player = null;
        this.ysdk = null;
    }

    async initialize() {
        try {
            // Проверяем, запущена ли игра в окружении Яндекс Игр
            if (typeof YaGames === 'undefined') {
                console.log('YaGames SDK not found, using fallback mode');
                this.setupFallback();
                return;
            }

            // Инициализация Яндекс SDK без устаревших параметров
            this.ysdk = await YaGames.init();
            
            this.isInitialized = true;
            
            // Получение данных игрока (с проверкой)
            try {
                this.player = await this.ysdk.getPlayer();
                this.updatePlayerName();
            } catch (playerError) {
                console.log('Could not get player data, using anonymous', playerError);
            }
            
            // Инициализация рекламы
            this.initializeAds();
            
            // Инициализация лидербордов
            this.initializeLeaderboards();
            
            console.log('Yandex SDK initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Yandex SDK:', error);
            this.setupFallback();
        }
    }

    updatePlayerName() {
        if (this.player && this.player.getName) {
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
        if (!this.ysdk || !this.ysdk.adv) return;
        
        try {
            this.rewardedAd = this.ysdk.adv.createRewardedVideo({
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
            console.log('Ads not available:', error);
        }
    }

    initializeLeaderboards() {
        if (!this.ysdk || !this.ysdk.getLeaderboards) return;
        
        try {
            this.leaderboards = this.ysdk.getLeaderboards();
        } catch (error) {
            console.log('Leaderboards not available:', error);
        }
    }

    async setLeaderboardScore(score) {
        if (!this.isInitialized || !this.leaderboards) return;
        
        try {
            await this.leaderboards.setLeaderboardScore('waves', score);
        } catch (error) {
            console.log('Failed to update leaderboard:', error);
        }
    }

    async showLeaderboard() {
        if (!this.isInitialized || !this.leaderboards) return;
        
        try {
            await this.leaderboards.open();
        } catch (error) {
            console.log('Failed to open leaderboard:', error);
        }
    }

    showRewardedAd() {
        if (this.rewardedAd) {
            try {
                this.rewardedAd.show();
            } catch (error) {
                console.log('Failed to show rewarded ad:', error);
            }
        } else {
            // Фолбэк для локальной разработки
            if (this.game && this.game.gameState === 'gameOver') {
                this.game.addCoins(100);
                this.game.uiManager.updateHUD();
                alert('+100 монет (тестовый режим)');
            }
        }
    }

    setupFallback() {
        console.log('Using fallback mode (no Yandex SDK)');
        document.getElementById('playerName').textContent = 'Локальный игрок';
        this.isInitialized = false;
    }
}
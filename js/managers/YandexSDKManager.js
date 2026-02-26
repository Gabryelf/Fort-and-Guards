class YandexSDKManager {
    constructor(game) {
        this.game = game;
        this.isInitialized = false;
        this.player = null;
    }

    async initialize() {
        try {
            // Инициализация Яндекс SDK
            await YaGames.init({
                screen: {
                    fullscreen: true,
                    orientation: 'landscape'
                }
            });
            
            const ysdk = await YaGames.sdk;
            this.isInitialized = true;
            
            // Получение данных игрока
            this.player = await ysdk.getPlayer();
            this.updatePlayerName();
            
            // Инициализация рекламы
            this.initializeAds(ysdk);
            
            // Инициализация лидербордов
            this.initializeLeaderboards(ysdk);
            
            console.log('Yandex SDK initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Yandex SDK:', error);
            // Заглушка для локальной разработки
            this.setupFallback();
        }
    }

    updatePlayerName() {
        if (this.player && this.player.getName) {
            const playerName = this.player.getName();
            document.getElementById('playerName').textContent = playerName;
        }
    }

    initializeAds(ysdk) {
        // Инициализация рекламы за вознаграждение
        this.rewardedAd = ysdk.adv.createRewardedVideo({
            callbacks: {
                onOpen: () => console.log('Rewarded ad opened'),
                onClose: () => console.log('Rewarded ad closed'),
                onError: (error) => console.log('Rewarded ad error:', error),
                onRewarded: () => {
                    console.log('Reward received!');
                    this.game.addCoins(100); // Награда за просмотр
                }
            }
        });
    }

    initializeLeaderboards(ysdk) {
        this.leaderboards = ysdk.getLeaderboards();
    }

    async setLeaderboardScore(score) {
        if (this.isInitialized && this.leaderboards) {
            try {
                await this.leaderboards.setLeaderboardScore('waves', score);
                console.log('Leaderboard score updated:', score);
            } catch (error) {
                console.error('Failed to update leaderboard:', error);
            }
        }
    }

    async showLeaderboard() {
        if (this.isInitialized && this.leaderboards) {
            try {
                await this.leaderboards.open();
            } catch (error) {
                console.error('Failed to open leaderboard:', error);
            }
        }
    }

    showRewardedAd() {
        if (this.isInitialized && this.rewardedAd) {
            this.rewardedAd.show();
        }
    }

    setupFallback() {
        // Заглушка для локальной разработки без SDK
        console.log('Using fallback mode (no Yandex SDK)');
        document.getElementById('playerName').textContent = 'Локальный игрок';
        this.isInitialized = false;
    }
}
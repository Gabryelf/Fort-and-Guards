class WaveManager {
    constructor(game) {
        this.game = game;
        this.currentWave = 1;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 3;
        this.spawnCooldown = 0;
        this.spawnInterval = 2;
        
        this.waveInProgress = false;
        
        console.log('WaveManager initialized');
    }

    update(deltaTime) {
        if (this.game.gameState !== 'playing') return;

        if (!this.waveInProgress) {
            this.startWave();
        }
        
        this.spawnCooldown -= deltaTime;
        
        if (this.spawnCooldown <= 0 && this.enemiesSpawned < this.enemiesToSpawn) {
            this.spawnEnemy();
            this.spawnCooldown = this.spawnInterval;
        }
        
        // Проверка окончания волны
        if (this.enemiesSpawned >= this.enemiesToSpawn && this.game.enemies.length === 0) {
            this.completeWave();
        }
    }

    startWave() {
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 3 + this.currentWave;
        console.log(`🏁 Starting wave ${this.currentWave}, enemies to spawn: ${this.enemiesToSpawn}`);
    }

    spawnEnemy() {
        const enemyTypes = ['normal', 'fast', 'tank'];
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        const enemy = new Enemy(this.game, randomType);
        this.game.enemies.push(enemy);
        this.enemiesSpawned++;
        
        console.log(`🎯 Spawned ${randomType} enemy at (${enemy.x}, ${enemy.y}). Total: ${this.enemiesSpawned}/${this.enemiesToSpawn}`);
        console.log('Active enemies:', this.game.enemies.length);
    }

    completeWave() {
        console.log(`🎉 Wave ${this.currentWave} completed!`);
        this.currentWave++;
        this.waveInProgress = false;
        
        // Награда за волну
        this.game.addCoins(this.currentWave * 10);
        this.game.addExperience(this.currentWave * 15);
    }

    reset() {
        this.currentWave = 1;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 3;
        this.waveInProgress = false;
    }

    handleWaveComplete() {
        // Вызываем метод игры для обработки завершения волны
        if (this.game && typeof this.game.handleWaveComplete === 'function') {
            this.game.handleWaveComplete();
        }
    }

    completeWave() {
        console.log(`🎉 Wave ${this.currentWave} completed!`);
        this.currentWave++;
        this.waveInProgress = false;
        
        // Награда за волну
        this.game.addCoins(this.currentWave * 10);
        this.game.addExperience(this.currentWave * 15);
        
        // Вызываем обработчик завершения волны
        this.handleWaveComplete();
    }
}
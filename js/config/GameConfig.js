const GameConfig = {
    // Настройки замка
    castle: {
        baseHealth: 100,
        baseDamage: 10,
        baseAttackRange: 250,
        baseAttackSpeed: 1,
        criticalChance: 0.1,
        criticalMultiplier: 2,
        maxTowers: 4,
        sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/castle_1.png"
    },

    // Настройки врагов
    enemies: {
        normal: {
            health: 30,
            speed: 60,
            damage: 5,
            reward: 5,
            experience: 10,
            sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/peasant.png",
            width: 64,
            height: 64
        },
        fast: {
            health: 15,
            speed: 85,
            damage: 3,
            reward: 3,
            experience: 7,
            sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/bandit.png",
            width: 64,
            height: 64
        },
        tank: {
            health: 100,
            speed: 40,
            damage: 10,
            reward: 15,
            experience: 20,
            sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/barbarian_m.png",
            width: 96,
            height: 96
        }
    },

    // Защитники
    defenders: {
        archer: {
            health: 50,
            damage: 3,
            attackRange: 150,
            attackSpeed: 1.5,
            sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/archer.png",
            width: 40,
            height: 40,
            emoji: '🏹',
            speed: 100,
            preferredDistance: 120,
            retreatDistance: 30
        },
        knight: {
            health: 100,
            damage: 5,
            attackRange: 70,
            attackSpeed: 1,
            sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/knight.png",
            width: 45,
            height: 45,
            emoji: '⚔️',
            speed: 70,
            preferredDistance: 40,
            retreatDistance: 20
        }
    },

     towers: {
        sprite: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/tower_1.png",
        width: 100,
        height: 160
    },

    // Снаряды (используем эмодзи, так как стрелы не грузятся)
    projectiles: {
        normal: {
            speed: 500,
            sprite: "",  // Пустой URL, будем использовать эмодзи
            emoji: '✨',
            width: 20,
            height: 20
        },
        critical: {
            speed: 600,
            sprite: "",
            emoji: '💥',
            width: 25,
            height: 25
        }
    },

    // Цены улучшений
    upgradePrices: {
        damage: { base: 10, multiplier: 1.5 },
        range: { base: 15, multiplier: 1.6 },
        reload: { base: 12, multiplier: 1.5 },
        health: { base: 20, multiplier: 1.7 }
    },

    // Награды за уровень
    levelUpRewards: {
        wall: {
            name: 'Укрепить стену',
            effect: '+50% здоровья замка',
            icon: '⚒️',
            apply: (game) => {
                if (game && game.castle) {
                    game.castle.maxHealth *= 1.5;
                    game.castle.health = game.castle.maxHealth;
                    console.log('Wall upgrade applied, castle health:', game.castle.maxHealth);
                    return true;
                }
                return false;
            }
        },
        tower: {
            name: 'Дополнительная башня',
            effect: '+1 снаряд за выстрел',
            icon: '🏰',
            apply: (game) => {
                if (game && game.castle) {
                    if (game.castle.towers < game.castle.maxTowers) {
                        game.castle.towers++;
                        console.log('Tower upgrade applied, towers:', game.castle.towers);
                        return true;
                    }
                }
                return false;
            }
        },
        moat: {
            name: 'Выкопать ров',
            effect: 'Враги -50% скорости',
            icon: '🏞️',
            apply: (game) => {
                if (game) {
                    game.isMoatActive = true;
                    console.log('Moat upgrade applied');
                    return true;
                }
                return false;
            }
        },
        defenders: {
            name: 'Призвать защитников',
            effect: '2 воина перед замком',
            icon: '🛡️',
            apply: (game) => {
                if (game) {
                    console.log('Spawning defenders from level up reward');
                    game.spawnDefenders(2);
                    return true;
                }
                return false;
            }
        }
    }
};

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
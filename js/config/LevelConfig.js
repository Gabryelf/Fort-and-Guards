const LevelConfig = {
    // Конфигурация уровней
    levels: [
        {
            id: 1,
            waves: 5,
            enemiesPerWave: 3,
            rewards: {
                wood: 10,
                stone: 5
            },
            background: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/backgrounds/field.jpg",
            image: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/levels/level1.jpg"
        },
        {
            id: 2,
            waves: 8,
            enemiesPerWave: 4,
            rewards: {
                wood: 15,
                stone: 10,
                iron: 5
            },
            background: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/backgrounds/forest.jpg",
            image: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/levels/level2.jpg"
        },
        {
            id: 3,
            waves: 10,
            enemiesPerWave: 5,
            rewards: {
                wood: 20,
                stone: 15,
                iron: 10
            },
            background: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/backgrounds/mountain.jpg",
            image: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/levels/level3.jpg"
        },
        {
            id: 4,
            waves: 12,
            enemiesPerWave: 6,
            rewards: {
                wood: 25,
                stone: 20,
                iron: 15,
                gold: 5
            },
            background: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/backgrounds/desert.jpg",
            image: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/levels/level4.jpg"
        },
        {
            id: 5,
            waves: 15,
            enemiesPerWave: 7,
            rewards: {
                wood: 30,
                stone: 25,
                iron: 20,
                gold: 10
            },
            background: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/backgrounds/castle.jpg",
            image: "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/levels/level5.jpg"
        }
    ],
    
    // Ссылки на спрайты замка для разных уровней прокачки
    castleSprites: [
        "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/castle_1.png",
        "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/castle_2.png",
        "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/castle_3.png",
        "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/castle_4.png",
        "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/castle/castle_5.png"
    ],
    
    // Ссылки на декорации
    decorations: {
        trees: [
            "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/decorations/tree1.png",
            "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/decorations/tree2.png",
            "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/decorations/tree3.png"
        ],
        rocks: [
            "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/decorations/rock1.png",
            "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/decorations/rock2.png"
        ],
        bushes: [
            "https://raw.githubusercontent.com/Gabryelf/Atlas-Assets/main/docs/images/fantasy/decorations/bush1.png"
        ]
    }
};

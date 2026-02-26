class SpriteLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.failedUrls = new Set(); // Запоминаем неудачные загрузки
    }

    loadSprite(url, element, fallbackEmoji, mirror = false) {
        // Если URL не указан или уже был ошибкой
        if (!url || this.failedUrls.has(url)) {
            this.applyFallback(element, fallbackEmoji, mirror);
            return Promise.reject('Invalid or failed URL');
        }

        // Если уже в кэше и изображение загружено
        if (this.cache.has(url)) {
            this.applySprite(element, url, fallbackEmoji, mirror);
            return Promise.resolve();
        }

        // Если уже загружается, ждем
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url).then(() => {
                this.applySprite(element, url, fallbackEmoji, mirror);
            }).catch(() => {
                this.applyFallback(element, fallbackEmoji, mirror);
            });
        }

        // Загружаем новое изображение
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`✅ Sprite loaded: ${url}`);
                this.cache.set(url, img);
                this.loadingPromises.delete(url);
                this.applySprite(element, url, fallbackEmoji, mirror);
                resolve();
            };
            
            img.onerror = () => {
                console.log(`❌ Failed to load sprite: ${url}`);
                this.failedUrls.add(url);
                this.loadingPromises.delete(url);
                this.applyFallback(element, fallbackEmoji, mirror);
                reject();
            };
            
            img.src = url;
            // Добавляем кросс-оригин, если нужно
            img.crossOrigin = 'anonymous';
        });

        this.loadingPromises.set(url, loadPromise);
        return loadPromise;
    }

    applySprite(element, url, fallbackEmoji, mirror) {
        const img = this.cache.get(url);
        if (img && img.complete) {
            element.style.backgroundImage = `url('${url}')`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
            
            // Отзеркаливание для врагов (они идут справа налево)
            if (mirror) {
                element.style.transform = 'scaleX(-1)';
            } else {
                element.style.transform = '';
            }
            
            element.innerHTML = '';
        } else {
            this.applyFallback(element, fallbackEmoji, mirror);
        }
    }

    applyFallback(element, fallbackEmoji, mirror) {
        element.style.backgroundImage = 'none';
        element.innerHTML = fallbackEmoji || '👾';
        
        if (mirror) {
            element.style.transform = 'scaleX(-1)';
        } else {
            element.style.transform = '';
        }
    }
}

// Глобальный экземпляр загрузчика спрайтов
window.spriteLoader = new SpriteLoader();
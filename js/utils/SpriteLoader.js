class SpriteLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.failedUrls = new Set();
    }

    loadSprite(url, element, fallbackEmoji, mirror = false) {
        if (!url || this.failedUrls.has(url)) {
            this.applyFallback(element, fallbackEmoji, mirror);
            return Promise.reject('Invalid or failed URL');
        }

        if (this.cache.has(url)) {
            this.applySprite(element, url, fallbackEmoji, mirror);
            return Promise.resolve();
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url).then(() => {
                this.applySprite(element, url, fallbackEmoji, mirror);
            }).catch(() => {
                this.applyFallback(element, fallbackEmoji, mirror);
            });
        }

        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
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
        });

        this.loadingPromises.set(url, loadPromise);
        return loadPromise;
    }

    applySprite(element, url, fallbackEmoji, mirror) {
        const img = this.cache.get(url);
        if (img && img.complete && img.naturalWidth > 0) {
            // Очищаем элемент от эмодзи
            element.innerHTML = '';
            element.style.backgroundImage = `url('${url}')`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
            element.style.backgroundColor = 'transparent';
            element.style.border = 'none';
            
            if (mirror) {
                element.style.transform = 'scaleX(-1)';
            } else {
                element.style.transform = '';
            }
        } else {
            this.applyFallback(element, fallbackEmoji, mirror);
        }
    }

    applyFallback(element, fallbackEmoji, mirror) {
        element.innerHTML = fallbackEmoji || '👾';
        element.style.backgroundImage = 'none';
        element.style.backgroundColor = 'transparent';
        element.style.border = 'none';
        
        if (mirror) {
            element.style.transform = 'scaleX(-1)';
        } else {
            element.style.transform = '';
        }
    }
}

window.spriteLoader = new SpriteLoader();
// Вспомогательные функции
class Helpers {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
}

// Расширение стандартного Array
Array.prototype.remove = function(element) {
    const index = this.indexOf(element);
    if (index > -1) {
        this.splice(index, 1);
    }
    return this;
};
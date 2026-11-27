// 时间系统
class TimeSystem {
    constructor() {
        this.gameTime = 360; // 从6:00开始（分钟）
        this.day = 1;
        this.speed = 1; // 时间速度倍率
        this.paused = false;
        this.tickAccumulator = 0;
        this.tickRate = 1000 / 60; // 60 FPS
        
        // 时间段定义
        this.periods = {
            morning: { start: 360, end: 720, name: '上午', icon: '🌅' },      // 6:00-12:00
            afternoon: { start: 720, end: 1080, name: '下午', icon: '☀️' },   // 12:00-18:00
            evening: { start: 1080, end: 1320, name: '傍晚', icon: '🌆' },    // 18:00-22:00
            night: { start: 1320, end: 1440, name: '夜晚', icon: '🌙' },      // 22:00-24:00
            lateNight: { start: 0, end: 360, name: '深夜', icon: '🌃' }       // 0:00-6:00
        };
        
        // 回调
        this.onTimeChange = null;
        this.onDayChange = null;
        this.onPeriodChange = null;
        
        this.lastPeriod = null;
    }

    update(deltaTime) {
        if (this.paused) return;
        
        this.tickAccumulator += deltaTime;
        
        while (this.tickAccumulator >= this.tickRate) {
            this.tickAccumulator -= this.tickRate;
            this.tick();
        }
    }

    tick() {
        // 每帧增加游戏时间（根据速度）
        // 1现实秒 = 1游戏分钟 * speed
        this.gameTime += this.speed / 60;
        
        // 检查是否跨天
        if (this.gameTime >= 1440) {
            this.gameTime -= 1440;
            this.newDay();
        }
        
        // 检查时间段变化
        const currentPeriod = this.getCurrentPeriod();
        if (this.lastPeriod !== currentPeriod) {
            this.lastPeriod = currentPeriod;
            if (this.onPeriodChange) {
                this.onPeriodChange(currentPeriod);
            }
        }
        
        if (this.onTimeChange) {
            this.onTimeChange(this.gameTime, this.day);
        }
    }

    newDay() {
        this.day++;
        if (this.onDayChange) {
            this.onDayChange(this.day);
        }
    }

    getCurrentPeriod() {
        const time = this.gameTime;
        for (const [key, period] of Object.entries(this.periods)) {
            if (time >= period.start && time < period.end) {
                return key;
            }
        }
        return 'lateNight';
    }

    getPeriodInfo() {
        return this.periods[this.getCurrentPeriod()];
    }

    isNight() {
        const period = this.getCurrentPeriod();
        return period === 'night' || period === 'lateNight';
    }

    isDay() {
        const period = this.getCurrentPeriod();
        return period === 'morning' || period === 'afternoon';
    }

    getTimeString() {
        return Utils.formatTime(Math.floor(this.gameTime));
    }

    // 设置时间速度
    setSpeed(speed) {
        this.speed = Utils.clamp(speed, 0.5, 5);
    }

    // 暂停/继续
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }

    // 获取游戏状态
    getState() {
        return {
            gameTime: this.gameTime,
            day: this.day,
            speed: this.speed,
            paused: this.paused,
            period: this.getCurrentPeriod()
        };
    }

    // 加载状态
    loadState(state) {
        this.gameTime = Number.isFinite(state.gameTime) ? state.gameTime : 360;
        this.day = state.day || 1;
        this.speed = state.speed || 1;
        this.paused = state.paused || false;
        this.lastPeriod = this.getCurrentPeriod();
    }
}

// 全局时间系统
const Time = new TimeSystem();

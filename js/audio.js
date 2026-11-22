// 音频系统 - 使用Web Audio API生成音效
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
            this.enabled = false;
        }
    }

    // 播放音符
    playNote(freq, duration, type = 'square', volume = 1) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(this.volume * volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // 播放一系列音符
    playMelody(notes, tempo = 150) {
        if (!this.enabled || !this.ctx) return;
        
        const noteDuration = 60 / tempo;
        notes.forEach((note, i) => {
            if (note > 0) {
                setTimeout(() => this.playNote(note, noteDuration * 0.9), i * noteDuration * 1000);
            }
        });
    }

    // 音效：顾客进门
    playDoorBell() {
        this.playMelody([880, 1100, 880], 300);
    }

    // 音效：购买成功
    playPurchase() {
        this.playMelody([523, 659, 784, 1047], 200);
    }

    // 音效：金钱
    playMoney() {
        this.playNote(1047, 0.1, 'square');
        setTimeout(() => this.playNote(1319, 0.15, 'square'), 50);
    }

    // 音效：升级
    playUpgrade() {
        this.playMelody([262, 330, 392, 523, 659, 784], 150);
    }

    // 音效：错误
    playError() {
        this.playNote(150, 0.2, 'sawtooth', 0.5);
    }

    // 音效：通知
    playNotification() {
        this.playNote(880, 0.1, 'sine');
        setTimeout(() => this.playNote(1100, 0.15, 'sine'), 100);
    }

    // 音效：事件发生
    playEvent() {
        this.playMelody([440, 554, 659, 880], 120);
    }

    // 音效：顾客离开（开心）
    playHappyCustomer() {
        this.playMelody([523, 659, 784], 180);
    }

    // 音效：顾客离开（生气）
    playAngryCustomer() {
        this.playNote(200, 0.3, 'sawtooth', 0.3);
    }

    // 音效：点击
    playClick() {
        this.playNote(600, 0.05, 'square', 0.3);
    }

    // 音效：夜晚氛围
    playNightAmbience() {
        if (!this.enabled || !this.ctx) return;
        
        // 低频嗡嗡声
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 60;
        
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 2);
    }

    // 音效：特殊事件
    playSpecialEvent() {
        this.playMelody([262, 330, 392, 523, 659, 784, 1047], 100);
    }

    // 音效：成就解锁
    playAchievement() {
        const notes = [523, 659, 784, 1047, 784, 1047, 1319];
        this.playMelody(notes, 120);
    }

    // 设置音量
    setVolume(vol) {
        this.volume = Utils.clamp(vol, 0, 1);
    }

    // 启用/禁用
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// 全局音频实例
const Audio = new AudioSystem();

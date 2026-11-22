// 主游戏系统
class Game {
    constructor() {
        this.running = false;
        this.lastTime = 0;
        this.rafId = null;
        this.achievementCheckTimer = 0;
        this.endingCheckTimer = 0;
        this.autoSaveTimer = 0;
        this.speedLevels = [0.5, 1, 2, 3];
        this.currentSpeedIndex = 1;
        this.gameOver = false;
        this.tutorialShown = false;
    }

    init() {
        // 初始化所有系统
        Renderer.init('game-canvas');
        UI.init();

        // 绑定按钮事件
        this.bindEvents();

        // 更新按钮状态
        UI.updateButtons();

        // 初始化音频（需要用户交互触发）
        this.audioInitialized = false;

        // 显示主菜单
        UI.showScreen('main-menu');
    }

    bindEvents() {
        // 主菜单按钮
        document.getElementById('btn-new-game').addEventListener('click', () => this.newGame());
        document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
        document.getElementById('btn-help').addEventListener('click', () => {
            UI.showScreen('help-screen');
            Audio.playClick();
        });

        // 帮助页面返回
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            UI.showScreen('main-menu');
            Audio.playClick();
        });

        // 结局画面重新开始
        document.getElementById('btn-restart').addEventListener('click', () => {
            SaveSystem.deleteSave();
            UI.showScreen('main-menu');
            UI.updateButtons();
        });

        // 游戏控制按钮
        document.getElementById('btn-inventory').addEventListener('click', () => {
            UI.showInventoryPanel();
        });
        document.getElementById('btn-upgrade').addEventListener('click', () => {
            UI.showUpgradePanel();
        });
        document.getElementById('btn-stats').addEventListener('click', () => {
            UI.showStatsPanel();
        });
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.togglePause();
        });

        // 画布点击事件
        Renderer.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // 时间系统回调
        Time.onTimeChange = (time, day) => this.onTimeChange(time, day);
        Time.onDayChange = (day) => this.onDayChange(day);
        Time.onPeriodChange = (period) => this.onPeriodChange(period);

        // 顾客系统回调
        Customers.onCustomerEnter = (customer) => this.onCustomerEnter(customer);
        Customers.onCustomerLeave = (customer) => this.onCustomerLeave(customer);
        Customers.onCustomerPurchase = (customer, total) => this.onCustomerPurchase(customer, total);
        Customers.onCustomerAngry = (customer) => this.onCustomerAngry(customer);

        // 事件系统回调
        Events.onEventStart = (event) => this.onEventStart(event);
        Events.onEventEnd = (event) => this.onEventEnd(event);

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // 新游戏
    newGame() {
        this.initAudio();

        // 停止旧的游戏循环
        this.stopGameLoop();

        // 重置所有系统
        Shop.reset();
        Time.gameTime = 360; // 6:00
        Time.day = 1;
        Time.speed = 1;
        Time.paused = false;
        Time.lastPeriod = null;
        Customers.clear();
        Events.clear();
        Upgrades.purchased = [];
        Upgrades.achievements = [];
        Upgrades.stats = {
            totalSales: 0,
            money: 1000,
            daysPlayed: 0,
            nightCustomers: 0,
            alienCustomers: 0,
            robotCustomers: 0,
            catEncounters: 0,
            eventsExperienced: 0,
            unlockedProducts: 4,
            achievementsUnlocked: 0
        };

        this.gameOver = false;
        this.currentSpeedIndex = 1;

        // 切换到游戏画面
        UI.showScreen('game-screen');
        UI.updateHeader();
        // 画面可见后重算画布尺寸（此前容器 display:none，尺寸为 0）
        Renderer.resize();
        this.resetPauseButton();

        // 开始游戏循环
        this.startGameLoop();

        // 显示欢迎通知
        UI.showNotification('🏪 欢迎来到赛博便利店！开始你的经营之旅吧！', 'info', 4000);

        Audio.playClick();
    }

    // 继续游戏
    continueGame() {
        this.initAudio();

        const loaded = SaveSystem.load();
        if (!loaded) {
            UI.showNotification('没有找到存档，开始新游戏', 'warning');
            this.newGame();
            return;
        }

        this.gameOver = false;
        this.currentSpeedIndex = 1;

        // 切换到游戏画面
        UI.showScreen('game-screen');
        UI.updateHeader();
        // 画面可见后重算画布尺寸
        Renderer.resize();
        this.resetPauseButton();

        // 开始游戏循环
        this.startGameLoop();

        UI.showNotification(`📂 存档加载成功！第${Time.day}天`, 'success');
        Audio.playClick();
    }

    // 初始化音频（需要用户交互）
    initAudio() {
        if (!this.audioInitialized) {
            Audio.init();
            this.audioInitialized = true;
        }
    }

    // 开始游戏循环
    startGameLoop() {
        this.stopGameLoop();
        this.running = true;
        this.lastTime = performance.now();
        const loop = (t) => this.gameLoop(t);
        this.rafId = requestAnimationFrame(loop);
    }

    // 停止游戏循环
    stopGameLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.running = false;
    }

    // 主游戏循环
    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!Time.paused && !this.gameOver) {
            // 更新时间
            Time.update(deltaTime);

            // 更新顾客（考虑事件效果）
            this.updateCustomersWithEvents(deltaTime);

            // 更新事件
            Events.update(deltaTime);

            // 定期检查成就
            this.achievementCheckTimer += deltaTime;
            if (this.achievementCheckTimer > 5000) { // 每5秒检查一次
                this.checkAchievements();
                this.achievementCheckTimer = 0;
            }

            // 定期检查结局
            this.endingCheckTimer += deltaTime;
            if (this.endingCheckTimer > 10000) { // 每10秒检查一次
                this.checkEnding();
                this.endingCheckTimer = 0;
            }

            // 自动存档
            this.autoSaveTimer += deltaTime;
            if (this.autoSaveTimer > 30000) { // 每30秒自动存档
                SaveSystem.save();
                this.autoSaveTimer = 0;
            }
        }

        // 渲染（即使暂停也渲染）
        Renderer.render();

        // 更新UI
        UI.updateHeader();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // 更新顾客（考虑事件效果）
    updateCustomersWithEvents(deltaTime) {
        // 停电时不生成新顾客
        Customers.noPower = Events.hasEffect('noCustomers');

        Customers.update(deltaTime, Shop);
    }

    // 时间变化回调
    onTimeChange(time, day) {
        // 可以在这里添加时间相关的事件触发
    }

    // 新的一天回调
    onDayChange(day) {
        Shop.newDay();
        Upgrades.stats.daysPlayed = day;

        UI.showNotification(`🌅 新的一天开始了！第${day}天`, 'info');

        // 每天开始时有小概率触发事件
        if (Utils.chance(0.3)) {
            Events.tryTriggerEvent();
        }

        // 检查是否有可解锁的商品
        const unlockable = Shop.getUnlockableProducts();
        if (unlockable.length > 0) {
            UI.showNotification(`📦 有新商品可以解锁了！`, 'success', 4000);
        }
    }

    // 时间段变化回调
    onPeriodChange(period) {
        const info = Time.getPeriodInfo();

        if (period === 'night' || period === 'lateNight') {
            UI.showNotification(`${info.icon} ${info.name}来临，特殊顾客开始出没...`, 'event', 4000);
            Audio.playNightAmbience();
        } else if (period === 'morning') {
            UI.showNotification(`${info.icon} 早上好！新的一天充满活力！`, 'info');
        }
    }

    // 顾客进入回调
    onCustomerEnter(customer) {
        // 统计特殊顾客
        if (customer.type.id === 'cat') {
            Upgrades.addStat('catEncounters');
        }

        // 添加进门粒子
        Renderer.addParticle(customer.x + 16, customer.y + 20, '#00ffff', 5);
    }

    // 顾客离开回调
    onCustomerLeave(customer) {
        // 可以添加离开统计
    }

    // 顾客购买回调
    onCustomerPurchase(customer, total) {
        // 更新统计
        Upgrades.addStat('totalSales');
        Upgrades.stats.money = Shop.money;
        Upgrades.stats.unlockedProducts = Shop.unlockedProducts.length;

        // 统计特殊顾客购买
        if (Time.isNight()) {
            Upgrades.addStat('nightCustomers');
        }
        if (customer.type.id === 'alien') {
            Upgrades.addStat('alienCustomers');
        }
        if (customer.type.id === 'robot') {
            Upgrades.addStat('robotCustomers');
        }

        // 添加金钱粒子
        Renderer.addMoneyParticle(Renderer.scene.register.x + 50, Renderer.scene.register.y);

        // 事件效果：双倍收入
        if (Events.hasEffect('doubleMoney')) {
            Shop.addMoney(total);
            UI.showNotification('🍀 幸运之日！收入翻倍！', 'success');
        }
    }

    // 顾客生气回调
    onCustomerAngry(customer) {
        // 更新统计（负面）
        Shop.addReputation(-1);
    }

    // 事件开始回调
    onEventStart(event) {
        UI.showEventNotification(event);
        Upgrades.addStat('eventsExperienced');

        // 特殊效果
        if (event.id === 'powerOutage') {
            Audio.playError();
        } else if (event.id === 'mysteriousCustomer' || event.id === 'alienTrade') {
            Audio.playSpecialEvent();
        }
    }

    // 事件结束回调
    onEventEnd(event) {
        // 某些事件结束时可能有额外效果
    }

    // 检查成就
    checkAchievements() {
        // 更新统计数据
        Upgrades.stats.money = Shop.money;
        Upgrades.stats.unlockedProducts = Shop.unlockedProducts.length;

        const newAchievements = Upgrades.checkAchievements();
        newAchievements.forEach(achievement => {
            UI.showAchievementNotification(achievement);
        });
    }

    // 检查结局
    checkEnding() {
        if (this.gameOver) return;

        const ending = Upgrades.checkEnding();
        if (ending) {
            this.triggerEnding(ending);
        }
    }

    // 触发结局
    triggerEnding(ending) {
        this.gameOver = true;
        Time.paused = true;

        // 保存最终状态
        SaveSystem.save();

        // 显示结局画面
        UI.showEnding(ending);
    }

    // 复位暂停按钮文案（新游戏/读档后调用）
    resetPauseButton() {
        const btn = document.getElementById('btn-pause');
        if (btn) btn.textContent = '⏸️ 暂停';
    }

    // 切换暂停
    togglePause() {
        const paused = Time.togglePause();
        const btn = document.getElementById('btn-pause');
        btn.textContent = paused ? '▶️ 继续' : '⏸️ 暂停';

        if (paused) {
            UI.showNotification('⏸️ 游戏已暂停', 'info');
        }
    }

    // 画布点击处理
    handleCanvasClick(event) {
        if (Time.paused) return;

        const coords = Renderer.getCanvasCoords(event);

        // 检查是否点击了顾客
        const customer = Renderer.getClickedCustomer(coords.x, coords.y);
        if (customer) {
            this.showCustomerInfo(customer);
            return;
        }

        // 检查是否点击了货架
        const shelfIndex = Renderer.getClickedShelf(coords.x, coords.y);
        if (shelfIndex >= 0) {
            UI.showInventoryPanel();
            return;
        }

        // 检查是否点击了收银台
        const reg = Renderer.scene.register;
        if (coords.x >= reg.x && coords.x <= reg.x + reg.width &&
            coords.y >= reg.y && coords.y <= reg.y + reg.height) {
            UI.showNotification('💳 收银台：顾客会自动结账', 'info');
            return;
        }

        // 检查是否点击了门
        const door = Renderer.scene.door;
        if (coords.x >= door.x && coords.x <= door.x + door.width &&
            coords.y >= door.y && coords.y <= door.y + door.height) {
            UI.showNotification('🚪 店门：顾客会自动进出', 'info');
            return;
        }
    }

    // 显示顾客信息
    showCustomerInfo(customer) {
        const type = customer.type;
        let content = `
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 3em; margin-bottom: 10px;">${type.icon}</div>
                <h3 style="color: #00ffff; margin-bottom: 5px;">${type.name}</h3>
                <p style="color: #888; margin-bottom: 15px;">当前状态: ${this.getStateName(customer.state)}</p>
                
                <div style="text-align: left; background: #0f0f2a; padding: 15px; border-radius: 5px;">
                    <p>💰 预算: ${Utils.formatMoney(customer.budget + customer.purchasedProducts.reduce((s, p) => s + p.price, 0))}</p>
                    <p>❤️ 耐心: ${Math.floor(customer.patience)}/${customer.maxPatience}</p>
                    <p>🛒 已购买: ${customer.purchasedProducts.length} 件</p>
                    <p>🔍 想要: ${customer.wantedProducts.length} 件</p>
                </div>
                
                ${customer.purchasedProducts.length > 0 ? `
                    <div style="margin-top: 15px; text-align: left;">
                        <p style="color: #ffdd00;">已选购商品:</p>
                        ${customer.purchasedProducts.map(p => `<p>• ${p.icon} ${p.name} - ${Utils.formatMoney(p.price)}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        UI.showModal(`顾客详情`, content);
    }

    // 获取状态名称
    getStateName(state) {
        const names = {
            entering: '进店中',
            browsing: '浏览商品',
            goingToRegister: '前往收银台',
            checkout: '结账中',
            leaving: '离开',
            happy: '满意离开',
            angry: '生气离开'
        };
        return names[state] || state;
    }

    // 键盘快捷键
    handleKeyboard(event) {
        if (!this.running) return;

        switch (event.key) {
            case ' ':
                event.preventDefault();
                this.togglePause();
                break;
            case 'i':
            case 'I':
                UI.showInventoryPanel();
                break;
            case 'u':
            case 'U':
                UI.showUpgradePanel();
                break;
            case 's':
            case 'S':
                UI.showStatsPanel();
                break;
            case '+':
            case '=':
                this.increaseSpeed();
                break;
            case '-':
            case '_':
                this.decreaseSpeed();
                break;
            case '1':
                Time.setSpeed(1);
                UI.showNotification('⏩ 速度: 1x', 'info');
                break;
            case '2':
                Time.setSpeed(2);
                UI.showNotification('⏩ 速度: 2x', 'info');
                break;
            case '3':
                Time.setSpeed(3);
                UI.showNotification('⏩ 速度: 3x', 'info');
                break;
        }
    }

    // 增加速度
    increaseSpeed() {
        if (this.currentSpeedIndex < this.speedLevels.length - 1) {
            this.currentSpeedIndex++;
            Time.setSpeed(this.speedLevels[this.currentSpeedIndex]);
            UI.showNotification(`⏩ 速度: ${this.speedLevels[this.currentSpeedIndex]}x`, 'info');
        }
    }

    // 减少速度
    decreaseSpeed() {
        if (this.currentSpeedIndex > 0) {
            this.currentSpeedIndex--;
            Time.setSpeed(this.speedLevels[this.currentSpeedIndex]);
            UI.showNotification(`⏩ 速度: ${this.speedLevels[this.currentSpeedIndex]}x`, 'info');
        }
    }
}

// 全局游戏实例
const GameInstance = new Game();

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    GameInstance.init();
});

// 页面关闭前保存
window.addEventListener('beforeunload', () => {
    if (GameInstance.running && !GameInstance.gameOver) {
        SaveSystem.save();
    }
});

// 商店系统
class ShopSystem {
    constructor() {
        this.money = 1000; // 初始资金
        this.reputation = 0; // 声誉
        this.level = 1; // 店铺等级
        this.shelfSpace = 4; // 货架空间：可同时上架的商品种类上限
        
        // 库存
        this.inventory = {};
        
        // 价格设置
        this.prices = {};
        
        // 已上架的商品（受 shelfSpace 限制）
        this.shelved = [];
        
        // 统计
        this.stats = {
            totalSales: 0,
            totalIncome: 0,
            totalExpense: 0,
            customersServed: 0,
            dayIncome: 0,
            dayExpense: 0
        };
        
        // 解锁的商品
        this.unlockedProducts = ['noodles', 'burger', 'onigiri', 'cola'];

        // 升级带来的持续效果（累加值）
        this.upgradeEffects = {
            customerRate: 0,
            customerPatience: 0,
            checkoutSpeed: 0,
            theftReduction: 0,
            vipCustomerRate: 0,
            alienRate: 0
        };
        
        // 初始化库存
        this.initInventory();
    }

    initInventory() {
        // 初始库存
        this.unlockedProducts.forEach(id => {
            this.inventory[id] = 10;
            const product = GameData.products[id];
            this.prices[id] = product.basePrice;
        });
        this.syncShelved();
    }

    // 货架容量：可同时上架的商品种类上限（由「扩展货架」升级提升）
    getShelfCapacity() {
        return this.shelfSpace;
    }

    // 是否已上架
    isShelved(productId) {
        return this.shelved.includes(productId);
    }

    // 上架/下架。返回是否操作成功（容量已满时上架失败）
    setShelved(productId, on) {
        if (!this.unlockedProducts.includes(productId)) {
            return { success: false, message: '商品未解锁' };
        }
        if (on) {
            if (this.isShelved(productId)) return { success: true };
            if (this.shelved.length >= this.getShelfCapacity()) {
                return { success: false, message: `货架已满（${this.shelved.length}/${this.getShelfCapacity()}），请先下架其他商品或购买「扩展货架」` };
            }
            this.shelved.push(productId);
            return { success: true };
        }
        this.shelved = this.shelved.filter(id => id !== productId);
        return { success: true };
    }

    // 校准上架列表：清理无效项，并自动补满空余货位
    syncShelved(fillEmpty = true) {
        const capacity = this.getShelfCapacity();
        this.shelved = [...new Set((this.shelved || []).filter(id => this.unlockedProducts.includes(id)))];
        if (this.shelved.length > capacity) {
            this.shelved = this.shelved.slice(0, capacity);
        }
        if (!fillEmpty) return;
        for (const id of this.unlockedProducts) {
            if (this.shelved.length >= capacity) break;
            if (!this.shelved.includes(id)) this.shelved.push(id);
        }
    }

    // 重置商店状态（用于新游戏）
    reset() {
        this.money = 1000;
        this.reputation = 0;
        this.level = 1;
        this.shelfSpace = 4;
        this.inventory = {};
        this.prices = {};
        this.unlockedProducts = ['noodles', 'burger', 'onigiri', 'cola'];
        this.shelved = [];
        this.upgradeEffects = {
            customerRate: 0,
            customerPatience: 0,
            checkoutSpeed: 0,
            theftReduction: 0,
            vipCustomerRate: 0,
            alienRate: 0
        };
        this.stats = {
            totalSales: 0,
            totalIncome: 0,
            totalExpense: 0,
            customersServed: 0,
            dayIncome: 0,
            dayExpense: 0
        };
        this.initInventory();
    }

    // 获取顾客可购买的商品（仅上架且有库存）
    getAvailableProducts() {
        return this.shelved
            .map(id => ({
                ...GameData.products[id],
                price: this.prices[id],
                stock: this.inventory[id] || 0
            }))
            .filter(p => p.stock > 0);
    }

    // 获取所有已解锁商品（包括无库存、未上架），供库存面板使用
    getAllProducts() {
        return this.unlockedProducts.map(id => ({
            ...GameData.products[id],
            price: this.prices[id],
            stock: this.inventory[id] || 0,
            shelved: this.isShelved(id)
        }));
    }

    // 获取商品库存
    getProductStock(productId) {
        return this.inventory[productId] || 0;
    }

    // 进货
    purchaseProduct(productId, quantity = 1) {
        const product = GameData.products[productId];
        if (!product) return { success: false, message: '商品不存在' };
        
        if (!this.unlockedProducts.includes(productId)) {
            return { success: false, message: '商品未解锁' };
        }
        
        const cost = product.baseCost * quantity;
        if (this.money < cost) {
            return { success: false, message: '资金不足' };
        }
        
        this.money -= cost;
        this.inventory[productId] = (this.inventory[productId] || 0) + quantity;
        this.stats.totalExpense += cost;
        this.stats.dayExpense += cost;
        
        return { success: true, message: `进货成功：${product.name} x${quantity}` };
    }

    // 销售商品。priceOverride 为顾客在货架前确认的成交价（缺省取当前售价）
    sellProduct(productId, priceOverride) {
        if (this.inventory[productId] > 0) {
            this.inventory[productId]--;
            const currentPrice = this.prices[productId];
            // 取顾客确认价与当前售价的较小值：
            // 玩家中途降价则按更低价成交，中途抬价也不会向顾客收取超出其预算的新价
            const price = (typeof priceOverride === 'number')
                ? Math.min(priceOverride, currentPrice)
                : currentPrice;
            this.stats.totalIncome += price;
            this.stats.dayIncome += price;
            this.stats.totalSales++;
            return price;
        }
        return 0;
    }

    // 设置价格
    setPrice(productId, price) {
        const product = GameData.products[productId];
        if (!product) return false;
        
        // 价格限制：成本价到5倍基础价
        const minPrice = product.baseCost;
        const maxPrice = product.basePrice * 5;
        this.prices[productId] = Utils.clamp(price, minPrice, maxPrice);
        return true;
    }

    // 增加资金
    addMoney(amount) {
        this.money += amount;
    }

    // 增加声誉
    addReputation(amount) {
        this.reputation += amount;
        this.reputation = Math.max(0, this.reputation);
        
        // 检查升级
        this.checkLevelUp();
    }

    // 检查升级
    checkLevelUp() {
        const thresholds = [0, 10, 30, 60, 100, 150, 200, 300, 400, 500];
        const newLevel = thresholds.findIndex((t, i) => 
            i === thresholds.length - 1 || this.reputation < thresholds[i + 1]
        ) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.onLevelUp();
        }
    }

    onLevelUp() {
        // 解锁新商品
        Object.values(GameData.products).forEach(product => {
            if (product.unlockLevel <= this.level && !this.unlockedProducts.includes(product.id)) {
                this.unlockedProducts.push(product.id);
                this.inventory[product.id] = 5; // 初始库存
                this.prices[product.id] = product.basePrice;
            }
        });
        this.syncShelved();
    }

    // 新的一天
    newDay() {
        this.stats.dayIncome = 0;
        this.stats.dayExpense = 0;
    }

    // 获取可解锁的商品
    getUnlockableProducts() {
        return Object.values(GameData.products).filter(p => 
            !this.unlockedProducts.includes(p.id) && p.unlockLevel <= this.level + 1
        );
    }

    // 解锁商品（需要满足条件）
    unlockProduct(productId) {
        const product = GameData.products[productId];
        if (!product) return { success: false, message: '商品不存在' };
        
        if (this.unlockedProducts.includes(productId)) {
            return { success: false, message: '商品已解锁' };
        }
        
        if (product.unlockLevel > this.level) {
            return { success: false, message: `需要店铺等级 ${product.unlockLevel}` };
        }
        
        this.unlockedProducts.push(productId);
        this.inventory[productId] = 5;
        this.prices[productId] = product.basePrice;
        this.syncShelved();
        
        return { success: true, message: `解锁新商品：${product.name}` };
    }

    // 获取状态
    getState() {
        return {
            money: this.money,
            reputation: this.reputation,
            level: this.level,
            shelfSpace: this.shelfSpace,
            inventory: { ...this.inventory },
            prices: { ...this.prices },
            unlockedProducts: [...this.unlockedProducts],
            shelved: [...this.shelved],
            upgradeEffects: { ...this.upgradeEffects },
            stats: { ...this.stats }
        };
    }

    // 加载状态
    loadState(state) {
        this.money = Number.isFinite(state.money) ? Math.max(0, state.money) : 1000;
        this.reputation = state.reputation || 0;
        this.level = state.level || 1;
        this.shelfSpace = state.shelfSpace || 4;
        this.inventory = state.inventory || {};
        this.prices = state.prices || {};
        this.unlockedProducts = state.unlockedProducts || ['noodles', 'burger', 'onigiri', 'cola'];
        const hasSavedShelves = Array.isArray(state.shelved);
        this.shelved = hasSavedShelves ? [...state.shelved] : [];
        this.upgradeEffects = state.upgradeEffects || {
            customerRate: 0,
            customerPatience: 0,
            checkoutSpeed: 0,
            theftReduction: 0,
            vipCustomerRate: 0,
            alienRate: 0
        };
        this.stats = state.stats || this.stats;
        this.syncShelved(!hasSavedShelves);
    }

    // 应用升级效果
    applyUpgradeEffect(effect) {
        if (effect.shelfSpace) {
            this.shelfSpace += effect.shelfSpace;
            // 扩容后立即把新解锁但未上架的商品自动补上货架
            this.syncShelved();
        }
        // 其余持续效果累加，供顾客系统/事件系统查询
        ['customerRate', 'customerPatience', 'checkoutSpeed',
         'theftReduction', 'vipCustomerRate', 'alienRate'].forEach(key => {
            if (effect[key]) {
                this.upgradeEffects[key] += effect[key];
            }
        });
    }

    // 获取某项升级效果的累计值
    getUpgradeEffect(key) {
        return this.upgradeEffects[key] || 0;
    }
}

// 全局商店系统
const Shop = new ShopSystem();

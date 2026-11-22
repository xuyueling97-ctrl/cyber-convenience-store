// 顾客系统
class CustomerSystem {
    constructor() {
        this.customers = [];
        this.maxCustomers = 5;
        this.spawnRate = 0.25; // 每秒生成概率（基础值，约 4 秒来一位顾客）
        this.spawnTimer = 0;
        this.spawnInterval = 60; // 每60帧（约1秒）检查一次生成
        this.noPower = false; // 停电时不生成新顾客
        
        // 顾客ID计数器
        this.nextId = 1;
        
        // 路径点
        this.waypoints = {
            entrance: { x: 50, y: 300 },
            shelf1: { x: 200, y: 200 },
            shelf2: { x: 350, y: 200 },
            shelf3: { x: 500, y: 200 },
            register: { x: 650, y: 280 },
            exit: { x: 750, y: 300 }
        };
        
        // 顾客颜色
        this.customerColors = [
            '#4488ff', '#ff4488', '#44ff88', '#ffaa44', 
            '#aa44ff', '#44ffff', '#ff44ff', '#ffff44'
        ];
        
        // 回调
        this.onCustomerEnter = null;
        this.onCustomerLeave = null;
        this.onCustomerPurchase = null;
        this.onCustomerAngry = null;
    }

    update(deltaTime, shop) {
        // 生成新顾客（考虑事件、停电与升级效果）
        this.spawnTimer++;
        const rateModifier = Events.getEffectModifier('customerRate');
        const upgradeRate = 1 + shop.getUpgradeEffect('customerRate');
        const effectiveSpawnRate = Utils.clamp(this.spawnRate * rateModifier * upgradeRate, 0, 0.95);
        
        if (!this.noPower 
            && this.spawnTimer >= this.spawnInterval 
            && this.customers.length < this.maxCustomers) {
            if (Utils.chance(effectiveSpawnRate)) {
                this.spawnCustomer(shop);
            }
            this.spawnTimer = 0;
        }
        
        // 更新所有顾客
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const customer = this.customers[i];
            this.updateCustomer(customer, deltaTime, shop);
            
            // 移除离开的顾客
            if (customer.state === 'leaving' && customer.x > 800) {
                this.customers.splice(i, 1);
            }
        }
    }

    spawnCustomer(shop) {
        // 根据时间段选择顾客类型
        const isNight = Time.isNight();
        const types = Object.values(GameData.customerTypes);
        
        // 计算权重（叠加升级效果：VIP休息室提升高预算客、传送门提升外星客）
        const vipBoost = 1 + shop.getUpgradeEffect('vipCustomerRate');
        const alienBoost = 1 + shop.getUpgradeEffect('alienRate');
        const weights = types.map(type => {
            let w = isNight ? type.spawnWeight.night : type.spawnWeight.day;
            if (type.id === 'hacker') w *= vipBoost;
            if (type.id === 'alien') w *= alienBoost;
            return w;
        });
        
        // 加权随机选择
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedType = types[0];
        
        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedType = types[i];
                break;
            }
        }
        
        // 创建顾客
        const customer = {
            id: this.nextId++,
            type: selectedType,
            x: this.waypoints.entrance.x - 50,
            y: this.waypoints.entrance.y,
            targetX: this.waypoints.entrance.x,
            targetY: this.waypoints.entrance.y,
            speed: 1 + Math.random() * 0.5,
            state: 'entering', // entering, browsing, goingToRegister, checkout, leaving
            patience: selectedType.patience * (1 + shop.getUpgradeEffect('customerPatience')),
            maxPatience: selectedType.patience * (1 + shop.getUpgradeEffect('customerPatience')),
            budget: Utils.randomInt(selectedType.budget[0], selectedType.budget[1]),
            wantedProducts: [],
            purchasedProducts: [],
            color: Utils.pick(this.customerColors),
            dialogTimer: 0,
            currentDialog: null,
            stateTimer: 0
        };
        
        // 选择想买的商品
        this.selectWantedProducts(customer, shop);
        
        this.customers.push(customer);
        
        // 显示进入对话
        this.showCustomerDialog(customer, Utils.pick(selectedType.dialogues.enter));
        
        if (this.onCustomerEnter) {
            this.onCustomerEnter(customer);
        }
        
        Audio.playDoorBell();
    }

    selectWantedProducts(customer, shop) {
        // 特殊顾客（如猫咪）不购物
        if (customer.type.special) {
            return;
        }

        const availableProducts = shop.getAvailableProducts();
        const preferredCategories = customer.type.preferredCategories;
        
        // 筛选符合偏好的商品
        const preferred = availableProducts.filter(p => 
            preferredCategories.includes(p.category)
        );
        
        // 随机选择1-3件商品
        const count = Utils.randomInt(1, Math.min(3, preferred.length || availableProducts.length));
        const pool = preferred.length > 0 ? preferred : availableProducts;
        
        for (let i = 0; i < count && pool.length > 0; i++) {
            const index = Utils.randomInt(0, pool.length - 1);
            const product = pool[index];
            
            // 检查预算
            if (product.price <= customer.budget) {
                customer.wantedProducts.push(product);
                customer.budget -= product.price;
            }
            
            pool.splice(index, 1);
        }
    }

    updateCustomer(customer, deltaTime, shop) {
        customer.stateTimer++;
        
        // 更新耐心值（结账后不再减少）
        if (customer.state !== 'leaving' && customer.state !== 'entering' 
            && customer.state !== 'waiting') {
            customer.patience -= 0.1;
            
            if (customer.patience <= 0) {
                this.makeCustomerAngry(customer);
                return;
            }
        }
        
        // 状态机
        switch (customer.state) {
            case 'entering':
                this.updateEntering(customer);
                break;
            case 'browsing':
                this.updateBrowsing(customer, shop);
                break;
            case 'goingToRegister':
                this.updateGoingToRegister(customer);
                break;
            case 'checkout':
                this.updateCheckout(customer, shop);
                break;
            case 'waiting':
                this.updateWaiting(customer);
                break;
            case 'leaving':
                this.updateLeaving(customer);
                break;
        }
        
        // 更新对话
        if (customer.dialogTimer > 0) {
            customer.dialogTimer--;
        }
    }

    updateEntering(customer) {
        // 移动到店内
        if (customer.x < customer.targetX) {
            customer.x += customer.speed;
        } else {
            customer.state = 'browsing';
            customer.targetX = Utils.pick([
                this.waypoints.shelf1.x,
                this.waypoints.shelf2.x,
                this.waypoints.shelf3.x
            ]);
            customer.targetY = this.waypoints.shelf1.y + Utils.random(-20, 20);
        }
    }

    updateBrowsing(customer, shop) {
        // 移动到货架
        const dx = customer.targetX - customer.x;
        const dy = customer.targetY - customer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            customer.x += (dx / dist) * customer.speed;
            customer.y += (dy / dist) * customer.speed;
        } else {
            // 到达货架，考虑购买
            this.tryPurchaseAtShelf(customer, shop);
            
            // 决定下一步
            if (customer.wantedProducts.length > 0) {
                // 还有想买的，去另一个货架
                customer.targetX = Utils.pick([
                    this.waypoints.shelf1.x,
                    this.waypoints.shelf2.x,
                    this.waypoints.shelf3.x
                ]);
                customer.targetY = this.waypoints.shelf1.y + Utils.random(-20, 20);
            } else {
                // 去结账
                customer.state = 'goingToRegister';
                customer.targetX = this.waypoints.register.x;
                customer.targetY = this.waypoints.register.y;
            }
        }
    }

    tryPurchaseAtShelf(customer, shop) {
        if (customer.wantedProducts.length === 0) return;
        
        const product = customer.wantedProducts[0];
        const stock = shop.getProductStock(product.id);
        
        // 预算已在 selectWantedProducts 阶段预扣；若玩家在浏览期间抬价超出剩余预算，
        // 则放弃该商品（避免按超出顾客预算的新价强行成交）
        const currentPrice = shop.prices[product.id] !== undefined
            ? shop.prices[product.id] : product.price;
        
        if (stock > 0 && currentPrice <= customer.budget) {
            // 购买商品
            customer.purchasedProducts.push(product);
            customer.wantedProducts.shift();
            customer.budget -= currentPrice;
            
            // 随机对话
            if (Utils.chance(0.3)) {
                this.showCustomerDialog(customer, '不错，这个我要了');
            }
        } else {
            // 太贵或没货，放弃这件商品
            customer.wantedProducts.shift();
        }
    }

    updateGoingToRegister(customer) {
        const dx = customer.targetX - customer.x;
        const dy = customer.targetY - customer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            customer.x += (dx / dist) * customer.speed;
            customer.y += (dy / dist) * customer.speed;
        } else {
            customer.state = 'checkout';
            customer.stateTimer = 0;
        }
    }

    updateCheckout(customer, shop) {
        // 结账过程（自动收银机升级可缩短结账时间）
        const checkoutSpeed = shop.getUpgradeEffect('checkoutSpeed');
        const checkoutFrames = Math.max(20, Math.round(60 * (1 - checkoutSpeed)));
        if (customer.stateTimer >= checkoutFrames) {
            this.completePurchase(customer, shop);
            // 保存情绪状态（completePurchase可能设置happy/angry）
            customer.emotion = customer.state; // 保存 happy/angry/正常离开
            // 进入等待状态，显示情绪
            customer.state = 'waiting';
            customer.stateTimer = 0;
            customer.emotionTimer = 90; // 1.5秒显示情绪
        }
    }

    // 更新等待状态（显示购买后情绪）
    updateWaiting(customer) {
        customer.emotionTimer--;
        if (customer.emotionTimer <= 0) {
            customer.state = 'leaving';
            customer.targetX = this.waypoints.exit.x + 100;
            customer.targetY = this.waypoints.exit.y;
        }
    }

    completePurchase(customer, shop) {
        if (customer.purchasedProducts.length === 0) {
            // 没买任何东西
            this.showCustomerDialog(customer, '没什么想买的...');
            return;
        }
        
        let total = 0;
        customer.purchasedProducts.forEach(product => {
            // 以结算时的实际售价计费，与 Shop.stats 保持一致
            total += shop.sellProduct(product.id);
        });
        
        shop.addMoney(total);
        
        // 根据价格满意度
        const avgPriceRatio = total / customer.purchasedProducts.reduce((sum, p) => sum + p.basePrice, 0);
        
        if (avgPriceRatio <= 1.2) {
            customer.state = 'happy';
            this.showCustomerDialog(customer, Utils.pick(customer.type.dialogues.happy));
            shop.addReputation(1);
            Audio.playHappyCustomer();
        } else if (avgPriceRatio > 1.5) {
            customer.state = 'angry';
            this.showCustomerDialog(customer, Utils.pick(customer.type.dialogues.angry));
            shop.addReputation(-1);
            Audio.playAngryCustomer();
        } else {
            this.showCustomerDialog(customer, Utils.pick(customer.type.dialogues.leave));
        }
        
        if (this.onCustomerPurchase) {
            this.onCustomerPurchase(customer, total);
        }
        
        Audio.playPurchase();
        Audio.playMoney();
    }

    updateLeaving(customer) {
        if (customer.x < customer.targetX) {
            customer.x += customer.speed * 1.5;
        }
    }

    makeCustomerAngry(customer) {
        customer.state = 'leaving';
        customer.targetX = this.waypoints.exit.x + 100;
        customer.targetY = this.waypoints.exit.y;
        
        this.showCustomerDialog(customer, Utils.pick(customer.type.dialogues.angry));
        
        if (this.onCustomerAngry) {
            this.onCustomerAngry(customer);
        }
        
        Audio.playAngryCustomer();
    }

    showCustomerDialog(customer, text) {
        customer.currentDialog = text;
        customer.dialogTimer = 120; // 2秒
    }

    // 设置生成速率
    setSpawnRate(rate) {
        this.spawnRate = Utils.clamp(rate, 0.01, 0.6);
    }

    // 设置最大顾客数
    setMaxCustomers(max) {
        this.maxCustomers = max;
    }

    // 获取当前顾客
    getCustomers() {
        return this.customers;
    }

    // 获取顾客数量
    getCustomerCount() {
        return this.customers.length;
    }

    // 清空顾客
    clear() {
        this.customers = [];
    }
}

// 全局顾客系统
const Customers = new CustomerSystem();

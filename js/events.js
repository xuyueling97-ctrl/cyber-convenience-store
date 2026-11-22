// 随机事件系统
class EventSystem {
    constructor() {
        this.activeEvents = [];
        this.eventHistory = [];
        this.checkInterval = 300; // 每5秒检查一次
        this.checkTimer = 0;
        
        // 回调
        this.onEventStart = null;
        this.onEventEnd = null;
    }

    update(deltaTime) {
        this.checkTimer++;
        
        // 检查是否触发新事件
        if (this.checkTimer >= this.checkInterval) {
            this.checkTimer = 0;
            this.tryTriggerEvent();
        }
        
        // 更新活跃事件
        for (let i = this.activeEvents.length - 1; i >= 0; i--) {
            const event = this.activeEvents[i];
            event.duration--;
            
            if (event.duration <= 0) {
                this.endEvent(event);
                this.activeEvents.splice(i, 1);
            }
        }
    }

    tryTriggerEvent() {
        // 如果已有活跃事件，降低新事件概率
        if (this.activeEvents.length > 0) return;
        
        const events = Object.values(GameData.events);
        
        for (const event of events) {
            if (Utils.chance(event.chance)) {
                this.triggerEvent(event);
                break;
            }
        }
    }

    triggerEvent(event) {
        const activeEvent = {
            ...event,
            duration: event.duration || 0,
            startTime: Time.gameTime,
            startDay: Time.day
        };
        
        // 应用效果
        this.applyEventEffect(activeEvent);
        
        // 记录历史
        this.eventHistory.push({
            id: event.id,
            name: event.name,
            type: event.type,
            day: Time.day,
            time: Time.gameTime
        });
        
        // 即时事件直接结束
        if (event.instant) {
            return;
        }
        
        this.activeEvents.push(activeEvent);
        
        if (this.onEventStart) {
            this.onEventStart(activeEvent);
        }
        
        Audio.playEvent();
    }

    applyEventEffect(event) {
        const effect = event.effect;
        
        // 即时效果
        if (effect.money) {
            Shop.addMoney(effect.money);
        }
        if (effect.reputation) {
            Shop.addReputation(effect.reputation);
        }
        if (effect.loseProduct) {
            this.stealRandomProduct();
        }
        
        // 持续效果通过getEffectModifier查询
    }

    endEvent(event) {
        if (this.onEventEnd) {
            this.onEventEnd(event);
        }
    }

    // 获取效果修正
    getEffectModifier(modifierName) {
        let total = modifierName === 'customerRate' ? 1 : 0;
        
        for (const event of this.activeEvents) {
            const effect = event.effect;
            
            if (effect[modifierName] !== undefined) {
                if (modifierName === 'customerRate') {
                    total *= effect[modifierName];
                } else {
                    total += effect[modifierName];
                }
            }
        }
        
        return total;
    }

    // 检查是否有特定效果
    hasEffect(effectName) {
        return this.activeEvents.some(e => e.effect[effectName]);
    }

    // 偷窃随机商品
    stealRandomProduct() {
        // 安保机器人升级可降低被偷概率
        const reduction = Shop.getUpgradeEffect('theftReduction');
        if (reduction > 0 && Utils.chance(reduction)) {
            return; // 成功阻止偷窃
        }
        
        const products = Shop.getAllProducts();
        const inStock = products.filter(p => p.stock > 0);
        
        if (inStock.length > 0) {
            const product = Utils.pick(inStock);
            Shop.inventory[product.id]--;
        }
    }

    // 获取活跃事件
    getActiveEvents() {
        return this.activeEvents;
    }

    // 获取事件历史
    getEventHistory() {
        return this.eventHistory;
    }

    // 恢复事件历史（读档时调用）
    loadEventHistory(history) {
        this.eventHistory = Array.isArray(history) ? history : [];
    }

    // 获取状态（供存档使用）
    getState() {
        return {
            activeEvents: this.activeEvents.map(e => ({
                id: e.id, duration: e.duration, startTime: e.startTime, startDay: e.startDay
            })),
            eventHistory: this.eventHistory
        };
    }

    // 加载状态（读档时恢复事件）
    loadState(state) {
        if (!state) return;
        
        // 恢复历史
        this.loadEventHistory(state.eventHistory);
        
        // 恢复进行中的事件（按剩余时长重建）
        this.activeEvents = [];
        if (Array.isArray(state.activeEvents)) {
            state.activeEvents.forEach(saved => {
                const def = GameData.events[saved.id];
                if (def && saved.duration > 0) {
                    this.activeEvents.push({
                        ...def,
                        duration: saved.duration,
                        startTime: saved.startTime,
                        startDay: saved.startDay
                    });
                }
            });
        }
    }

    // 手动触发事件（用于特殊事件）
    forceTriggerEvent(eventId) {
        const event = GameData.events[eventId];
        if (event) {
            this.triggerEvent(event);
            return true;
        }
        return false;
    }

    // 清空所有事件
    clear() {
        this.activeEvents = [];
    }
}

// 全局事件系统
const Events = new EventSystem();

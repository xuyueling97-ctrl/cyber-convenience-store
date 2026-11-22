// 升级系统
class UpgradeSystem {
    constructor() {
        this.purchased = [];
        this.achievements = [];
        
        // 统计
        this.stats = {
            totalSales: 0,
            money: 0,
            daysPlayed: 0,
            nightCustomers: 0,
            alienCustomers: 0,
            robotCustomers: 0,
            catEncounters: 0,
            eventsExperienced: 0,
            unlockedProducts: 4,
            achievementsUnlocked: 0
        };
    }

    // 获取可购买的升级
    getAvailableUpgrades() {
        return Object.values(GameData.upgrades).filter(upgrade => {
            // 已购买
            if (this.purchased.includes(upgrade.id)) return false;
            
            // 等级不够
            if (upgrade.unlockLevel > Shop.level) return false;
            
            // 前置条件
            if (upgrade.requires.length > 0) {
                return upgrade.requires.every(req => this.purchased.includes(req));
            }
            
            return true;
        });
    }

    // 购买升级
    purchaseUpgrade(upgradeId) {
        const upgrade = GameData.upgrades[upgradeId];
        if (!upgrade) return { success: false, message: '升级不存在' };
        
        if (this.purchased.includes(upgradeId)) {
            return { success: false, message: '已购买' };
        }
        
        if (Shop.money < upgrade.cost) {
            return { success: false, message: '资金不足' };
        }
        
        if (upgrade.unlockLevel > Shop.level) {
            return { success: false, message: `需要店铺等级 ${upgrade.unlockLevel}` };
        }
        
        // 检查前置条件
        if (upgrade.requires.length > 0) {
            const missing = upgrade.requires.filter(req => !this.purchased.includes(req));
            if (missing.length > 0) {
                return { success: false, message: '需要先购买前置升级' };
            }
        }
        
        // 购买
        Shop.money -= upgrade.cost;
        this.purchased.push(upgradeId);
        
        // 应用效果
        Shop.applyUpgradeEffect(upgrade.effect);
        
        return { success: true, message: `升级成功：${upgrade.name}` };
    }

    // 检查是否已购买
    isPurchased(upgradeId) {
        return this.purchased.includes(upgradeId);
    }

    // 检查成就
    checkAchievements() {
        const newAchievements = [];
        
        Object.values(GameData.achievements).forEach(achievement => {
            if (!this.achievements.includes(achievement.id)) {
                if (achievement.condition(this.stats)) {
                    this.achievements.push(achievement.id);
                    newAchievements.push(achievement);
                    this.stats.achievementsUnlocked = this.achievements.length;
                }
            }
        });
        
        return newAchievements;
    }

    // 获取成就状态
    getAchievementStatus() {
        return Object.values(GameData.achievements).map(a => ({
            ...a,
            unlocked: this.achievements.includes(a.id)
        }));
    }

    // 更新统计
    updateStats(updates) {
        Object.assign(this.stats, updates);
    }

    // 增加统计
    addStat(key, value = 1) {
        if (this.stats[key] !== undefined) {
            this.stats[key] += value;
        }
    }

    // 检查结局
    checkEnding() {
        for (const [id, ending] of Object.entries(GameData.endings)) {
            if (ending.condition(this.stats)) {
                return ending;
            }
        }
        return null;
    }

    // 获取状态
    getState() {
        return {
            purchased: [...this.purchased],
            achievements: [...this.achievements],
            stats: { ...this.stats }
        };
    }

    // 加载状态
    loadState(state) {
        this.purchased = state.purchased || [];
        this.achievements = state.achievements || [];
        this.stats = state.stats || this.stats;
    }
}

// 全局升级系统
const Upgrades = new UpgradeSystem();

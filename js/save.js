// 存档系统
class SaveManager {
    constructor() {
        this.storageKey = 'cyber-store-save';
        this.version = 1;
        this.autoSaveInterval = 30000; // 30秒自动存档
        this.autoSaveTimer = null;
    }

    // 检查是否有存档
    hasSave() {
        try {
            return localStorage.getItem(this.storageKey) !== null;
        } catch (e) {
            return false;
        }
    }

    // 保存游戏
    save() {
        try {
            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                shop: Shop.getState(),
                time: Time.getState(),
                upgrades: Upgrades.getState(),
                events: Events.getEventHistory()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    }

    // 加载游戏
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return false;

            const saveData = JSON.parse(data);

            // 版本检查
            if (saveData.version !== this.version) {
                console.warn('存档版本不匹配，可能无法正确加载');
            }

            // 恢复各系统状态
            if (saveData.shop) Shop.loadState(saveData.shop);
            if (saveData.time) Time.loadState(saveData.time);
            if (saveData.upgrades) Upgrades.loadState(saveData.upgrades);

            return true;
        } catch (e) {
            console.error('加载失败:', e);
            return false;
        }
    }

    // 删除存档
    deleteSave() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 获取存档信息
    getSaveInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const saveData = JSON.parse(data);
            return {
                timestamp: saveData.timestamp,
                day: saveData.time?.day || 1,
                money: saveData.shop?.money || 0,
                timeString: new Date(saveData.timestamp).toLocaleString('zh-CN')
            };
        } catch (e) {
            return null;
        }
    }

    // 启动自动存档
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            this.save();
        }, this.autoSaveInterval);
    }

    // 停止自动存档
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // 导出存档（用于分享或备份）
    exportSave() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return null;
        return btoa(data); // Base64 编码
    }

    // 导入存档
    importSave(encodedData) {
        try {
            const data = atob(encodedData);
            JSON.parse(data); // 验证格式
            localStorage.setItem(this.storageKey, data);
            return true;
        } catch (e) {
            console.error('导入失败:', e);
            return false;
        }
    }
}

// 全局存档系统
const SaveSystem = new SaveManager();

// UI系统
class UISystem {
    constructor() {
        this.modal = document.getElementById('modal-container');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.notification = document.getElementById('notification');
        this.dialogBubble = document.getElementById('dialog-bubble');
        this.dialogText = document.getElementById('dialog-text');
        
        this.notificationTimer = null;
    }

    init() {
        // 关闭按钮
        document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    // 显示弹窗
    showModal(title, content) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = content;
        this.modal.classList.remove('hidden');
        Audio.playClick();
    }

    // 隐藏弹窗
    hideModal() {
        this.modal.classList.add('hidden');
        Audio.playClick();
    }

    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        
        this.notification.textContent = message;
        this.notification.className = 'notification ' + type;
        
        this.notificationTimer = setTimeout(() => {
            this.notification.classList.add('hidden');
        }, duration);
        
        Audio.playNotification();
    }

    // 更新头部显示
    updateHeader() {
        document.getElementById('day-display').textContent = `第${Time.day}天`;
        document.getElementById('time-display').textContent = Time.getTimeString();
        
        const period = Time.getPeriodInfo();
        document.getElementById('period-display').textContent = `${period.icon} ${period.name}`;
        
        document.getElementById('money-display').textContent = Utils.formatMoney(Shop.money);
        document.getElementById('reputation-display').textContent = `⭐ ${Shop.reputation}`;
    }

    // 显示库存面板
    showInventoryPanel() {
        const products = Shop.getAllProducts();
        const capacity = Shop.getShelfCapacity();
        const shelvedCount = Shop.shelved.length;
        
        let content = `<p style="margin: 0 0 12px; color: #88ffff; font-size: 0.9em;">
            🧺 货架位：${shelvedCount}/${capacity}　（只有已上架的商品顾客才会购买，升级「扩展货架」可增加货位）
        </p>`;
        content += '<div class="item-list">';
        
        products.forEach(product => {
            const profit = product.price - product.baseCost;
            const profitColor = profit > 0 ? '#00ff00' : '#ff0000';
            const shelfBtnLabel = product.shelved ? '下架' : '上架';
            const shelfBtnColor = product.shelved ? '#ffaa00' : '#00ff00';
            
            content += `
                <div class="item-card${product.shelved ? '' : ' unshelved'}">
                    <div class="item-info">
                        <div class="item-icon">${product.icon}</div>
                        <div>
                            <div class="item-name">${product.name}
                                ${product.shelved ? '<span class="shelf-tag">货架中</span>' : '<span class="shelf-tag off">未上架</span>'}
                            </div>
                            <div class="item-desc">库存: ${product.stock} | 成本: ¥${product.baseCost} | 利润: <span style="color:${profitColor}">¥${profit}</span></div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <input type="number" class="price-input" id="price-${product.id}" 
                            value="${product.price}" min="${product.baseCost}" max="${product.basePrice * 5}">
                        <button class="item-btn" onclick="UI.setPrice('${product.id}')">定价</button>
                        <button class="item-btn" onclick="UI.buyProduct('${product.id}', 5)">+5</button>
                        <button class="item-btn" onclick="UI.buyProduct('${product.id}', 10)">+10</button>
                        <button class="item-btn" style="color:${shelfBtnColor}" 
                            onclick="UI.toggleShelf('${product.id}')">${shelfBtnLabel}</button>
                    </div>
                </div>
            `;
        });
        
        content += '</div>';
        content += `<p style="margin-top: 15px; color: #888; font-size: 0.9em;">
            💡 提示：合理定价，太高会吓跑顾客，太低会减少利润
        </p>`;
        
        this.showModal('📦 库存管理', content);
    }

    // 上架 / 下架切换
    toggleShelf(productId) {
        const on = !Shop.isShelved(productId);
        const result = Shop.setShelved(productId, on);
        
        if (result.success) {
            this.showNotification(on ? '已上架' : '已下架', 'success');
            this.showInventoryPanel(); // 刷新面板
        } else {
            this.showNotification(result.message, 'error');
            Audio.playError();
        }
    }

    // 设置价格
    setPrice(productId) {
        const input = document.getElementById(`price-${productId}`);
        const price = parseInt(input.value);
        
        if (Shop.setPrice(productId, price)) {
            this.showNotification('价格已更新', 'success');
        } else {
            this.showNotification('价格设置失败', 'error');
        }
    }

    // 购买商品
    buyProduct(productId, quantity) {
        const result = Shop.purchaseProduct(productId, quantity);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.showInventoryPanel(); // 刷新面板
            this.updateHeader();
        } else {
            this.showNotification(result.message, 'error');
            Audio.playError();
        }
    }

    // 显示升级面板
    showUpgradePanel() {
        const available = Upgrades.getAvailableUpgrades();
        const purchased = Upgrades.purchased.map(id => GameData.upgrades[id]);
        
        let content = '<div class="item-list">';
        
        if (available.length === 0 && purchased.length === 0) {
            content += '<p style="text-align: center; color: #888;">暂无可用升级</p>';
        }
        
        // 可购买的升级
        available.forEach(upgrade => {
            const canAfford = Shop.money >= upgrade.cost;
            
            content += `
                <div class="item-card">
                    <div class="item-info">
                        <div class="item-icon">${upgrade.icon}</div>
                        <div>
                            <div class="item-name">${upgrade.name}</div>
                            <div class="item-desc">${upgrade.desc}</div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <span style="color: #ffdd00;">¥${upgrade.cost}</span>
                        <button class="item-btn" onclick="UI.buyUpgrade('${upgrade.id}')" 
                            ${canAfford ? '' : 'disabled'}>购买</button>
                    </div>
                </div>
            `;
        });
        
        // 已购买的升级
        if (purchased.length > 0) {
            content += '<h4 style="margin-top: 20px; color: #00ffff;">已拥有</h4>';
            purchased.forEach(upgrade => {
                content += `
                    <div class="item-card" style="opacity: 0.6;">
                        <div class="item-info">
                            <div class="item-icon">${upgrade.icon}</div>
                            <div>
                                <div class="item-name">${upgrade.name}</div>
                                <div class="item-desc">${upgrade.desc}</div>
                            </div>
                        </div>
                        <div class="item-actions">
                            <span style="color: #00ff00;">✓ 已购买</span>
                        </div>
                    </div>
                `;
            });
        }
        
        content += '</div>';
        
        this.showModal('⬆️ 店铺升级', content);
    }

    // 购买升级
    buyUpgrade(upgradeId) {
        const result = Upgrades.purchaseUpgrade(upgradeId);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            Audio.playUpgrade();
            this.showUpgradePanel(); // 刷新面板
            this.updateHeader();
        } else {
            this.showNotification(result.message, 'error');
            Audio.playError();
        }
    }

    // 显示统计面板
    showStatsPanel() {
        const stats = Upgrades.stats;
        const achievements = Upgrades.getAchievementStatus();
        
        let content = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalSales}</div>
                    <div class="stat-label">总交易次数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.formatMoney(stats.money || Shop.money)}</div>
                    <div class="stat-label">当前资金</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.daysPlayed || Time.day}</div>
                    <div class="stat-label">营业天数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Shop.level}</div>
                    <div class="stat-label">店铺等级</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.nightCustomers || 0}</div>
                    <div class="stat-label">夜间顾客</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.alienCustomers || 0}</div>
                    <div class="stat-label">外星顾客</div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px; color: #00ffff;">🏆 成就 (${achievements.filter(a => a.unlocked).length}/${achievements.length})</h4>
            <div class="item-list" style="margin-top: 10px;">
        `;
        
        achievements.forEach(achievement => {
            content += `
                <div class="item-card" style="opacity: ${achievement.unlocked ? 1 : 0.5};">
                    <div class="item-info">
                        <div class="item-icon">${achievement.icon}</div>
                        <div>
                            <div class="item-name">${achievement.name}</div>
                            <div class="item-desc">${achievement.desc}</div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <span style="color: ${achievement.unlocked ? '#00ff00' : '#666'};">
                            ${achievement.unlocked ? '✓' : '🔒'}
                        </span>
                    </div>
                </div>
            `;
        });
        
        content += '</div>';
        
        this.showModal('📊 经营统计', content);
    }

    // 显示事件通知
    showEventNotification(event) {
        const typeClass = event.type === 'positive' ? 'success' : 
                         event.type === 'negative' ? 'error' : 'event';
        
        this.showNotification(`${event.icon} ${event.name}: ${event.desc}`, typeClass, 5000);
    }

    // 显示成就通知
    showAchievementNotification(achievement) {
        this.showNotification(`🏆 成就解锁: ${achievement.name}!`, 'success', 5000);
        Audio.playAchievement();
    }

    // 显示结局
    showEnding(ending) {
        document.getElementById('ending-title').textContent = ending.name;
        document.getElementById('ending-text').textContent = ending.desc;
        
        const statsHtml = `
            <p>营业天数: ${Time.day}</p>
            <p>总资金: ${Utils.formatMoney(Shop.money)}</p>
            <p>声誉: ${Shop.reputation}</p>
            <p>总交易: ${Upgrades.stats.totalSales}</p>
        `;
        document.getElementById('ending-stats').innerHTML = statsHtml;
        
        this.showScreen('ending-screen');
    }

    // 切换屏幕
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    // 更新按钮状态
    updateButtons() {
        const continueBtn = document.getElementById('btn-continue');
        continueBtn.disabled = !SaveSystem.hasSave();
    }
}

// 全局UI系统
const UI = new UISystem();

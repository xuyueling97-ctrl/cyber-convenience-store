// 渲染系统
class RendererSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 400;
        this.frame = 0;
        this.particles = [];
        
        // 场景元素位置
        this.scene = {
            floor: { x: 0, y: 150, width: 800, height: 250 },
            wall: { x: 0, y: 0, width: 800, height: 150 },
            door: { x: 20, y: 180, width: 60, height: 100 },
            shelves: [
                { x: 150, y: 160, width: 120, height: 100 },
                { x: 320, y: 160, width: 120, height: 100 },
                { x: 490, y: 160, width: 120, height: 100 }
            ],
            register: { x: 650, y: 220, width: 100, height: 60 },
            sign: { x: 400, y: 30 }
        };
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 禁用图像平滑（保持像素风格）
        this.ctx.imageSmoothingEnabled = false;
    }

    resize() {
        const container = this.canvas.parentElement;
        const aspectRatio = 2; // 2:1 宽高比
        
        // 可用高度需扣除顶部 HUD 与底部按钮栏，避免画布溢出
        const header = document.getElementById('game-header');
        const controls = document.getElementById('game-controls');
        const rotateHint = document.getElementById('rotate-hint');
        const chromeHeight = (header ? header.offsetHeight : 0) +
                             (controls ? controls.offsetHeight : 0) +
                             (rotateHint ? rotateHint.offsetHeight : 0);
        
        const availWidth = container.clientWidth;
        const availHeight = Math.max(0, container.clientHeight - chromeHeight);
        
        let width = availWidth;
        let height = width / aspectRatio;
        
        // 高度受限时按高度反推宽度，保证画布完整可见
        if (height > availHeight) {
            height = availHeight;
            width = height * aspectRatio;
        }
        
        // 防止隐藏状态下算出 0/负值
        if (!(width > 0) || !(height > 0)) {
            width = 800;
            height = 400;
        }
        
        this.canvas.width = 800; // 固定内部分辨率
        this.canvas.height = 400;
        this.canvas.style.width = Math.floor(width) + 'px';
        this.canvas.style.height = Math.floor(height) + 'px';
        
        this.width = 800;
        this.height = 400;
    }

    render() {
        this.frame++;
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const isNight = Time.isNight();
        
        // 绘制场景
        this.drawBackground(isNight);
        this.drawWall(isNight);
        this.drawFloor(isNight);
        this.drawDoor();
        this.drawShelves();
        this.drawCashRegister();
        this.drawSign();
        
        // 绘制顾客
        this.drawCustomers();
        
        // 绘制粒子
        this.drawParticles();
        
        // 绘制夜间效果
        if (isNight) {
            this.drawNightOverlay();
        }
        
        // 绘制事件效果
        this.drawEventEffects();
        
        // 更新粒子
        this.updateParticles();
    }

    drawBackground(isNight) {
        // 天空/背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 150);
        if (isNight) {
            gradient.addColorStop(0, '#0a0a1a');
            gradient.addColorStop(1, '#1a1a2e');
        } else {
            gradient.addColorStop(0, '#2a3a5e');
            gradient.addColorStop(1, '#4a5a8e');
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, 150);
        
        // 远处建筑剪影
        this.ctx.fillStyle = isNight ? '#0f0f1a' : '#2a2a4e';
        for (let i = 0; i < 10; i++) {
            const bx = i * 80;
            const bh = 50 + Math.sin(i * 1.5) * 30;
            this.ctx.fillRect(bx, 100 - bh, 70, bh + 50);
            
            // 窗户（夜间使用确定性图案，避免闪烁）
            if (isNight) {
                // 简单哈希函数用于稳定随机
                const hash = (a, b) => (((a * 31 + b) * 17 + i) & 0x7FFFFFFF) / 0x7FFFFFFF;
                this.ctx.fillStyle = '#ffff0033';
                for (let wy = 0; wy < bh; wy += 15) {
                    for (let wx = 10; wx < 60; wx += 20) {
                        if (hash(wx, wy) < 0.4) {
                            this.ctx.fillRect(bx + wx, 100 - bh + wy + 5, 8, 8);
                        }
                    }
                }
                this.ctx.fillStyle = '#0f0f1a';
            }
        }
    }

    drawWall(isNight) {
        Sprites.drawWall(this.ctx, 0, 80, this.width, 70, isNight);
        
        // 墙上装饰
        // 海报
        this.ctx.fillStyle = '#ff00ff44';
        this.ctx.fillRect(100, 90, 40, 50);
        this.ctx.fillStyle = '#00ffff44';
        this.ctx.fillRect(600, 90, 40, 50);
        
        // 时钟
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(400, 100, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(400, 100, 17, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 时钟指针
        const time = Time.gameTime;
        const hourAngle = ((time / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2;
        const minAngle = (time % 60) / 60 * Math.PI * 2 - Math.PI / 2;
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(400, 100);
        this.ctx.lineTo(400 + Math.cos(hourAngle) * 10, 100 + Math.sin(hourAngle) * 10);
        this.ctx.stroke();
        
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(400, 100);
        this.ctx.lineTo(400 + Math.cos(minAngle) * 14, 100 + Math.sin(minAngle) * 14);
        this.ctx.stroke();
    }

    drawFloor(isNight) {
        Sprites.drawFloor(this.ctx, 0, 150, this.width, 250, isNight);
    }

    drawDoor() {
        const isOpen = Customers.getCustomerCount() > 0;
        Sprites.drawDoor(this.ctx, this.scene.door.x, this.scene.door.y, 
            this.scene.door.width, this.scene.door.height, isOpen);
    }

    drawShelves() {
        const products = Shop.getAllProducts();
        
        this.scene.shelves.forEach((shelf, index) => {
            // 分配商品到货架
            const shelfProducts = products.slice(index * 4, (index + 1) * 4);
            Sprites.drawShelf(this.ctx, shelf.x, shelf.y, shelf.width, shelf.height, 
                shelfProducts, Shop.level);
        });
    }

    drawCashRegister() {
        const reg = this.scene.register;
        Sprites.drawCashRegister(this.ctx, reg.x, reg.y, reg.width, reg.height);
    }

    drawSign() {
        const signText = '赛博便利店';
        Sprites.drawNeonText(this.ctx, this.scene.sign.x, this.scene.sign.y, signText);
        
        // 闪烁效果
        if (this.frame % 60 < 5) {
            this.ctx.globalAlpha = 0.5;
            Sprites.drawNeonText(this.ctx, this.scene.sign.x, this.scene.sign.y, signText, '#ff00ff');
            this.ctx.globalAlpha = 1;
        }
    }

    drawCustomers() {
        const customers = Customers.getCustomers();
        
        customers.forEach(customer => {
            Sprites.drawCustomer(this.ctx, customer.x, customer.y, customer, this.frame);
            
            // 绘制对话
            if (customer.currentDialog && customer.dialogTimer > 0) {
                Sprites.drawDialogBubble(this.ctx, customer.x + 16, customer.y, customer.currentDialog);
            }
            
            // 绘制耐心条
            if (customer.state !== 'leaving' && customer.state !== 'entering') {
                const patienceRatio = customer.patience / customer.maxPatience;
                const barColor = patienceRatio > 0.5 ? '#00ff00' : patienceRatio > 0.25 ? '#ffaa00' : '#ff0000';
                Sprites.drawProgressBar(this.ctx, customer.x, customer.y - 10, 32, 4, patienceRatio, barColor);
            }
        });
    }

    drawNightOverlay() {
        // 夜间暗色覆盖
        this.ctx.fillStyle = 'rgba(0, 0, 30, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 店内灯光
        const gradient = this.ctx.createRadialGradient(400, 200, 50, 400, 200, 350);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawEventEffects() {
        const activeEvents = Events.getActiveEvents();
        
        activeEvents.forEach(event => {
            switch (event.id) {
                case 'powerOutage':
                    // 停电效果 - 闪烁
                    if (this.frame % 30 < 5) {
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        this.ctx.fillRect(0, 0, this.width, this.height);
                    }
                    break;
                case 'luckyDay':
                    // 幸运日 - 金色光效
                    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
                    this.ctx.fillRect(0, 0, this.width, this.height);
                    break;
                case 'alienTrade':
                    // 外星交易 - 绿色光柱
                    this.ctx.fillStyle = 'rgba(0, 255, 100, 0.1)';
                    this.ctx.fillRect(100, 0, 100, this.height);
                    break;
            }
        });
    }

    // 粒子系统
    addParticle(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-2, 2),
                vy: Utils.random(-3, -1),
                size: Utils.random(2, 4),
                color: color,
                life: 1
            });
        }
    }

    addMoneyParticle(x, y) {
        this.addParticle(x, y, '#ffdd00', 8);
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // 重力
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        Sprites.drawParticles(this.ctx, this.particles);
    }

    // 获取画布坐标（用于点击检测）
    getCanvasCoords(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    // 检测点击的货架
    getClickedShelf(x, y) {
        for (let i = 0; i < this.scene.shelves.length; i++) {
            const shelf = this.scene.shelves[i];
            if (x >= shelf.x && x <= shelf.x + shelf.width &&
                y >= shelf.y && y <= shelf.y + shelf.height) {
                return i;
            }
        }
        return -1;
    }

    // 检测点击的顾客
    getClickedCustomer(x, y) {
        const customers = Customers.getCustomers();
        for (const customer of customers) {
            if (x >= customer.x && x <= customer.x + 32 &&
                y >= customer.y && y <= customer.y + 44) {
                return customer;
            }
        }
        return null;
    }
}

// 全局渲染器
const Renderer = new RendererSystem();

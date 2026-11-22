// 精灵绘制系统 - 像素风格图形
class SpriteSystem {
    constructor() {
        this.cache = new Map();
        this.tileSize = 16;
    }

    // 绘制像素矩形
    drawPixelRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    }

    // 绘制便利店地板
    drawFloor(ctx, x, y, width, height, isNight) {
        const tileSize = 32;
        const color1 = isNight ? '#1a1a2e' : '#2a2a4e';
        const color2 = isNight ? '#151525' : '#252545';
        
        for (let tx = 0; tx < width; tx += tileSize) {
            for (let ty = 0; ty < height; ty += tileSize) {
                const isAlt = (Math.floor(tx / tileSize) + Math.floor(ty / tileSize)) % 2 === 0;
                this.drawPixelRect(ctx, x + tx, y + ty, tileSize, tileSize, isAlt ? color1 : color2);
            }
        }
    }

    // 绘制墙壁
    drawWall(ctx, x, y, width, height, isNight) {
        const color = isNight ? '#0f0f1a' : '#1a1a3e';
        this.drawPixelRect(ctx, x, y, width, height, color);
        
        // 墙壁装饰线
        ctx.strokeStyle = isNight ? '#00ffff22' : '#00ffff44';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // 霓虹装饰
        if (width > 100) {
            ctx.fillStyle = '#ff00ff33';
            ctx.fillRect(x + 10, y + height - 20, width - 20, 4);
        }
    }

    // 绘制货架
    drawShelf(ctx, x, y, width, height, products = [], level = 1) {
        // 货架主体
        const shelfColor = '#3a2a1a';
        const shelfHighlight = '#5a4a3a';
        
        // 侧板
        this.drawPixelRect(ctx, x, y, 8, height, shelfColor);
        this.drawPixelRect(ctx, x + width - 8, y, 8, height, shelfColor);
        
        // 层板
        const shelfCount = Math.min(3 + level, 5);
        const shelfHeight = height / shelfCount;
        
        for (let i = 0; i < shelfCount; i++) {
            const sy = y + i * shelfHeight;
            this.drawPixelRect(ctx, x, sy, width, 6, shelfHighlight);
            this.drawPixelRect(ctx, x, sy + 6, width, 2, '#2a1a0a');
        }
        
        // 绘制商品
        if (products.length > 0) {
            const productWidth = Math.min(24, (width - 20) / products.length);
            products.forEach((product, i) => {
                if (i >= 8) return; // 最多显示8个
                const px = x + 10 + i * productWidth;
                const py = y + shelfHeight - 20;
                this.drawProduct(ctx, px, py, product);
            });
        }
    }

    // 绘制商品
    drawProduct(ctx, x, y, product) {
        if (!product || !product.icon) return;
        
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(product.icon, x + 10, y + 10);
    }

    // 绘制收银台
    drawCashRegister(ctx, x, y, width, height) {
        // 柜台
        this.drawPixelRect(ctx, x, y, width, height, '#4a3a2a');
        this.drawPixelRect(ctx, x, y, width, 8, '#6a5a4a');
        
        // 收银机
        const rx = x + width / 2 - 20;
        const ry = y - 30;
        this.drawPixelRect(ctx, rx, ry, 40, 30, '#2a2a3e');
        this.drawPixelRect(ctx, rx + 5, ry + 5, 30, 15, '#00ffff33');
        
        // 屏幕光效
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(rx + 10, ry + 8, 20, 2);
        ctx.fillRect(rx + 10, ry + 12, 15, 2);
    }

    // 绘制门
    drawDoor(ctx, x, y, width, height, isOpen = false) {
        // 门框
        this.drawPixelRect(ctx, x, y, width, height, '#2a2a3e');
        
        if (isOpen) {
            // 打开的门
            this.drawPixelRect(ctx, x + 5, y + 5, width - 10, height - 5, '#0a0a1a');
            // 门外光效
            ctx.fillStyle = '#ffff0022';
            ctx.fillRect(x + 5, y + height - 20, width - 10, 15);
        } else {
            // 关闭的门
            this.drawPixelRect(ctx, x + 5, y + 5, width - 10, height - 10, '#1a1a2e');
            // 门把手
            this.drawPixelRect(ctx, x + width - 20, y + height / 2, 8, 8, '#ffaa00');
        }
        
        // 门上方标识
        ctx.fillStyle = '#00ffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OPEN', x + width / 2, y + 15);
    }

    // 绘制顾客
    drawCustomer(ctx, x, y, customer, frame = 0) {
        const type = customer.type;
        const bobOffset = Math.sin(frame * 0.1) * 2;
        const drawY = y + bobOffset;
        
        ctx.save();
        
        switch (type.id) {
            case 'human':
                this.drawHumanCustomer(ctx, x, drawY, customer);
                break;
            case 'worker':
                this.drawWorkerCustomer(ctx, x, drawY, customer);
                break;
            case 'robot':
                this.drawRobotCustomer(ctx, x, drawY, customer, frame);
                break;
            case 'alien':
                this.drawAlienCustomer(ctx, x, drawY, customer, frame);
                break;
            case 'hacker':
                this.drawHackerCustomer(ctx, x, drawY, customer);
                break;
            case 'cat':
                this.drawCatCustomer(ctx, x, drawY, customer, frame);
                break;
        }
        
        ctx.restore();
        
        // 绘制状态指示
        const showAngry = customer.state === 'angry' || (customer.state === 'waiting' && customer.emotion === 'angry');
        const showHappy = customer.state === 'happy' || (customer.state === 'waiting' && customer.emotion === 'happy');
        
        if (showAngry) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px sans-serif';
            ctx.fillText('💢', x + 10, drawY - 20);
        } else if (showHappy) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px sans-serif';
            ctx.fillText('✨', x + 10, drawY - 20);
        }
    }

    drawHumanCustomer(ctx, x, y, customer) {
        // 身体
        ctx.fillStyle = customer.color || '#4488ff';
        ctx.fillRect(x + 8, y + 16, 16, 20);
        
        // 头
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(x + 10, y + 4, 12, 12);
        
        // 头发
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + 2, 12, 6);
        
        // 腿
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + 36, 5, 8);
        ctx.fillRect(x + 17, y + 36, 5, 8);
    }

    drawWorkerCustomer(ctx, x, y, customer) {
        // 西装身体
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(x + 8, y + 16, 16, 20);
        
        // 领带
        ctx.fillStyle = '#ff0066';
        ctx.fillRect(x + 14, y + 18, 4, 12);
        
        // 头
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(x + 10, y + 4, 12, 12);
        
        // 头发
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 10, y + 2, 12, 5);
        
        // 公文包
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x + 24, y + 28, 8, 10);
        
        // 腿
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 10, y + 36, 5, 8);
        ctx.fillRect(x + 17, y + 36, 5, 8);
    }

    drawRobotCustomer(ctx, x, y, customer, frame) {
        // 身体
        ctx.fillStyle = '#888';
        ctx.fillRect(x + 6, y + 14, 20, 22);
        
        // 胸部灯光
        const lightColor = frame % 20 < 10 ? '#00ffff' : '#ff00ff';
        ctx.fillStyle = lightColor;
        ctx.fillRect(x + 12, y + 20, 8, 4);
        
        // 头
        ctx.fillStyle = '#aaa';
        ctx.fillRect(x + 8, y + 2, 16, 12);
        
        // 眼睛
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 11, y + 6, 4, 4);
        ctx.fillRect(x + 17, y + 6, 4, 4);
        
        // 天线
        ctx.fillStyle = '#666';
        ctx.fillRect(x + 15, y - 4, 2, 6);
        ctx.fillStyle = lightColor;
        ctx.fillRect(x + 14, y - 6, 4, 4);
        
        // 手臂
        ctx.fillStyle = '#666';
        ctx.fillRect(x + 2, y + 16, 4, 14);
        ctx.fillRect(x + 26, y + 16, 4, 14);
        
        // 腿
        ctx.fillStyle = '#555';
        ctx.fillRect(x + 10, y + 36, 5, 8);
        ctx.fillRect(x + 17, y + 36, 5, 8);
    }

    drawAlienCustomer(ctx, x, y, customer, frame) {
        // 身体
        ctx.fillStyle = '#44cc88';
        ctx.fillRect(x + 8, y + 16, 16, 18);
        
        // 头（更大）
        ctx.fillStyle = '#66eebb';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 10, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 大眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x + 12, y + 10, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 10, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛高光
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 11, y + 8, 2, 2);
        ctx.fillRect(x + 19, y + 8, 2, 2);
        
        // 触角
        const waveOffset = Math.sin(frame * 0.15) * 3;
        ctx.fillStyle = '#44cc88';
        ctx.fillRect(x + 10 + waveOffset, y - 4, 2, 8);
        ctx.fillRect(x + 20 - waveOffset, y - 4, 2, 8);
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(x + 9 + waveOffset, y - 6, 4, 4);
        ctx.fillRect(x + 19 - waveOffset, y - 6, 4, 4);
        
        // 腿
        ctx.fillStyle = '#339966';
        ctx.fillRect(x + 10, y + 34, 4, 10);
        ctx.fillRect(x + 18, y + 34, 4, 10);
    }

    drawHackerCustomer(ctx, x, y, customer) {
        // 身体（连帽衫）
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 6, y + 14, 20, 22);
        
        // 帽子
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(x + 6, y + 2, 20, 14);
        ctx.fillRect(x + 4, y + 12, 24, 4);
        
        // 脸（阴影中）
        ctx.fillStyle = '#888';
        ctx.fillRect(x + 10, y + 8, 12, 8);
        
        // 发光眼镜
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 11, y + 10, 4, 2);
        ctx.fillRect(x + 17, y + 10, 4, 2);
        
        // 腿
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 10, y + 36, 5, 8);
        ctx.fillRect(x + 17, y + 36, 5, 8);
    }

    drawCatCustomer(ctx, x, y, customer, frame) {
        const tailWave = Math.sin(frame * 0.2) * 5;
        
        // 身体
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(x + 8, y + 24, 16, 12);
        
        // 头
        ctx.fillRect(x + 6, y + 16, 14, 12);
        
        // 耳朵
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 16);
        ctx.lineTo(x + 8, y + 10);
        ctx.lineTo(x + 12, y + 16);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 16);
        ctx.lineTo(x + 16, y + 10);
        ctx.lineTo(x + 20, y + 16);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 9, y + 20, 3, 3);
        ctx.fillRect(x + 15, y + 20, 3, 3);
        
        // 尾巴
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.moveTo(x + 24, y + 28);
        ctx.quadraticCurveTo(x + 30 + tailWave, y + 20, x + 28 + tailWave, y + 14);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ff8844';
        ctx.stroke();
        
        // 腿
        ctx.fillRect(x + 10, y + 36, 3, 6);
        ctx.fillRect(x + 19, y + 36, 3, 6);
    }

    // 辅助：绘制圆角矩形（兼容不支持 roundRect 的浏览器）
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // 绘制对话气泡
    drawDialogBubble(ctx, x, y, text) {
        const padding = 8;
        ctx.font = '12px sans-serif';
        const metrics = ctx.measureText(text);
        const width = metrics.width + padding * 2;
        const height = 24;
        
        // 气泡背景
        ctx.fillStyle = '#fff';
        this._roundRect(ctx, x - width / 2, y - height - 10, width, height, 8);
        ctx.fill();
        
        // 气泡尖角
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 10);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 5, y - 10);
        ctx.fill();
        
        // 文字
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y - height / 2 - 10);
    }

    // 绘制霓虹效果
    drawNeonText(ctx, x, y, text, color = '#00ffff') {
        ctx.save();
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        
        // 光晕
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        
        // 核心
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }

    // 绘制进度条
    drawProgressBar(ctx, x, y, width, height, progress, color = '#00ffff') {
        // 背景
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(x, y, width, height);
        
        // 进度
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * progress, height);
        
        // 边框
        ctx.strokeStyle = '#00ffff44';
        ctx.strokeRect(x, y, width, height);
    }

    // 绘制粒子效果
    drawParticles(ctx, particles) {
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }
}

// 全局精灵系统
const Sprites = new SpriteSystem();

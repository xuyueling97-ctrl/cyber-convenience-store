# 《赛博便利店：24小时营业》代码审计报告

审计日期：2026-11-22
审计范围：项目根目录（`《赛博便利店：24小时营业》`）
审计方式：静态代码检查 + Node 语法校验 + 跨文件符号交叉校验（**未修改任何游戏代码**）

---

## 一、结论摘要

| 项目 | 结果 |
|------|------|
| 项目结构 | 完整，无缺失文件 |
| 语法正确性 | **2 个文件存在致命语法错误** |
| 当前能否启动 | **不能启动（阻断）** |
| 核心玩法代码 | 逻辑完整，但被上述错误阻断 |
| 修复成本 | **仅需修改 2 行** |
| 是否值得继续 | **值得，修完即可交付，无需再扩展** |

> **关键判断：游戏目前 100% 无法启动，但原因只有一个模式（变量名与类名同名），共 2 处。修掉这 2 行后，代码层面具备完整可玩性。**

---

## 二、项目结构

```
index.html          入口（124 行，33 个 DOM id）
css/style.css       样式（461 行）
js/data.js          商品/顾客/事件/成就/结局数据（576 行）
js/audio.js         Web Audio 音效合成
js/sprites.js       像素精灵绘制
js/time.js          时间与昼夜循环
js/customer.js      顾客 AI 状态机
js/shop.js          商店/库存/定价
js/events.js        随机事件
js/upgrades.js      升级/成就/结局判定
js/renderer.js      Canvas 渲染
js/ui.js            弹窗与面板 UI
js/save.js          localStorage 存档
js/game.js          主循环与事件绑定
```

- 无重复文件，无废弃副本，无 `TODO/FIXME` 遗留标记。
- `.codely-cli/auto-saves/*.json`（1 MB）为 CLI 对话自动存档，**不是游戏代码**，可忽略。
- 脚本加载顺序正确（data → 各系统 → renderer/ui/save → game），依赖关系成立。

---

## 三、致命问题（必须修复，否则游戏无法启动）

### 🔴 P0-1 `js/renderer.js` 第 340 行 — 标识符重复声明

```js
// 第 2 行
class Renderer { ... }
// 第 340 行
const Renderer = new Renderer();   // ← SyntaxError
```

**验证证据**（`node --check`）：
```
SyntaxError: Identifier 'Renderer' has already been declared
    at renderer.js:340
```

**影响链**：`renderer.js` 整个文件解析失败 → 全局 `Renderer` 不存在 → `Game.init()` 中 `Renderer.init('game-canvas')` 抛 `ReferenceError` → **页面加载即崩溃，主菜单按钮全部无响应**。

### 🔴 P0-2 `js/save.js` 第 130 行 — 标识符重复声明

```js
// 第 2 行
class SaveSystem { ... }
// 第 130 行
const SaveSystem = new SaveSystem();   // ← SyntaxError
```

**验证证据**：
```
SyntaxError: Identifier 'SaveSystem' has already been declared
    at save.js:130
```

**影响链**：`save.js` 解析失败 → `Game.init()` 中 `UI.updateButtons()` 调用 `SaveSystem.hasSave()` 抛 `ReferenceError` → 同样导致启动崩溃。

### 说明：为什么只有这两个文件出问题

其余 8 个系统的实例常量与类名**不同名**，因此正常：

| 文件 | 类名 | 实例常量 | 状态 |
|------|------|----------|------|
| shop.js | `ShopSystem` | `Shop` | ✅ |
| customer.js | `CustomerSystem` | `Customers` | ✅ |
| time.js | `TimeSystem` | `Time` | ✅ |
| events.js | `EventSystem` | `Events` | ✅ |
| upgrades.js | `UpgradeSystem` | `Upgrades` | ✅ |
| ui.js | `UISystem` | `UI` | ✅ |
| audio.js | `AudioSystem` | `Audio` | ✅ |
| sprites.js | `SpriteSystem` | `Sprites` | ✅ |
| **renderer.js** | **`Renderer`** | **`Renderer`** | ❌ 同名 |
| **save.js** | **`SaveSystem`** | **`SaveSystem`** | ❌ 同名 |

这是典型的「复制粘贴同类文件时忘了改变量名」。全项目扫描确认**仅此 2 处**，无第三处。

**修复方式（各改 1 行，任选其一）**：
```js
// renderer.js 第 340 行
const RendererInstance = new Renderer();   // 但需同步修改所有 Renderer.xxx 引用，不推荐

// 推荐：给类改名，保留全局实例名不动（零副作用）
// renderer.js 第 2 行
class RendererSystem { ... }
// 第 340 行
const Renderer = new RendererSystem();

// save.js 第 2 行
class SaveManager { ... }
// 第 130 行
const SaveSystem = new SaveManager();
```

---

## 四、核心玩法审计（代码层面）

### ✅ 已实现且逻辑正确

| 功能 | 位置 | 说明 |
|------|------|------|
| 进货 | `shop.purchaseProduct()` | 校验解锁状态与资金，扣款、加库存、记账 |
| 定价 | `shop.setPrice()` | 限制在「成本价 ~ 5 倍基准价」 |
| 销售 | `shop.sellProduct()` | 扣库存、累计收入与销量 |
| 收入 | `shop.addMoney()` + `completePurchase()` | 结账时按定价累计入账 |
| 补货 | UI `+5 / +10` 按钮 | 直接调用进货接口并刷新面板 |
| 顾客生成 | `customer.update()` | 按昼夜权重加权随机（人类/加班族/机器人/外星人/黑客/猫） |
| 顾客行为 | 状态机 | 进店 → 浏览货架 → 选购 → 前往收银台 → 结账 → 离店 |
| 耐心机制 | `patience -= 0.1/帧` | 归零则愤怒离开并扣声誉 |
| 库存与货架联动 | `renderer.drawShelves()` | 商品图标按货架绘制 |
| 昼夜循环 | `time.js` | 5 个时段，6:00 开始，跨天递增 |
| 随机事件 | `events.js` | 13 种，含正面/负面/特殊，含停电、偷窃、爆红 |
| 升级解锁 | `upgrades.js` | 8 项升级，含前置条件与等级门槛 |
| 成就系统 | `upgrades.checkAchievements()` | 12 个成就，条件判定完整 |
| 结局判定 | `upgrades.checkEnding()` | 4 种结局（富豪/网红/星际/完美） |
| 存档 | `save.js` | localStorage 自动存档 30s + 退出保存 |
| 音效 | `audio.js` | 纯 Web Audio 合成，无外部资源 |

### ⚠️ 部分实现 / 存在小缺陷（不阻断）

1. **顾客预算门控失效**（`customer.js` `tryPurchaseAtShelf`）
   ```js
   if (stock > 0 && product.price <= customer.budget + product.price)
   ```
   该条件恒为真，导致货架选购阶段**不校验预算**，定价过高只会影响结账时的声誉，不影响成交。属于平衡性缺陷，非阻断。

2. **`spawnTimer` 双自增**（`customer.js` L39 与 L51）
   `else` 分支再次 `++`，使生成检测实际每 0.5 秒一次而非 1 秒。仅影响出客节奏，非阻断。

3. **画布初始化尺寸**（`renderer.js` `resize()`）
   `init()` 在 `#game-screen` 仍为 `display:none` 时执行，`container.clientWidth === 0`，计算出负值尺寸。因内联 `width:-200px` 为非法值被浏览器丢弃，CSS 的 `width:100%; flex:1` 兜底生效，**画面仍能显示**，但 2:1 宽高比逻辑失效。建议在 `newGame()` 后补调一次 `Renderer.resize()`。

4. **无明确「通关」终点**
   结局阈值（10 万资金 / 100 声誉 / 50 位外星客 / 10 个成就）偏高，缺少「经营 N 天结算」的轻量收尾。不影响可玩性。

5. **暂停按钮文案不随新游戏复位**（`btn-pause` 可能残留「继续」）。UI 细节。

---

## 五、无法验证的内容（明确声明）

以下内容**未经验证**，不得视为已确认：

- **未在真实浏览器中运行**（本次为静态审计，无浏览器环境）。因此「修复后必定可玩」是基于代码逻辑与语法校验的推断，**非实测结论**。
- 画面渲染效果、动画流畅度、音效实际听感、移动端触摸适配 — 均未实测。
- Canvas 各精灵的视觉正确性（像素坐标是否重叠、顾客是否走出画面）— 未实测。

---

## 六、最需要修复的三个问题

| 优先级 | 问题 | 位置 | 修复量 |
|--------|------|------|--------|
| **P0** | 标识符重复声明 → 启动崩溃 | `renderer.js:340` | 1 行 |
| **P0** | 标识符重复声明 → 启动崩溃 | `save.js:130` | 1 行 |
| P1 | 画布在隐藏状态下初始化，宽高比逻辑失效 | `renderer.js resize()` / `game.js newGame()` | 3 行 |

---

## 七、是否还值得继续投入开发

**值得，但只需极小投入，然后应当停止。**

理由：

1. 游戏**不是「功能没做完」**，而是**「两行代码写错」**。13 个系统、约 2800 行 JS 的业务逻辑已经完整，涵盖进货、定价、销售、库存、收入、补货、顾客 AI、昼夜、事件、升级、成就、结局、存档、音效——这正是任务要求的「完整经营循环」。
2. 修复成本是 **2 行改名**，风险接近零（改名只影响 `renderer.js` / `save.js` 内部，全局引用名 `Renderer` / `SaveSystem` 保持不变）。
3. 剩余问题（预算门控、双自增、画布尺寸）均**不阻断**游玩，属于打磨项。

### 给下一位接手者的建议（最小动作清单）

1. 改 `renderer.js:2` 与 `save.js:2` 的类名（或改第 340/130 行的实例名）。
2. 用 `node --check` 复验全部 14 个文件应全绿。
3. 浏览器打开 `index.html`，点「开始新游戏」，确认：
   - 时间在走、顾客进店、结账后资金增加；
   - 「库存」面板能进货、能改价；
   - 声誉增长后能升级。
4. 若上述通过 → **直接交付，停止开发**。

> **明确结论：当前版本不能玩，但离「能玩」只差 2 行。修完这 2 行并通过第 3 步的冒烟测试后，即可停止开发，不必再消耗 Token 追求完美。**

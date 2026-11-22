// 游戏数据定义
const GameData = {
    // 商品类型
    categories: {
        food: { name: '食品', icon: '🍜' },
        drink: { name: '饮料', icon: '🥤' },
        tech: { name: '科技', icon: '💾' },
        special: { name: '特殊', icon: '✨' }
    },

    // 商品定义
    products: {
        // 基础食品
        noodles: {
            id: 'noodles',
            name: '合成拉面',
            category: 'food',
            icon: '🍜',
            baseCost: 5,
            basePrice: 12,
            popularity: 0.8,
            unlockLevel: 1,
            desc: '经典的速食拉面，赛博朋克风格包装'
        },
        burger: {
            id: 'burger',
            name: '机械汉堡',
            category: 'food',
            icon: '🍔',
            baseCost: 8,
            basePrice: 18,
            popularity: 0.7,
            unlockLevel: 1,
            desc: '由机械臂精确制作的汉堡'
        },
        onigiri: {
            id: 'onigiri',
            name: '纳米饭团',
            category: 'food',
            icon: '🍙',
            baseCost: 4,
            basePrice: 10,
            popularity: 0.9,
            unlockLevel: 1,
            desc: '添加了纳米营养剂的饭团'
        },
        
        // 饮料
        cola: {
            id: 'cola',
            name: '霓虹可乐',
            category: 'drink',
            icon: '🥤',
            baseCost: 3,
            basePrice: 8,
            popularity: 0.9,
            unlockLevel: 1,
            desc: '会发光的碳酸饮料'
        },
        coffee: {
            id: 'coffee',
            name: '醒神咖啡',
            category: 'drink',
            icon: '☕',
            baseCost: 6,
            basePrice: 15,
            popularity: 0.75,
            unlockLevel: 2,
            desc: '添加了提神因子的咖啡'
        },
        energyDrink: {
            id: 'energyDrink',
            name: '超频能量饮',
            category: 'drink',
            icon: '⚡',
            baseCost: 10,
            basePrice: 25,
            popularity: 0.6,
            unlockLevel: 3,
            desc: '据说能让大脑超频运转'
        },
        
        // 科技产品
        battery: {
            id: 'battery',
            name: '量子电池',
            category: 'tech',
            icon: '🔋',
            baseCost: 15,
            basePrice: 35,
            popularity: 0.5,
            unlockLevel: 2,
            desc: '为机器人和义体提供能源'
        },
        chip: {
            id: 'chip',
            name: '记忆芯片',
            category: 'tech',
            icon: '💾',
            baseCost: 25,
            basePrice: 60,
            popularity: 0.4,
            unlockLevel: 4,
            desc: '存储和传输记忆的芯片'
        },
        implant: {
            id: 'implant',
            name: '简易义体',
            category: 'tech',
            icon: '🦾',
            baseCost: 50,
            basePrice: 120,
            popularity: 0.3,
            unlockLevel: 5,
            desc: '基础的身体强化组件'
        },
        
        // 特殊商品
        alienSnack: {
            id: 'alienSnack',
            name: '外星零食',
            category: 'special',
            icon: '👽',
            baseCost: 20,
            basePrice: 45,
            popularity: 0.5,
            unlockLevel: 3,
            desc: '来自仙女座的美味，味道奇特'
        },
        luckyCharm: {
            id: 'luckyCharm',
            name: '幸运符咒',
            category: 'special',
            icon: '🔮',
            baseCost: 30,
            basePrice: 70,
            popularity: 0.35,
            unlockLevel: 4,
            desc: '据说能带来好运的神秘物品'
        },
        timeCapsule: {
            id: 'timeCapsule',
            name: '时间胶囊',
            category: 'special',
            icon: '⏳',
            baseCost: 100,
            basePrice: 250,
            popularity: 0.2,
            unlockLevel: 6,
            desc: '可以短暂冻结时间的稀有物品'
        }
    },

    // 顾客类型
    customerTypes: {
        human: {
            id: 'human',
            name: '普通市民',
            icon: '👤',
            patience: 100,
            budget: [10, 50],
            preferredCategories: ['food', 'drink'],
            spawnWeight: { day: 10, night: 3 },
            dialogues: {
                enter: ['欢迎光临！', '有什么好吃的吗？', '肚子饿了...'],
                happy: ['不错不错！', '下次还来！', '五星好评！'],
                angry: ['太贵了！', '再也不来了！', '差评！'],
                leave: ['再见~', '拜拜！']
            }
        },
        worker: {
            id: 'worker',
            name: '加班族',
            icon: '💼',
            patience: 60,
            budget: [15, 40],
            preferredCategories: ['food', 'drink'],
            spawnWeight: { day: 5, night: 8 },
            dialogues: {
                enter: ['加班好累...', '需要补充能量', '有咖啡吗？'],
                happy: ['活过来了！', '继续干活！', '谢谢老板！'],
                angry: ['没时间等了！', '太慢了！'],
                leave: ['得赶紧回去...']
            }
        },
        robot: {
            id: 'robot',
            name: '服务机器人',
            icon: '🤖',
            patience: 150,
            budget: [20, 80],
            preferredCategories: ['tech'],
            spawnWeight: { day: 3, night: 8 },
            dialogues: {
                enter: ['[系统] 需要补给', '[扫描中] 检测商品', '哔哔...'],
                happy: ['[满意] 任务完成', '电量充足！', '感谢人类！'],
                angry: ['[错误] 效率低下', '逻辑错误：价格过高'],
                leave: ['[离线] 再见']
            }
        },
        alien: {
            id: 'alien',
            name: '外星旅客',
            icon: '👽',
            patience: 120,
            budget: [30, 150],
            preferredCategories: ['special', 'food'],
            spawnWeight: { day: 1, night: 5 },
            dialogues: {
                enter: ['[翻译器] 你好地球', '有特产吗？', '有趣的地方'],
                happy: ['星际好评！', '带回母星推荐', '地球不错！'],
                angry: ['[愤怒] 不友好', '要写差评报告'],
                leave: ['[传送] 再见']
            }
        },
        hacker: {
            id: 'hacker',
            name: '神秘黑客',
            icon: '🕶️',
            patience: 80,
            budget: [50, 200],
            preferredCategories: ['tech', 'special'],
            spawnWeight: { day: 1, night: 6 },
            dialogues: {
                enter: ['...有货吗？', '低调点', '你懂的'],
                happy: ['不错，有前途', '我会记住你的', '...'],
                angry: ['浪费时间', '算了，找别家'],
                leave: ['...']
            }
        },
        cat: {
            id: 'cat',
            name: '赛博猫咪',
            icon: '🐱',
            patience: 200,
            budget: [0, 0],
            preferredCategories: [],
            spawnWeight: { day: 3, night: 4 },
            dialogues: {
                enter: ['喵~', '[蹭腿]', '...'],
                happy: ['[呼噜噜]', '[摇尾巴]', '喵！'],
                angry: ['[炸毛]', '嘶...'],
                leave: ['[跳走]', '喵~']
            },
            special: true // 特殊顾客，不买东西但增加氛围
        }
    },

    // 升级项目
    upgrades: {
        shelf1: {
            id: 'shelf1',
            name: '扩展货架 I',
            icon: '📦',
            desc: '增加商品种类容量',
            cost: 500,
            effect: { shelfSpace: 2 },
            unlockLevel: 1,
            requires: []
        },
        shelf2: {
            id: 'shelf2',
            name: '扩展货架 II',
            icon: '📦',
            desc: '进一步扩展货架',
            cost: 1500,
            effect: { shelfSpace: 3 },
            unlockLevel: 3,
            requires: ['shelf1']
        },
        neonSign: {
            id: 'neonSign',
            name: '霓虹招牌',
            icon: '💡',
            desc: '吸引更多顾客',
            cost: 800,
            effect: { customerRate: 0.2 },
            unlockLevel: 2,
            requires: []
        },
        acUnit: {
            id: 'acUnit',
            name: '空调系统',
            icon: '❄️',
            desc: '提升顾客耐心',
            cost: 1200,
            effect: { customerPatience: 0.2 },
            unlockLevel: 3,
            requires: []
        },
        autoRegister: {
            id: 'autoRegister',
            name: '自动收银机',
            icon: '💳',
            desc: '加快结账速度',
            cost: 2000,
            effect: { checkoutSpeed: 0.3 },
            unlockLevel: 4,
            requires: []
        },
        securityBot: {
            id: 'securityBot',
            name: '安保机器人',
            icon: '🛡️',
            desc: '减少偷窃事件',
            cost: 3000,
            effect: { theftReduction: 0.5 },
            unlockLevel: 5,
            requires: ['autoRegister']
        },
        vipLounge: {
            id: 'vipLounge',
            name: 'VIP休息室',
            icon: '🛋️',
            desc: '吸引高端顾客',
            cost: 5000,
            effect: { vipCustomerRate: 0.3 },
            unlockLevel: 6,
            requires: ['acUnit']
        },
        teleporter: {
            id: 'teleporter',
            name: '传送门装置',
            icon: '🌀',
            desc: '外星顾客大幅增加',
            cost: 10000,
            effect: { alienRate: 0.5 },
            unlockLevel: 8,
            requires: ['vipLounge']
        }
    },

    // 随机事件
    events: {
        // 正面事件
        rushHour: {
            id: 'rushHour',
            name: '客流高峰',
            icon: '🏃',
            type: 'positive',
            desc: '突然来了一大波顾客！',
            duration: 60,
            effect: { customerRate: 2 },
            chance: 0.05
        },
        viralProduct: {
            id: 'viralProduct',
            name: '网红效应',
            icon: '📱',
            type: 'positive',
            desc: '某个商品在社交媒体上爆红！',
            duration: 120,
            effect: { randomProductPopularity: 2 },
            chance: 0.03
        },
        tipJar: {
            id: 'tipJar',
            name: '慷慨小费',
            icon: '💰',
            type: 'positive',
            desc: '一位顾客留下了丰厚小费！',
            instant: true,
            effect: { money: 100 },
            chance: 0.04
        },
        goodReview: {
            id: 'goodReview',
            name: '好评如潮',
            icon: '⭐',
            type: 'positive',
            desc: '网上出现了好评！声誉提升！',
            instant: true,
            effect: { reputation: 10 },
            chance: 0.05
        },
        
        // 负面事件
        powerOutage: {
            id: 'powerOutage',
            name: '停电事故',
            icon: '⚡',
            type: 'negative',
            desc: '便利店停电了！顾客无法购物！',
            duration: 45,
            effect: { noCustomers: true },
            chance: 0.03
        },
        shoplift: {
            id: 'shoplift',
            name: '偷窃事件',
            icon: '🦹',
            type: 'negative',
            desc: '有人偷走了商品！',
            instant: true,
            effect: { loseProduct: true },
            chance: 0.04
        },
        priceWar: {
            id: 'priceWar',
            name: '价格战',
            icon: '💸',
            type: 'negative',
            desc: '隔壁店铺大降价！顾客减少！',
            duration: 90,
            effect: { customerRate: 0.5 },
            chance: 0.03
        },
        badReview: {
            id: 'badReview',
            name: '差评危机',
            icon: '👎',
            type: 'negative',
            desc: '网上出现了差评！声誉下降！',
            instant: true,
            effect: { reputation: -5 },
            chance: 0.03
        },
        
        // 特殊事件
        mysteriousCustomer: {
            id: 'mysteriousCustomer',
            name: '神秘来客',
            icon: '🎭',
            type: 'special',
            desc: '一位神秘人物造访了便利店...',
            duration: 30,
            effect: { specialCustomer: true },
            chance: 0.02
        },
        alienTrade: {
            id: 'alienTrade',
            name: '外星交易',
            icon: '🛸',
            type: 'special',
            desc: '外星飞船降落在门口！',
            duration: 60,
            effect: { alienProducts: true },
            chance: 0.015
        },
        luckyDay: {
            id: 'luckyDay',
            name: '幸运之日',
            icon: '🍀',
            type: 'special',
            desc: '今天感觉特别幸运！',
            duration: 180,
            effect: { doubleMoney: true },
            chance: 0.01
        }
    },

    // 成就定义
    achievements: {
        firstSale: {
            id: 'firstSale',
            name: '开张大吉',
            icon: '🎉',
            desc: '完成第一笔交易',
            condition: (stats) => stats.totalSales >= 1
        },
        hundredSales: {
            id: 'hundredSales',
            name: '百笔交易',
            icon: '💯',
            desc: '完成100笔交易',
            condition: (stats) => stats.totalSales >= 100
        },
        thousandMoney: {
            id: 'thousandMoney',
            name: '小有积蓄',
            icon: '💰',
            desc: '拥有10000元',
            condition: (stats) => stats.money >= 10000
        },
        tenThousandMoney: {
            id: 'tenThousandMoney',
            name: '富甲一方',
            icon: '💎',
            desc: '拥有100000元',
            condition: (stats) => stats.money >= 100000
        },
        allProducts: {
            id: 'allProducts',
            name: '商品大师',
            icon: '📦',
            desc: '解锁所有商品',
            condition: (stats) => stats.unlockedProducts >= Object.keys(GameData.products).length
        },
        nightOwl: {
            id: 'nightOwl',
            name: '夜猫子',
            icon: '🦉',
            desc: '在夜晚服务50位顾客',
            condition: (stats) => stats.nightCustomers >= 50
        },
        alienFriend: {
            id: 'alienFriend',
            name: '外星之友',
            icon: '👽',
            desc: '服务20位外星顾客',
            condition: (stats) => stats.alienCustomers >= 20
        },
        robotBuddy: {
            id: 'robotBuddy',
            name: '机器人伙伴',
            icon: '🤖',
            desc: '服务30位机器人顾客',
            condition: (stats) => stats.robotCustomers >= 30
        },
        catLover: {
            id: 'catLover',
            name: '猫咪之友',
            icon: '🐱',
            desc: '遇到10次赛博猫咪',
            condition: (stats) => stats.catEncounters >= 10
        },
        eventSurvivor: {
            id: 'eventSurvivor',
            name: '事件幸存者',
            icon: '🎭',
            desc: '经历10次随机事件',
            condition: (stats) => stats.eventsExperienced >= 10
        },
        sevenDays: {
            id: 'sevenDays',
            name: '一周营业',
            icon: '📅',
            desc: '经营满7天',
            condition: (stats) => stats.daysPlayed >= 7
        },
        thirtyDays: {
            id: 'thirtyDays',
            name: '月度最佳',
            icon: '🏆',
            desc: '经营满30天',
            condition: (stats) => stats.daysPlayed >= 30
        }
    },

    // 结局条件
    endings: {
        richEnding: {
            id: 'richEnding',
            name: '赛博富豪',
            desc: '你成为了赛博城最富有的便利店老板！',
            condition: (stats) => stats.money >= 100000
        },
        famousEnding: {
            id: 'famousEnding',
            name: '网红店铺',
            desc: '你的便利店成为了赛博城的传奇地标！',
            condition: (stats) => stats.reputation >= 100
        },
        alienEnding: {
            id: 'alienEnding',
            name: '星际贸易站',
            desc: '你的便利店成为了外星旅客的必经之地！',
            condition: (stats) => stats.alienCustomers >= 50
        },
        perfectEnding: {
            id: 'perfectEnding',
            name: '完美结局',
            desc: '你解锁了所有成就，成为了传说中的便利店之王！',
            condition: (stats) => stats.achievementsUnlocked >= 10
        }
    }
};

// 工具函数
const Utils = {
    random: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    lerp: (a, b, t) => a + (b - a) * t,
    chance: (probability) => Math.random() < probability,
    pick: (array) => array[Math.floor(Math.random() * array.length)],
    formatMoney: (amount) => '¥' + Math.floor(amount).toLocaleString(),
    formatTime: (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
};

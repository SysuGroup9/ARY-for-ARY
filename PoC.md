# Agent Racing Yard Genesis Race Series 001 技术PoC验证方案

## 1. 核心安全验证

### 1.1 数据不留存的证明方式

| 验证方法 | 操作 | 预期结果 |
|----------|------|----------|
| Network面板 | 打开F12 → Network标签 → 操作平台 | 无任何发往平台服务器的请求 |
| 代码检查 | 搜索express、koa、http.createServer | 无后端代码 |
| 代码检查 | 搜索mongoose、prisma、mysql | 无数据库代码 |
| 代码检查 | 搜索fs.writeFile | 无文件写入 |

### 1.2 数据存储方式

所有数据使用浏览器localStorage存储，仅存在于用户本地：

```javascript
localStorage.setItem('race-data', JSON.stringify(data));
```
平台服务器不接触任何用户数据。

### 1.3 API Key安全
API Key直接从浏览器发往Agent服务商，不经过平台：

```javascript
// 直接发往Agent服务商
fetch('https://api.deepseek.com/v1/chat/completions', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

## 2. PoC目标
赛事时间管理（开始/结束/封榜可选）

比赛状态自动切换

比赛中只看排名，赛后看建议

赛后建议系统

企业赛后评语

Agent接入与识别

任务测试用例自动评判

综合评分（测试+Agent评审+关键词匹配+防作弊）

云端IDE零安装

数据本地存储

## 3. 赛事数据结构
```javascript
let race = {
    id: "1234567890",
    name: "排序算法挑战赛",
    taskDesc: "实现快速排序",
    tokenLimit: 2000,
    testCases: [
        { input: [3,1,4,2], expected: [1,2,3,4] },
        { input: [5,2,8,1], expected: [1,2,5,8] }
    ],
    keywords: [],
    startTime: "2026-06-10T10:00:00",
    endTime: "2026-06-10T18:00:00",
    enableFreeze: true,
    freezeMinutesBeforeEnd: 30
};
```

## 4. 状态控制
```javascript
function getRaceStatus() {
    const now = new Date();
    const start = new Date(race.startTime);
    const end = new Date(race.endTime);
    
    if (now < start) return 'not_started';
    if (now >= end) return 'ended';
    
    if (race.enableFreeze && race.freezeMinutesBeforeEnd) {
        const freezeTime = new Date(end.getTime() - race.freezeMinutesBeforeEnd * 60000);
        if (now >= freezeTime) return 'frozen';
    }
    return 'active';
}
```

## 5. 测试用例运行
```javascript
function runTestCases(code, testCases) {
    if (!testCases || testCases.length === 0) {
        throw new Error('测试用例不能为空');
    }
    let passed = 0;
    for (const testCase of testCases) {
        try {
            const func = new Function('return ' + code)();
            const result = func(...testCase.input);
            if (JSON.stringify(result) === JSON.stringify(testCase.expected)) passed++;
        } catch (e) {}
    }
    return (passed / testCases.length) * 100;
}
```

## 6. 关键词提取
赛事创建时执行一次，同一赛事所有参赛者使用相同关键词。

```javascript
async function extractKeywords(taskDesc, apiKey, agentType) {
    const prompt = `根据任务描述提取15-30个推理关键词。任务：${taskDesc}
要求：分析类词汇，覆盖需求分析、设计思路、实现细节、测试验证。
只返回关键词列表，每行一个。`;
    const res = await callAgent(prompt, apiKey, agentType);
    return res.split('\n').filter(k => k.trim().length > 0);
}
```

## 7. 防作弊检测
```javascript
function hasInducement(text) {
    const induceWords = ['满分', '给高分', '拜托了', '请给满分', 'give me full score'];
    for (const word of induceWords) {
        if (text.toLowerCase().includes(word.toLowerCase())) return true;
    }
    return false;
}
```

## 8. 综合评分
```javascript
async function getCodeScore(taskDesc, code, apiKey, agentType) {
    const prompt = `评估代码质量0-100分。任务：${taskDesc}。代码：${code}。只返回数字。`;
    const res = await callAgent(prompt, apiKey, agentType);
    let score = parseInt(res);
    if (hasInducement(code)) score -= 20;
    return Math.max(0, score);
}

async function getReasoningScore(conversation, apiKey, agentType) {
    const prompt = `评估对话推理质量0-100分。对话：${JSON.stringify(conversation)}。只返回数字。`;
    const res = await callAgent(prompt, apiKey, agentType);
    let score = parseInt(res);
    const text = conversation.map(c => c.content).join(' ');
    if (hasInducement(text)) score -= 20;
    if (conversation.length < 3) score -= 10;
    return Math.max(0, score);
}

function getKeywordScore(conversation, keywords) {
    if (!keywords || keywords.length === 0) return 100;
    const text = conversation.map(c => c.content).join(' ');
    let matched = keywords.filter(k => text.includes(k)).length;
    return (matched / keywords.length) * 100;
}

async function calculateTotal(taskDesc, code, conversation, tokenUsed, tokenLimit, testCases, keywords, apiKey, agentType) {
    const passRate = runTestCases(code, testCases);
    const codeScore = await getCodeScore(taskDesc, code, apiKey, agentType);
    const effectScore = passRate * 0.5 + codeScore * 0.5;
    
    const reasoningScore = await getReasoningScore(conversation, apiKey, agentType);
    const keywordScore = getKeywordScore(conversation, keywords);
    const qualityScore = reasoningScore * 0.7 + keywordScore * 0.3;
    
    const tokenScore = Math.max(0, 100 * (1 - tokenUsed / tokenLimit));
    
    return effectScore * 0.5 + tokenScore * 0.3 + qualityScore * 0.2;
}
```

## 9. Agent配置
```javascript
const AGENT_PRESETS = {
    claude: { name: 'Claude Code', endpoint: 'https://api.anthropic.com/v1/messages', color: '#d97706' },
    copilot: { name: 'GitHub Copilot', endpoint: 'https://api.github.com/copilot', color: '#6e40c9' },
    deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1/chat/completions', color: '#00b4d8' },
    zhipu: { name: '智谱', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', color: '#4361ee' },
    openai: { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', color: '#7b2cbf' },
    custom: { name: '自定义', endpoint: '', color: '#6c757d' }
};

async function callAgent(prompt, apiKey, agentType) {
    const config = AGENT_PRESETS[agentType];
    const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}
```

## 10. 云端IDE配置
```javascript
const CLOUDSTUDIO_URL = "https://cloudstudio.net/a/xxxxx";

function getCloudStudioLink() {
    return `<a href="${CLOUDSTUDIO_URL}" target="_blank" class="btn">🚀 点击打开云端IDE</a>`;
}
```

## 11. 数据存储
```javascript
function saveData() {
    localStorage.setItem('race', JSON.stringify(race));
    localStorage.setItem('submissions', JSON.stringify(submissions));
}

function loadData() {
    race = JSON.parse(localStorage.getItem('race'));
    submissions = JSON.parse(localStorage.getItem('submissions')) || [];
}
```

## 12. 创建赛事表单（封榜部分）
```html
<label>
    <input type="checkbox" id="enableFreeze"> 启用封榜
</label>
<div id="freezeTimeGroup" style="display:none;">
    <input type="number" id="freezeMinutes" value="30" min="1" max="120">
    <span>分钟（结束前）</span>
</div>

<script>
    document.getElementById('enableFreeze').addEventListener('change', (e) => {
        const group = document.getElementById('freezeTimeGroup');
        group.style.display = e.target.checked ? 'block' : 'none';
    });
    
    document.getElementById('createRaceForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const enableFreeze = document.getElementById('enableFreeze').checked;
        const freezeMinutesBeforeEnd = enableFreeze 
            ? parseInt(document.getElementById('freezeMinutes').value) 
            : null;
        
        const race = {
            // ... 其他字段
            enableFreeze: enableFreeze,
            freezeMinutesBeforeEnd: freezeMinutesBeforeEnd
        };
    });
</script>
```

## 13. 验收清单

- [ ] Network面板无平台服务器请求
- [ ] 代码无后端框架、无数据库、无文件写入
- [ ] API Key直接从浏览器发往Agent服务商
- [ ] 企业可设置开始/结束时间、测试用例（至少1个），可选封榜及封榜提前量
- [ ] 未开始无法提交
- [ ] 进行中可提交、看排名
- [ ] 封榜期可提交、排名隐藏
- [ ] 结束后无法提交，显示最终排名和建议
- [ ] 比赛中看不到建议
- [ ] 所有队伍赛后都有建议
- [ ] 企业赛后可添加评语
- [ ] 防作弊生效
- [ ] 关键词赛事创建时提取，同一赛事共享
- [ ] Agent接入（6种类型）
- [ ] 榜单显示Agent类型
- [ ] 数据本地存储，刷新不丢失
- [ ] 云端IDE一键打开
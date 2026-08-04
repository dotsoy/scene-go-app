# SceneGo UI 实施 Prompt V2 — 基于已完成设计的可执行实现稿

> **本文档由已完成的设计稿生成**（Pencil 画布 `.pen` 文件，13 屏 + 4 组件全部落地并验证无布局问题），供**编码 agent** 直接据此实现 React Native 界面。
> - **规格来源**：`docs/DESIGN-01.md`（设计规格，V2 对话优先架构）——本文档是它的「按图施工版」，包含**实际使用的精确文案、实测尺寸、组件结构、实例覆盖模式**。
> - **权威参照**：Pencil 画布文件 `~/.pencil/documents/6cf44651-6202-4307-9ab2-757aaa007a49/pencil-new.pen`（V1 架构时生成的文件名，内容为 V2 设计）。实现时以本文档为准，画布用于核对视觉。
> - **核心心智**：对话 = 输入与推导容器；大字卡 = 交付终端。任何表达卡点击后必须全屏最高亮度大字展示。

---

## 0. 实现范围速览（13 屏 · 4 组件）

| # | 屏 | 类型 | 落地文件（现仓库对应） |
|---|---|---|---|
| 01 | DIALOG 对话页 | 全屏 · 默认主界面 | `App.tsx` 重构 + 新 `ChatPage` + `ChatInputBar` + `TabBar` |
| 02 | FLASH CARD 全屏大字卡 | 全屏覆盖层 | `FlashCardView`（保留，样式对齐） |
| 03 | CARD STACK 卡栈页 | 全屏 · Tab | 新 `CardStackPage` |
| 04 | NOTES 笔记页 | 全屏 · Tab | `QuickNotesModal` 改造为 Tab 页 |
| 05 | MORE 更多页 | 全屏 · Tab | 新 `MorePage`（入口列表） |
| 06 | CAMERA 相机取景 | 全屏（`📷` 调起） | `CameraBackground` 改造 |
| 07 | SAFETY CARD 安全卡 | 全屏 · 卡栈变体 | `buildSafetyCard()` 样式对齐 |
| 08 | SAFETY DETAIL 安全详情 | 底部 Sheet | `SafetyDetailModal`（数据对齐 §4.8） |
| 09 | COUNTRY SELECT 国家选择 | 居中卡片 | `CountrySelectModal` |
| 10 | SWITCH PROMPT 位置变化提示 | 居中卡片 | `CountrySwitchPromptModal` |
| 11 | SESSION HISTORY 会话历史 | 抽屉 | `SessionHistoryModal` |
| 12 | API LOG 日志监控 | 高抽屉 | `ApiLogModal` |
| 13 | ENGINE SETTINGS 引擎设置 | 抽屉 | `PluginSelectorModal` |

- 导航：**无路由库**。四 Tab 用 `activeTab` 状态驱动；全屏大字卡 / 取景 / 抽屉子页用全屏覆盖层（`Modal` 或绝对定位层）。
- 画布中的「标注」文本（每屏下方灰字）为辅助元素，**不实现**。

---

## 1. 设计令牌（已落地，直接使用）

> `src/theme/tokens.ts` 已含 V1 令牌，V2 新增两个令牌需补入：`userBubble`、`mask`。全部界面统一引用，禁止散落硬编码色值。

```ts
// 在 src/theme/tokens.ts 的 COLORS 中新增：
userBubble: 'rgba(37,99,235,0.15)',  // 用户消息气泡
mask: 'rgba(0,0,0,0.65)',            // 模态遮罩（0.6~0.7 区间取 0.65）
```

其余令牌与现有 `COLORS` 完全一致（`bgPrimary #09090b`、`bgCard #121214`、`bgCardLight #18181b`、`bgOverlay rgba(24,24,27,0.95)`、`bgBar rgba(10,10,30,0.85)`、`accentBlue #4fc3f7`、`accentCyan #38bdf8`、`accentYellow #facc15`、`accentGreen #81C784`、`accentRed #ef5350`、`greenBg`、`redBg`、`borderSubtle`、`borderLight`、`borderBlue`）。

字体用现有 `FONT`（Inter-Regular/SemiBold/Bold/ExtraBold + JetBrainsMono-Regular/Bold）。`SCENEGO` 品牌、进度编号、REC/LIVE/SAFETY 状态、日志、时间戳一律 `FONT.mono`/`monoBold`。

布局常量（`LAYOUT` 中补）：
```ts
statusBarHeight: 52,   // 状态栏
inputBarHeight: 72,    // 底部输入栏
tabBarHeight: 56,      // Tab 栏
bottomSafeArea: 34,    // Safe 区底部
contentPaddingH: 20,   // 内容左右留白（已有 screenPaddingH=20）
cardRadius: 10,        // 通用行卡片圆角（现有 cardRadius=12 用于大字区等，按需取值 10–16）
```

**通用样式约定**：卡片 `bgCard` 圆角 10–16 描边 `borderSubtle`；药丸/标签 `bgCardLight` 圆角 6–12 小字加粗；蓝色主按钮 `accentBlue` 底 + 文字 `#0a0a1e` 加粗；卡内大字区底 `#000000` 描边 `rgba(255,255,255,0.2)`；屏幕内容左右留白 20。

---

## 2. 可复用组件（4 个，已按此结构在画布落地）

> 画布组件 ID：StatusBar=`v7L7Gu`、ExprCard=`na3SP`、InputBar=`g22rC`、TabBar=`KFGml`。实现时对应 4 个 RN 组件，**实例通过 props 覆盖**，对应画布的 `descendants` 模式。

### 2.1 StatusBar（52pt）
- 高 52，水平两端对齐，左右 padding 20，垂直居中。
- 左：`9:41`（15/SemiBold/白）；右：`5G`（13 白）+ 电池图标（lucide `battery-full` 22×12 白）+ `100%`（13 白）。
- 状态栏时间/信号为模拟值，静态即可。

### 2.2 ExprCard 表达卡（对话流消息 + 卡栈条目共用）
结构（垂直，`bgCard` 圆角 16 描边 `borderSubtle`，padding 16，gap 10）：
1. **顶行**（水平 gap 8 居中）：分类胶囊（`bgCardLight` 圆角 6 padding[4,8]，11/700 字距1）｜中文标题（13/600，flex1）｜右侧操作位（默认 `全屏 ›` 12 蓝，卡栈实例覆盖为红 `×` 删除）。
2. **大字区**（`#000000` 圆角 12 描边 `rgba(255,255,255,0.2)` padding 16，垂直 gap 6）：
   - 当地语言大字 **28–34pt / ExtraBold / 白 / lineHeight 1.3**（对话流用 30，全屏用 40–48）；
   - 音标 13/`textSecondary`；补充 12/`textMuted`。
3. **操作行**：`PLAY AUDIO` 胶囊（`bgCardLight` 圆角 12 padding[6,12]，12/700 字距1 灰）。
4. **LOCAL PROTOCOL 提示框**（`bgCardLight` 圆角 10 padding 10，垂直 gap 4）：头行 `LOCAL PROTOCOL`（mono 10 字距1 灰）+ 正文 12/`textSecondary`。

**实例覆盖规则（等价 descendants）**：
- 对话流消息：隐藏 LOCAL PROTOCOL（高度受限），大字 30pt，隐藏补充行可进一步压缩；
- 卡栈条目：隐藏 LOCAL PROTOCOL 与 PLAY AUDIO 行，顶行右侧替换为红 `×`（删除）；
- 全部内容（分类/标题/大字/音标/补充）由 `ScenarioResult` / `CardData` 驱动。

### 2.3 InputBar 输入栏（72pt）
- 水平 gap 8 居中，`bgBar` 圆角 16，高 72（padding 16/10），水平左右留白 20（由外层容器控制）。
- 按钮统一 40×40 圆角 10：
  - `📷` 相机（lucide `camera` 18 灰，底 `bgCardLight`）→ 调起 06；
  - `🎙️` 麦克风（lucide `mic` 18 灰，底 `bgCardLight`）→ 录音态变底 `redBg` + 图标 `accentRed`；
  - 输入框 flex1 高 40 `bgCardLight` 圆角 10，占位 `说出需求 / 打字 / 拍照...`（13 `textTertiary`）；
  - `⬆️` 发送（lucide `arrow-up` 18 `#0a0a1e`，底 `accentBlue`）。
- 交互：🎙️ 单击开始/停止听写；📷 单击进取景；发送触发打字/追问链路。

### 2.4 TabBar（56pt）
- 垂直结构：顶部分隔线 1px `borderSubtle` + 内容行高 55，四 Tab 等分（`space_around`）。
- 每 Tab：**顶部 2pt 指示条**（`accentBlue` 圆角 1，未选中隐藏）＋ 图标（lucide 20）＋ 标签（12）。
- Tab 定义：`卡栈`(layers)｜`对话`(message-circle)｜`笔记`(notebook-pen)｜`更多`(settings)。
- 选中态：图标/标签 `accentBlue`、标签 700、显示指示条；未选中：灰 `textTertiary` 600。
- **默认选中「对话」**；切 Tab 时状态在选中项间移动（画布通过实例覆盖实现，代码中用一个 state 即可）。

---

## 3. 逐屏实施规格（含精确文案与实测尺寸）

> 每屏 390×844、`clip` 裁切、底色 `bgPrimary`、状态栏 `barStyle="light-content"`。

### 3.1 01 DIALOG 对话页（默认主界面）
实测纵向堆叠（844 满版，无溢出）：
```
0–52   状态栏
52–101 Header（高 49）
101–140 位置栏（高 39）
140–650 对话流（高 510，可滚动）
650–716 语音转录横幅（高 66，录音态）
716–788 输入栏（高 72）
788–844 Tab 栏（高 56）
```
1. **Header**：左 `SCENEGO`（mono 18/800 字距2）；右状态胶囊（`bgCard` 圆角 12 padding[8,10]：绿点 8×8 + `LIVE` mono 10/700 绿）。
2. **位置栏**：`bgCard` 圆角 10 高 39 padding[0,14]：绿点 8 + `泰国 · 曼谷`（13/600）+ 弹性空位 + `切换 ›`（12 灰）。
3. **对话流**（垂直 gap 8，padding 上下 12，左右 20，`ChatTurn` 消息分发）：
   - **用户消息**（右对齐气泡 `userBubble` 圆角 12 padding 10，垂直）：`你`（10/700 `accentCyan`）+ 文本 13 主色；
   - **解读消息**（AI 左气泡 `bgCardLight` 圆角 12）：`AI 解读`（10/700 蓝字距1）+ 照片缩略（高 96 圆角 8，`bgCard` 内，来自 `processImageSnapshot` 产物）+ 文本（13 主色 lineHeight 1.5）；
   - **表达卡消息**（ExprCard 实例，无 LOCAL PROTOCOL；点击整卡 → 02 全屏大字卡）；
   - **AI 文本回复**：同解读消息去照片，标签 `AI 回复`；
   - **系统提示**（居中 11 `textMuted`）：`✅ 已为你生成表达卡「出租车按表计费」，点卡可全屏展示`。
4. **语音转录横幅**（录音态）：`bgOverlay` 圆角 12 描边 `borderBlue` padding 12：`实时语音转录中`（11/600 青）+ 右 `REC`（mono 10/700 红）+ 实时文本（14 主色）。数据源 `liveTranscript`（NativeSpeech 事件）。
5. **输入栏 + Tab 栏**：见 §2.3 / §2.4。

### 3.2 02 FLASH CARD 全屏大字卡（交付终端）
- 保留 `FlashCardView` 全能力（TTS `expo-speech`、分享、`AI 解读` 进追问、`NEXT CARD`），样式对齐：
- 顶行：`✕` 关闭胶囊（32×32 圆 16 `bgCardLight`）｜分类胶囊（TAXI 等）｜当前位置 `泰国 · 曼谷`（12 灰）｜进度胶囊 `01 / 01`（mono 12/700 `accentYellow`）。
- 大字区：**40–48pt** 当地语言大字（44 落地）`#000` 底圆角 12，音标 14 次级、补充 13 muted（中文双语）。
- 操作行：`PLAY AUDIO`（`accentBlue` 底深字）｜`AI 解读`（`bgCardLight` + sparkles 图标）｜`NEXT CARD →`（蓝）。
- LOCAL PROTOCOL 框 + 底部 `点击 ✕ 返回 · 下滑关闭` 提示（11 muted）。
- 文案样例（TAXI 卡）：大字 `กรุณาคิดค่าโดยสารตามมิเตอร์`，音标 `kà-rú-naa kít kâa dooi-sǎan taam mí-dtəə`，补充 `แท็กซี่ในกรุงเทพฯ คิดค่าโดยสารตามมิเตอร์ · 曼谷出租车按打表计费`，本地提示 `泰国出租车按打表计费。上车后司机通常直接打表，如遇拒载或漫天要价，可出示本卡。`

### 3.3 03 CARD STACK 卡栈页（Tab「卡栈」）
- Header：`卡栈`（16/700 字距1）+ 右 `清空`（红 12，清空卡栈，需确认）。
- **场景分类 chips**（横向滚动，gap 8，圆角 12 12/600）：`全部`（`accentBlue` 底深字，选中）｜`TAXI` `METRO` `RESTAURANT` `TAX_REFUND` `SHOPPING` `HOTEL` `AIRPORT` `TRANSPORT` `MEDICAL` `EXCHANGE` `SOS`（`bgCardLight` 灰字）。画布因宽度展示前 5 个（全部/TAXI/METRO/FOOD/REFUND），代码实现完整 12 项横向滚动。
- **卡片列表**（gap 10，上下 12）：ExprCard 条目（无 LOCAL PROTOCOL / PLAY AUDIO），顶行右 `×` 红删除；点卡 → 02。
- **空态**：`还没有表达卡`（14 主色）+ `去对话页拍照 / 说话 / 打字生成第一张`（12 muted）。
- **数据源**：卡栈与对话流共享同一 `CardData[]` 数组（V1 `expressionCards` 状态迁移）。

### 3.4 04 NOTES 笔记页（Tab「笔记」）
- Header：`QUICK NOTES`（mono 16/700 字距1）+ `CLOSE`。
- 搜索栏：`bgCard` 圆角 10 高 40（search 图标 + `搜索笔记` 13 灰）。
- 分类标签：`ALL`（蓝选中）/`VOUCHER`/`VOICE`/`CARD`/`BILL`（`bgCardLight`，文字用分类色）。
- 笔记列表（gap 10，行 = `bgCard` 圆角 10 padding 12：分类色点 10×10 + 标题 13/600 + mono 时间 11 灰）：
  - `退税单 Voucher No. 8392`（黄，10:24）
  - `酒店门牌号 12/5 Sukhumvit 24`（青，09:15）
  - `地铁卡余额 200 THB`（绿，昨天）
- 底部添加栏：输入框（占位 `语音自动归档 · 手动输入凭证号`）+ `保存`（`accentBlue` 底深字 13/700）。数据源 `noteStore`。

### 3.5 05 MORE 更多页（Tab「更多」）
- Header：`更多`（16/700 字距1）+ `✕`。
- 入口列表（gap 10，行 = `bgCard` 圆角 10 padding 14：36×36 图标盒 `bgCardLight` + 标题 15/600 + 描述 12 灰 + `›` 右箭头）：
  - `安全指南` — 当前国家紧急电话 / 求助句 / 骗局提示 → 07/08
  - `会话历史` — 恢复历史快照的多轮追问 → 11
  - `API 日志` — 接口请求与响应日志 → 12
  - `识别引擎设置` — 切换引擎、配置 API Key → 13
  - `切换国家` — 重新选择目的地国家 → 09
- 实现可复用 `UtilityDrawerModal` 的 TOOLS 入口模式，新增「安全指南」「切换国家」两项。

### 3.6 06 CAMERA 相机取景（对话 `📷` 调起）
- 全屏纯黑；Header：`SCENEGO`（mono 16/800 字距2）+ 右 `取消` 胶囊（`bgCardLight` 圆角 12）。
- 取景：居中 `对准菜单 / 标牌 / 售票机`（14 `#4a4a52`）；取景框 300×220 白描边 1.5 圆角 12，内 `对齐画面中的文字区域`（12 `#4a4a52`）。
- 底部操作栏 100pt：**SNAP 大按钮**（高 64 全宽 `redBg` 圆角 12 描边 `accentRed`）：`SNAP`（mono 18/800 字距2 红）+ `拍照即发送 · 单击取消`（9 灰）。
- **单击 SNAP = 拍照并发送**（V1 双击逻辑废弃，`useDoubleTap` 不再用于 SNAP）：拍照 → `compressImage` → 回对话页 → 追加「处理中」解读消息 → `pluginManager.processImageSnapshot` → 完成消息。

### 3.7 07 SAFETY CARD 安全卡（卡栈变体）
- 顶行：`✕` + 分类胶囊 `本地安全指南`（11/700 绿）+ `泰国 · 曼谷` + `SAFETY` 胶囊（`greenBg` 底 mono 11/700 绿）。
- 大字区（`#000` 圆角 12）：求助句 **40–48pt** 当地语言大字，如 `โปรดช่วยฉันด้วย`，音标 `bpròht chûay chăn dûay · 请帮帮我`，补充 `紧急电话 191 警察 · 1669 救护车 · 1155 旅游警察`。
- 操作行：`朗读求助句`（`bgCardLight` + volume 图标）+ `安全信息`（`accentBlue` 底深字）→ 08。
- **紧急拨打行**（三个等分胶囊 `greenBg` 圆角 10 padding 10）：`191 警察` / `1669 救护车` / `1155 旅游警察`（mono 16/800 绿 + 10 灰标签），一键拨号。
- 数据源 `getCountrySafety(code)` → `sos` / `emergency`，**严格使用真实值**。

### 3.8 08 SAFETY DETAIL 安全详情（底部 Sheet）
- 遮罩 `mask` + 底部 Sheet（`bgCard` 顶部圆角 16 padding[14,20,20,20]）：抓握条 36×4 灰 + 标题 `安全详情`（16/700）+ `泰国 · 曼谷`。
- **紧急电话 · 一键拨打**（3 等分 `bgCardLight` 圆角 10）：`191 警察`/`1669 救护车`/`1155 旅游警察`（mono 18/800 绿）。
- **求助句**：`โปรดช่วยฉันด้วย · 请帮帮我` + 播放图标，可朗读。
- **中国使领馆**：`中国驻泰国大使馆` + `+66 2 245 0088`（黄，mono）——以 `CountrySafetyData.embassy` 为准。
- **本地提示**（3 等分）：`电压 220V` / `饮水 建议瓶装水` / `小费 零钱即可`（映射 `voltage`/`water`/`tipping`）。
- **骗局提示**（`redBg` 圆角 10）：`⚠ 警惕「大皇宫今日关闭」骗局，官方不会在街头揽客`（来自 `scams[0]`）。

### 3.9 09 COUNTRY SELECT 国家选择（居中卡片）
- 遮罩 + 居中卡片（350 宽 `bgCard` 圆角 16 描边 `borderLight` padding 20，垂直 gap 14）：
  - GPS 高亮行（`greenBg` 圆角 10）：`GPS 定位成功 · 泰国 曼谷` + `GPS`（mono 10/700 绿）；
  - `选择目的地国家`（16/700）；
  - 国家网格 2 列 × 4 行（圆角 10 高 38，旗 emoji + 名称 13/600）：`泰国`（`accentBlue` 底深字，选中）/ `日本` `韩国` `越南` `新加坡` `马来西亚` `印尼` `老挝`（`bgCardLight`）；
  - 用户档案行（`bgCardLight` 圆角 10）：`🧳` 头像 28 圆 + `旅行者 · zh-CN` + `普通话 → 泰语`；
  - `确认并生成安全卡`（`accentBlue` 全宽高 44 深字）→ 生成 07 入卡栈。
- 复用 `SUPPORTED_COUNTRY_CODES` 渲染国家。

### 3.10 10 SWITCH PROMPT 位置变化提示（居中卡片）
- 遮罩 + 居中卡片（330 宽）：图标圈 44（`navigation` 蓝）｜`检测到位置变化`（16/700）｜`当前安全指南基于 泰国 · 曼谷。检测到你在 日本 · 东京，是否切换安全卡与语言？`（12 灰 lineHeight 1.6 居中）｜按钮行：`保持`（`bgCardLight`）/`切换`（`accentBlue` 深字）。

### 3.11 11 SESSION HISTORY 会话历史（抽屉）
- 遮罩 + 底部抽屉：抓握条 + `会话历史`（16/700）+ `✕`；副标题 `恢复历史快照 · 点按进入多轮追问`（11 灰）。
- 会话行（`bgCardLight` 圆角 10 padding 12）：标题 13/600 + `›`；元信息行 = 国家胶囊（`bgCard` 圆角 6，文字用国家色）+ mono 时间 10 + `N 条消息`。
- 示例数据（来自 `sessionStore`）：
  - `出租车按表计费`｜泰国 · 曼谷｜今天 09:12｜8 条消息
  - `地铁换乘求助`｜日本 · 东京｜昨天 21:40｜5 条消息
  - `退税单填写`｜泰国 · 清迈｜7月12日 15:03｜12 条消息
- 点行 → 恢复快照到对话流（`sessionStore.load` + `setChatTurns`）。

### 3.12 12 API LOG 日志监控（高抽屉）
- 抽屉：抓握条 + `API 日志`（16/700）+ `清空`（红 12）+ `✕`。
- 统计条（`#000` 圆角 10 三列）：`今日请求 128` / `成功率 96.8%` / `平均延迟 184ms`（mono 12/700 青）。
- 日志列表（`#000` 圆角 10，mono 10，行 = 时间灰 `[14:02:31]` + 方法青 `POST` + 路径白 + 状态色）：
  ```
  [14:02:31] POST /api/analyze    200 · 129ms
  [14:02:32] POST /api/translate  200 · 231ms
  [14:02:33] GET  /api/safety/TH  200 · 87ms
  [14:02:34] POST /api/tts        503 · retry   （红）
  [14:02:41] POST /api/tts        200 · 342ms
  ```
- 数据源 `apiLogger`（真实请求日志）。

### 3.13 13 ENGINE SETTINGS 引擎设置（抽屉）
- 抽屉：抓握条 + `识别引擎设置`（16/700）+ `✕`。
- **语音识别引擎**（行 = `bgCardLight` 圆角 10 padding 12：radio 18 圆 + 名称 13/600 + 描述 11 灰 + 徽章）：
  - `本地 Whisper` — `llama.rn · 离线可用` — 选中（radio 绿点 + 整行 `greenBg` + `LIVE` 绿徽章）
  - `OpenAI Whisper API` — `需配置 API Key`
  - `Google STT` — `在线 · 需网络`
- **API KEY**：`sk-••••••••1234`（mono 12）+ `编辑`（蓝）。来自 `SecureConfig`，**仅显示掩码**。
- **行为偏好**：`语音自动归档到笔记`（开关开，`accentGreen` 40×22 圆角 11 + 白色 knob 18）。
- `保存设置`（`accentBlue` 全宽高 44 深字）→ `modelManager` 持久化。

---

## 4. 交互链路（按图实现）

```
主流程：
01 对话页 ──📷──▶ 06 取景 ──单击SNAP──▶ 01 解读消息 ──▶ 01 表达卡消息 ──点击──▶ 02 全屏大字卡
   │ 🎙️语音→转录横幅→表达卡消息          │ 打字→追问/AI回复→表达卡消息      │ PLAY AUDIO / AI 解读
   ▼                                                                        ▼
03 卡栈页 ──点击任意卡──▶ 02 全屏大字卡                                    08 安全详情
04 笔记页（Tab）  05 更多页（Tab）──▶ 07 安全卡 / 11 会话历史 / 12 API日志 / 13 引擎设置
09 国家选择 ──GPS变化──▶ 10 位置提示
```

1. **首次启动**：`getPlaceContext()` 定位 → 09 国家选择（GPS 高亮）→ 确认 → `buildSafetyCard` 入卡栈；再启动 GPS 变化 → 10 切换提示。
2. **拍照**：01 输入栏 `📷` → 06 全屏取景 → **单击 SNAP**（V1 双击废弃）→ 拍照 → `compressImage` → 回 01 追加「处理中」解读消息 → `pluginManager.processImageSnapshot(photoUri, locationCtx)` → 完成（解读消息含照片缩略 + `AI 解读` 文本）→ 表达卡消息。
3. **语音**：01 `🎙️` 单击开始/停止（`NativeSpeech.start/stop`，事件驱动 `liveTranscript` 横幅）→ 停止后 `pluginManager.generateCardFromText` → 表达卡消息入流 + 系统提示 + `noteStore` 自动归档语音（VOICE 分类）。
4. **打字**：输入框 → 追加用户消息 → 追问（AI 文本回复）或表达沟通需求 → 表达卡消息 + 系统提示 `✅ 已生成表达卡`。
5. **卡片**：任何表达卡消息 / 03 卡栈卡片 → 02 全屏大字卡（TTS / `AI 解读` 进多轮 / 本地提示）。
6. **Tab**：`对话` 默认；`卡栈` 浏览管理（删除/清空）；`笔记`；`更多` → 安全/历史/日志/设置。

---

## 5. 代码实现要点（对接现有仓库）

### 5.1 消息模型扩展
`src/plugins/types.ts` 的 `ChatTurn` 扩展为 V2 消息类型（建议新增 `ChatMessage`，保持 `ChatTurn` 兼容追问会话）：
```ts
export interface ChatMessage {
  id: string;
  kind: 'user' | 'assistant' | 'card' | 'system';
  content?: string;            // 文本
  imageUri?: string;           // kind=assistant 解读消息的照片缩略
  card?: CardData;             // kind=card：直接渲染 ExprCard（共享卡栈数据源）
  createdAt: number;
}
```
表达卡消息携带 `CardData`（由 `scenarioToCard(ScenarioResult, location)` 生成），与卡栈 `expressionCards` 同源；删除/清空卡栈需同步移除对话流中的 `kind==='card'` 消息。

### 5.2 新增 / 改造组件（路径为仓库现有约定）
| 新组件 | 说明 |
|---|---|
| `src/components/ChatPage.tsx` | 对话流渲染器：按 `kind` 分发（用户气泡 / 解读消息 / ExprCard / AI 回复 / 系统提示 / 转录横幅）；`FlatList` 反向滚动 |
| `src/components/ChatInputBar.tsx` | 三模态输入栏（§2.3）；props：`onCamera`/`onMicToggle`/`onSend`/`isRecording` |
| `src/components/TabBar.tsx` | 四 Tab（§2.4）；props：`active` + `onChange` |
| `src/components/CardStackPage.tsx` | 卡栈 Tab 页（§3.3） |
| `src/components/MorePage.tsx` | 更多 Tab 页（§3.5） |
| 改造 `QuickNotesModal.tsx` | 全屏笔记 Tab 页（§3.4，去除 Modal 容器） |
| 改造 `CameraBackground.tsx` | 06 取景（§3.6）：SNAP 单击拍照发送 |
| 对齐 `FlashCardView.tsx` | 02 大字区 40–48pt、顶行 ✕/分类/进度、操作行样式 |
| 对齐 `buildSafetyCard()` | 07 样式 + 紧急拨打行（§3.7） |
| 对齐 `SafetyDetailModal` / `CountrySelectModal` / `CountrySwitchPromptModal` / `SessionHistoryModal` / `ApiLogModal` / `PluginSelectorModal` | 数据与样式对齐 §3.8–§3.13 |

### 5.3 现有能力复用（勿重复造轮子）
- `NativeSpeech`（`src/utils/NativeSpeech.ts`）：start/stop + 实时转写事件。
- `pluginManager.generateCardFromText(text, location)`（已存在）→ 打字/追问生成卡。
- `pluginManager.processImageSnapshot(uri, location)` → 拍照解读（返回 `ScenarioResult`）。
- `scenarioToCard(s, location)` → `CardData`；`addExpressionCard`（`App.tsx` 现有状态）保留为卡栈/对话共享数据源。
- `getCountrySafety(code)`（数据在 `src/packs/defaultPack.ts`）→ 安全卡/详情，**电话与求助句用真实值**。
- `apiLogger` / `sessionStore` / `noteStore` / `modelManager` / `SecureConfig` / `compressImage` / `getPlaceContext` / `locationContext`。
- 分享 / TTS：`FlashCardView` 现有 `expo-speech` + `react-native-view-shot` 逻辑保留。

### 5.4 布局与视觉约束
- 深色令牌统一走 `COLORS`/`FONT`；状态栏 `barStyle="light-content"`。
- 禁止 margin 做间距（用父容器 gap/padding）；底部 Safe 区留 34；输入栏+Tab 栏整体高 128 贴底。
- 大字文本用 `lineHeight` 1.3，固定宽度自动换行；不得猜文本尺寸（用 `maxWidth` + 自动高度）。

---

## 6. 完成验收清单（供实施 agent 自查 / reviewer 核对）

- [ ] `COLORS` 补齐 `userBubble` / `mask`；`LAYOUT` 补齐状态栏/输入栏/Tab 栏/Safe 区常量
- [ ] 4 个组件（StatusBar/ExprCard/InputBar/TabBar）落地，Tab 状态驱动，默认对话
- [ ] 13 屏全部可按 §3 规格渲染，四 Tab 在状态驱动下切换无残留
- [ ] 对话流消息类型分发完整（user/assistant+image/card/system/转录横幅）
- [ ] 表达卡（消息 & 卡栈）点击 → 全屏大字卡（40–48pt + TTS + 本地提示 + AI 解读）
- [ ] 卡栈与对话流共享同一 `CardData[]`，删除/清空双向同步
- [ ] SNAP 单击=拍照发送（V1 双击逻辑已移除）；🎙️ 单击开始/停止听写
- [ ] 语音归档笔记（VOICE 分类）；系统提示文案一致
- [ ] 安全数据（电话/求助句/骗局/使领馆）全部来自 `countrySafety` 包，无硬编码假数据
- [ ] API 日志/会话历史/引擎设置数据源对接真实 store
- [ ] 深色令牌全覆盖、无硬编码色值；iPhone 底部 Safe 区正常

---

## 7. 与 V1 的映射（迁移提醒）

| V1 | V2 |
|---|---|
| 01 主界面（5 键控制栏） | 拆分为 01 对话页 + InputBar + TabBar |
| 02 相机取景（双击 SNAP） | 06（单击 SNAP，对话 `📷` 调起） |
| 03 快照分析 Modal | 并入 01 对话流（解读消息） |
| 08 快速笔记 Modal | 04 笔记 Tab 页 |
| 09 工具箱 | 05 更多 Tab 页（入口列表，新增安全指南/切换国家） |
| 04/05/06/07/10/11/12 | 保留并样式对齐（07–13） |

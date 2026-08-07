# SceneGo 设计会话热启动手册 (Handoff)

> 用途: 下次会话快速恢复本设计协作的完整上下文。读此文件即可知道「在做什么、做到哪、文件在哪、怎么继续」。
> 更新: 每次协作会话结束/中断时更新此文件。
> 关联: 画布 `DESIGN-v2.1.pen`、改动日志 `design-changelog.md`、本目录各审阅/产品/审计/规范文件。

---

## 1. 会话身份与目标

- **项目**: SceneGo — 出境用户语言沟通 App(拍照/语音/文字 → 当地语言表达卡)。
- **画布**: `docs/reference/DESIGN-v2.1.pen`(Pencil,**11 屏**: 01-10 + 13 + 组件)。
- **设计基调**: 纯黑极简、无 emoji、禁技术术语、操作必反馈、紧急防误触、不造假数据。
- **协作方**: 主 agent(omp,能改画布)+ **claude**(w1:p5)+ **cmd/Command Code**(w1:p2)+ **pool**(w1:p4,Poolside)。⚠️ 仅主 agent 有 Pencil MCP 能改画布,其余 agent 只能产出文档规范,由主 agent 应用到画布。
- **交互通道**: `herdr pane send-text <id> "..."` + `sleep 1` + `send-keys enter`。cmd 不在 herdr agent 白名单,`pane run` 不可靠,只能 send-text。任务须自包含(agent 无会话上下文)。

---

## 2. 文件索引(全部在 `docs/reference/`)

| 文件 | 内容 | 来源 |
|---|---|---|
| **design-changelog.md** | 所有画布改动 SCN-01~26 的日志(改了什么/为什么/状态) | 主 agent |
| **design-session-handoff.md** | 本文件(热启动手册) | 主 agent |
| **transition-spec.md** | 转场语义规范(推入/模态/抽屉逐屏映射) | claude |
| **safety-drawer-spec.md** | SafetyDrawer 分层规范 ⚠️ 其中 L0 已弃用(SCN-19 保 08) | cmd |
| **pool-review-2026-08-08.md** | 全量审阅(一致性/无障碍/IA) | pool |
| **audit-claude-2026-08-08.md** / **audit-cmd-2026-08-08.md** | 文档 vs 画布漂移审计 | claude/cmd |
| **polish-claude/cmd/pool-2026-08-08.md** | 逐屏打磨规范(01-04 / 05-08 / 09·10·13) | 三 agent |
| review-claude.md | 主流程屏(01-05)单屏交互审阅 | claude |
| review-cmd.md | 工具屏(06-10)+ 全局组件单屏审阅 | cmd |
| product-claude.md | 产品层思考(主流程/语音/紧急/首体验) | claude |
| product-cmd.md | 产品层思考(安全/目的地/离线/导航) | cmd |
| audit-claude.md / audit-cmd.md | 按钮流程闭环审计(旧) | claude/cmd |
| state-a11y-claude.md | 状态与异常矩阵 + 无障碍 | claude |
| nav-consistency-cmd.md | 转场与导航流 + 一致性 | cmd |

---

## 3. 已完成改动(详见 changelog,摘要)

- **SCN-01~09**: 红线修复(emoji→国家码、技术文案→人话、拨号防误触、选中态、01 去 MicBtn/TriggerRow)。
- **SCN-10/11**: P0 决策(TabBar 3tab、安全号码按意图重排、SafetyFAB 组件、定位切换预览、离线取消)。
- **SCN-12/13**: 苛刻检查 P0 修复(05 返回/06 关闭/08 收起/术语/长按拨打)+ P1 一致性与无障碍。
- **SCN-14**: P2 一致性批(圆角体系 6/10/12/16/20、06 模态关闭、SafetyFAB 落地、提示色图例、TabBar 归 3tab)。⚠️ 修正多处 SCN 声称未落地。
- **SCN-15**: TabBar 三页面(11 对话/12 笔记/13 更多)落地 + 实例化 TabBar/SafetyFAB。
- **SCN-16**: 全面审计修复批(SCN-01~13 约 19 项声称未落地一次性修复)。
- **SCN-17**: 审阅收尾(10 删 Stats、06 更多国家入口、泰国勾选图标)。
- **SCN-18**: 转场/安全规范应用(三 agent 并行产出规范)+ 布局修正 + 新屏 14 安全 L0。
- **SCN-19**: **简化批(用户拍板)**——去 11/12/14,保 08;01 唯一触发首页;13 独立设置页(01 齿轮入口);撤 ExprCard 星标。画布 11 屏。
- **SCN-20/21**: 02 屏重分区(去主卡)→ 3 等宽卡 → 母语上/外语下。
- **SCN-22**: 02 屏按用户目标结构重建——**双等宽气泡 + 建议回复区**,聊天式错位(我右/对方左)。
- **SCN-23**: 逐屏打磨批(04 相机精简至取景器+快门、06 去 GPS 术语、10 更名安全信息+删检查更新、02 加换一句+BackBtn)。
- **SCN-24**: 打磨第二批(06 触控 44+Profile 降级、03 中文参照、07 ✕→返回、01 顶位置切换横幅→09)。
- **SCN-25**: 03 屏精简为**居中弹窗**(仅 BigText+Phonetic),点击表达卡变此大卡。
- **SCN-26**: 05 屏间距 + **识别结果定稿——仅母语单行、单个全宽 44px 行**(去外语/音标/播放/表头,用户手动改定稿)。

---

## 4. 画布现状(11 屏 + 组件)

**屏**: 01 IDLE(触发,唯一首页)/ 02 表达卡 / 03 全屏大字(居中弹窗) / 04 相机(极简取景器+快门) / 05 图片解读(母语单行识别) / 06 国家选择(模态) / 07 安全卡 / 08 安全详情(底部抽屉) / 09 位置切换(模态) / 10 安全信息·26 国 / 13 更多(设置聚合,独立页)。

**关键结构事实**:
- **无 TabBar 实例化**(组件保留未用;11/12/14 已删)。
- **SafetyFAB** 实例化于 01/02/05/13 右下角,点按**直接开 08 安全抽屉**(无 L0)。
- **01**: 中央 HoldMic 触发;InputBar(拍照/文字);顶部位置切换横幅(→09);右上齿轮(→13)。无 MicBtn/TriggerRow/离线徽章。
- **02**: 双等宽气泡(284/$bg-card-light/r16)聊天式错位——我方(「我的表达」+播放+换一句 / 泰语+音标+中文)、对方(「对方」+再听一遍 / 泰语+中文);建议回复区(好的，谢谢✓ / 太贵了，能便宜点吗, r18);Head 含 BackBtn。ExprCard 组件保留未用。
- **03**: 居中弹窗(mask + 360 圆角卡),仅 BigText(40px)+ Phonetic(18px)。
- **04**: StatusBar + Header(Brand/Cancel)+ 全屏取景器 + 快门。无任何引导/取景框/提示。
- **05**: PhotoCard(120)+ 识别结果(单个全宽 44px 行,仅母语,如「便利商店」)+ 短语区 + 输入/重拍。PhotoWrap/NameCard 间 16px 间隙。
- **06**: 模态;8 国卡(44px 触控,选中 2px 描边+勾选);旗标为国家码 +「途」头像;「更多国家 · 26 国」入口;Profile 弱化;GpsRow「定位成功 · 泰国 · 曼谷」。
- **07**: 安全卡;3 拨号块(191 遇到危险/1669 身体不适/1155 旅游纠纷,长按拨打);Head ✕ 已改返回(chevron-left)。
- **08**: 底部抽屉(紧急电话·长按拨打 + 求助句 + 使馆 + 本地提示);mask 右上 ✕ 关闭。
- **10**: 更名「安全信息 · 26 国」;无 Stats 工程细节;无检查更新按钮;Head 含 BackBtn(→13)。
- **13**: 设置聚合(目的地与语言→06、安全信息→10、关于与帮助、隐私)+ 版本号;SafetyFAB 常驻。

**组件**: StatusBar / ExprCard(未用) / InputBar / TabBar(未用) / **SafetyFAB**。

---

## 5. 待办(未做)

**画布侧可直接做的**:
- **AA-05**: 个别低对比组合(#999/#333)需调色(pool 审阅)——纯字号提升不够。
- 其余屏若需再打磨,参照 polish-claude/cmd/pool-2026-08-08.md。

**需产品拍板/运行时**:
- **转场规范(transition-spec.md)基于旧屏集**,含已删的 11/12/14,需按当前 11 屏更新映射表。
- 09 触发入口横幅已加(SCN-24),但「切换」异步反馈/失败回滚未定义(运行时)。
- 01 语音/识别**错误态**未定义(加载/失败 Toast,运行时)。
- 02 建议回复点按反馈(选中→发送,运行时)。
- 10 国家行点击行为(当前国→07,其他→下载详情)未定义。

**协作注意事项**:
- safety-drawer-spec.md 的 L0 分层已弃用(SCN-19 保 08),引用时注意。
- cmd 曾建议「对话」tab 命名再议——TabBar 已不用,此点作废。

---

## 6. 协作流程(热启动复用)

1. **定位 agent**: `herdr pane list` → claude=`w1:p5`,cmd=`w1:p2`,pool=`w1:p4`(id 以查询为准)。
2. **下发任务**: `herdr pane send-text <id> '<任务>'` + `sleep 1` + `send-keys enter`。任务自包含;长结果让 agent 写入文件(写 scenego 路径可能弹权限需批准)。
3. **画布操作**: 仅主 agent 用 Pencil MCP `execute`(写)/`get_app_state`(读)。⚠️ **画布改动需用户在 Pen.app Cmd+S 保存才落盘**,提交 git 前确认 .pen mtime 更新。
4. **记录改动**: 每改一画布项 → changelog 加 SCN-N + 同步本文件 §3/§4。
5. **分工经验**: 画布只能主 agent 改;claude/cmd/pool 并行产出规范文档(转场/安全/审阅/打磨),主 agent 应用。

---

## 7. 产品红线(所有设计必须遵守)

- 纯黑极简、无 emoji(图标用 lucide/文字)。
- 界面文案禁技术术语(SOP/VLM/Listen&Reply/Done-Flag/zh-CN/GPS 等)。
- 禁止上滑手势触发(iOS 冲突),用长按/点击/横滑。
- 操作必有反馈(按压态/loading/成功/失败)。
- 不造假数据,全真实管线。
- 紧急动作防误触(长按 0.6s + 进度环 + 震动)。

---

## 8. 关键经验(踩坑记录)

- **Pencil Update 重建 id**: 更新节点后 id 会变,用 Get 按 name 重新定位,勿硬编码 id。
- **全局 Get 会误匹配**: `Get(n=>...)` 无 path 匹配全文档(含组件),如 `BackBtn`/`Country`/`PlayPill` 同名会误插入/误改——务必用实例 path 或限定 name 精确匹配。
- **Icon 无 stroke**: 图标不支持 stroke/strokeWidth(仅 fill/effect)。
- **margin 非法**: pencil 无 margin 属性,用 padding/gap。
- **多行 execute 破坏 JSON**: execute input 需单行(新行破坏 JSON string)。
- **frame 默认 horizontal flex**: layout undefined 即水平 flex,x/y 被忽略;需显式 layout:'none' 或用 spacer 制造间距。
- **画布不自动落盘**: MCP 编辑在应用内存,需用户 Cmd+S 才写 .pen;提交前查 mtime。
- **herdr/Pen 拉起的 claude 不 source .zshrc**: 环境变量需写进 ~/.claude/settings.json(model/env),claude 默认回落 claude-opus-5 会烧 OpenRouter 额度。
- **cmd 的 pane run 不可靠**: 必须 send-text + send-keys enter。
- **对比度**: $text-muted 是主题变量,全局改风险高,靠提字号/局部调色。

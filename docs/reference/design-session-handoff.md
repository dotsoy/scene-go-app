# SceneGo 设计会话热启动手册 (Handoff)

> 用途: 下次会话快速恢复本设计协作的完整上下文。读此文件即可知道「在做什么、做到哪、文件在哪、怎么继续」。
> 更新: 每次协作会话结束/中断时更新此文件。
> 关联: 画布 `DESIGN-v2.1.pen`、改动日志 `design-changelog.md`、本目录各审阅/产品/审计文件。

---

## 1. 会话身份与目标

- **项目**: SceneGo — 出境用户语言沟通 App(拍照/语音/文字 → 当地语言表达卡)。
- **画布**: `docs/reference/DESIGN-v2.1.pen`(Pencil,13 屏 + 组件)。
- **本轮目标**: 完善产品的交互设计,并让 claude + cmd 协作产出审阅/产品/审计意见,已按优先级实施到画布。
- **协作方**: 主 agent(omp)+ claude(herdr pane `wA:p3`)+ cmd/Command Code(herdr pane `wA:p2`,npm 包 `command-code`)。
- **交互通道**: 因 cmd 不在 herdr agent 白名单(`agent_status: unknown`),只能用 `herdr pane send-text <id> "..."` + `send-keys enter`(先文本后回车两步法,`pane run` 对 cmd 不可靠)。见 skill `herdr-cmd-messaging`。

---

## 2. 文件索引(全部在 `docs/reference/`)

| 文件 | 内容 | 来源 |
|---|---|---|
| **design-changelog.md** | 所有画布改动 SCN-01~13 的日志(改了什么/为什么/状态) | 主 agent |
| **design-session-handoff.md** | 本文件(热启动手册) | 主 agent |
| review-claude.md | 主流程屏(01-05)单屏交互审阅 | claude |
| review-cmd.md | 工具屏(06-10)+ 全局组件单屏审阅 | cmd |
| product-claude.md | 产品层思考(主流程/语音/紧急/首体验) | claude |
| product-cmd.md | 产品层思考(安全/目的地/离线/导航) | cmd |
| audit-claude.md | 按钮流程闭环审计(主流程屏) | claude |
| audit-cmd.md | 按钮流程闭环审计(工具屏) | cmd |
| state-a11y-claude.md | 状态与异常矩阵 + 无障碍 | claude |
| nav-consistency-cmd.md | 转场与导航流 + 一致性 | cmd |

---

## 3. 已完成改动(详见 changelog,摘要)

- **SCN-01~09**: 红线修复(emoji→国家码、技术文案→人话、拨号防误触标注、选中态、01 屏去 MicBtn/TriggerRow)。
- **SCN-10/11**: P0 产品决策(TabBar 3 tab、安全号码按意图重排、SafetyFAB 组件、定位切换预览、离线模式取消)。
- **SCN-12**: 苛刻检查 P0 修复(05 返回、06 关闭、08 收起、术语统一、长按拨打、SafetyFAB 实例化)。
- **SCN-13**: P1 一致性与无障碍(术语、按钮圆角、触控目标、字号提升)。
- **SCN-14**: P2 一致性批次(圆角体系、06 模态关闭、SafetyFAB 落地、提示颜色图例、TabBar 组件归 3tab)。⚠️ 本批修正多处 SCN 声称未落地(SCN-13b/12b/11c+12f/10+11a)。
- **SCN-15**: TabBar 三页面落地——对话(触发+活动流, 屏11)、笔记(收藏, 屏12)、更多(设置聚合, 屏13),三屏实例化 TabBar + SafetyFAB。按 cmd/claude IA 建议 + 用户拍板。
- **SCN-16**: 全面审计修复批——SCN-01~13 约 19 项声称未落地,一次性修复(06 国家码/01 触发区与离线元素/07-08 长按拨打与意图/09 预览卡/10 日期与术语/05 BackBtn/02 WhoTag/ExprCard 换一句)。详见 changelog。
- **SCN-17**: 审阅收尾批——10 屏删 Stats 三格工程细节、06 屏加「更多国家 · 26 国」入口、泰国选中卡补勾选图标。详见 changelog。
- **SCN-18**: 转场/安全规范应用批——三 agent 并行产出规范(claude 转场/ cmd SafetyDrawer / pool 全量审阅)并应用到画布:三 TabBar 页布局修正(底部锚定)、11 时间线卡导航箭头、10 BackBtn、**新屏 14 安全 L0 快速层**、ExprCard 收藏星标。详见 changelog。
- **SCN-19**: 简化批(用户拍板)——去 11 对话/12 笔记/14 安全L0,保 08;01 恢复唯一触发首页,13 改独立设置页(01 齿轮入口),撤 ExprCard 星标。画布现 11 屏(01-10+13)。
- **SCN-20**: 02 屏重分区(用户拍板"去主卡,重新分区"+ review-claude 建议)——6 张等宽同级卡,来源区分(我=$bg-card+「我」徽标 / AI=$bg-card-light+右下边框),建议回复带选中态。ExprCard 组件保留为预留组件(02 不再使用实例)。

---

## 4. 画布现状(13 屏 + 组件)

**屏**: 01 IDLE(触发,唯一首页)/ 02 表达卡 / 03 全屏大字 / 04 相机 / 05 图片解读 / 06 国家选择 / 07 安全卡 / 08 安全详情 / 09 位置切换 / 10 离线状态 / 13 更多(设置聚合,独立页,01 右上齿轮进入)。

**关键结构事实**:
- 画布是「内容流」式,**无 TabBar 实例化**(TabBar 组件保留未用;SCN-15 的三 tab 页 11/12 与 14 已删,SCN-19)。01 为唯一触发首页。
- SafetyFAB 已实例化到 01/02/05/13 屏右下角,点按直接开 08 安全详情抽屉(无 L0 分层,SCN-19)。
- 07/08 安全页保留,08 是底部抽屉(mask 右上角 ✕ 关闭)。
- 01 屏已无 MicBtn(语音归中央 HoldMic)、无 TriggerRow(拍照/打字归 InputBar)、无离线徽章(离线模式取消)。
- 06 屏旗标为国家码 + 「途」头像;选中卡 2px 深色描边 + 勾选图标;含「更多国家 · 26 国」入口(画布示例 8 国)。
- 02 屏按目标结构(SCN-22): **双等宽气泡 + 建议回复区**——我方表达(「我的表达」+播放+换一句 / 泰语+音标+中文)与对方回话(「对方」+再听一遍 / 泰语+中文)均 284/$bg-card-light/r16 对等;建议回复(好的，谢谢✓ / 太贵了，能便宜点吗)。Head 含 BackBtn。ExprCard 组件保留未用。
- **SCN-23**: 逐屏打磨应用批(三 agent 规范)——04 相机精简至取景器+快门、06 去 GPS 术语、10 更名安全信息+删检查更新、02 加换一句+BackBtn。打磨规范见 polish-claude/cmd/pool-2026-08-08.md。
- **SCN-24**: 打磨第二批——06 触控 44+Profile 降级、03 大字下中文参照、07 ✕→返回、01 顶位置切换横幅(→09)。详见 changelog。
- **SCN-25**: 03 屏精简为**居中弹窗**(仅 BigText+Phonetic,删其余),点击表达卡变此大卡。
- 10 屏无 Stats 工程细节,仅留「安全信息已就绪」标题卡;Head 含 BackBtn 返回 13。
**组件**: StatusBar / ExprCard / InputBar / TabBar / **SafetyFAB**(全局安全悬浮)。

**关键结构事实**:
- 画布是「内容流」式,TabBar 组件已实例化到 11/12/13(对话/笔记/更多)三页;02/03/04/05/07/08 全屏任务态/沉浸态不加。
- SafetyFAB 已实例化到 01/02/05/11/12/13 屏右下角(全局安全入口)。
- 07/08 安全页保留,08 是底部抽屉(点按弹出,mask 右上角 ✕ 关闭,SCN-16c)。
- 01 屏已无 MicBtn(语音归中央 HoldMic)、无 TriggerRow(拍照/打字归 InputBar)、无离线徽章(离线模式取消)。
- 06 屏旗标为国家码 + 「途」头像;选中卡 2px 深色描边 + 勾选图标(SCN-16a/17c);含「更多国家 · 26 国」入口(SCN-17b,画布示例 8 国)。
- 10 屏无 Stats 工程细节(场景包版本/已下载/占用已删,SCN-17a),仅留「安全信息已就绪」标题卡。

---

## 5. 待办(未做)

**P2(✅ SCN-14 已落地)**: 圆角体系细调、06 模态定位、SAFETY 徽章(FAB)、提示颜色图例、TabBar 组件归 3tab。

**结构性缺口(待决/跟进)**:
- 转场语义规范(transition-spec.md)基于旧屏集(含 11/12/14),需按简化后屏集(01-10+13)更新映射表。
- **AA-05 待处理**: 个别 #999/#333 低对比组合,纯字号提升不够,需调色(pool 审阅)。
- **13 更多页入口**: 已加 01 右上齿轮(SGN-19c)进入;其余设置项(目的地/安全信息→06/10)行为待后续贯通。
- 09 位置切换触发入口画布未定义(cmd 建议顶部横幅触发 + 预览卡)。

**产品级未决**:
- 安全入口最终形态: SafetyFAB 已落地(SCN-14c),08 抽屉保留;claude 建议 SafetyDrawer L0/L1 分层。
- 离线模式已取消;cmd 建议 10 屏更名「安全信息」+ 删工程细节(占用MB/检查更新),入口归「更多」。
- cmd 提示:「对话」tab 命名偏双向聊天,实际承载"表达流",可再议「表达/首页」。

---

## 6. 协作流程(热启动复用)

1. **定位 agent**: `herdr pane list` → claude=`w1:p5`,cmd=`w1:p2`(⚠️ 2026-08-08 实测,旧文档 `wA:p3`/`wA:p2` 已失效;id 以查询为准)。
2. **下发任务**: `herdr pane send-text <id> '<任务>'` + `sleep 1` + `send-keys enter`。任务需自包含(agent 无会话上下文)。
3. **收集结果**: `herdr pane read <id>` 读输出;长结果让 agent 写入文件(它们在 /private/tmp,写 scenego 路径需批准权限)。
4. **记录改动**: 每改一个画布项 → changelog 加 SCN-N。
5. **画布操作**: 用 Pencil MCP `execute`(写)/`get_app_state`(读)。注意:Update 会重建节点 id,用 name 定位比硬编码 id 稳。

---

## 7. 产品红线(所有设计必须遵守)

- 纯黑极简、无 emoji(图标用 lucide/文字)。
- 界面文案禁技术术语(SOP/VLM/Listen&Reply/Done-Flag/zh-CN/GPS 等)。
- 禁止上滑手势触发(iOS 系统冲突),用长按/点击/横滑。
- 操作必有反馈(按压态/loading/成功/失败)。
- 不造假数据,全真实管线。
- 紧急动作防误触(长按 0.6s + 进度环 + 震动)。

---

## 8. 关键经验(踩坑记录)

- **Pencil Update 重建 id**: 更新节点后 id 会变,后续引用要用 Get 按 name 重新定位。
- **组件实例 descendants 是整体替换**: Update 实例时若只传部分覆盖,会丢其他覆盖(placeholder 曾丢失)。
- **cmd 的 pane run 不可靠**: 必须 send-text 再单独 send-keys enter。
- **herdr agent 白名单**: command-code/cmd 不在其中,不能用 `agent prompt`,走 `pane` 通道。
- **对比度/字号**: $text-muted 是主题变量,全局改风险高,靠提字号改善。
- **绝对定位裁剪**: 组件内 absolute 定位超出父容器会 partially clipped,需移到正确的父层。

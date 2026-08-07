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

---

## 4. 画布现状(13 屏 + 组件)

**屏**: 01 IDLE(触发)/ 02 表达卡 / 03 全屏大字 / 04 相机 / 05 图片解读 / 06 国家选择 / 07 安全卡 / 08 安全详情 / 09 位置切换 / 10 离线状态。
**组件**: StatusBar / ExprCard / InputBar / TabBar / **SafetyFAB**(全局安全悬浮)。

**关键结构事实**:
- 画布是「内容流」式,TabBar 是组件但**未实例化到任何屏**(无对话/笔记/更多页)。
- SafetyFAB 已实例化到 01/02/05 屏右下角。
- 07/08 安全页保留,08 是底部抽屉(点按弹出,✕ 收起)。
- 01 屏已无 MicBtn(语音归中央 HoldMic)、无 TriggerRow(拍照/打字归 InputBar)、无离线徽章(离线模式取消)。

---

## 5. 待办(未做)

**P2(低优先)**: 圆角体系细调、06 模态定位、SAFETY 徽章、提示颜色图例、TabBar 实际接入新页面。

**结构性缺口(cmd 指出,需用户拍板)**:
- TabBar 零接入 → 需先有「对话/笔记/更多」页面(未设计)。
- 转场语义规范(推入/模态/抽屉)未建立。
- 09 位置切换触发入口画布未定义(运行时逻辑)。

**产品级未决**:
- 安全入口最终形态(用户改过多次:tab→悬浮→删除→保留)。当前:SafetyFAB 悬浮 + 08 抽屉。
- 离线模式已取消(重度依赖在线,离线只保安全卡)。

---

## 6. 协作流程(热启动复用)

1. **定位 agent**: `herdr pane list` → claude=`wA:p3`,cmd=`wA:p2`(id 可能变,以查询为准)。
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

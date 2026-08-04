# 📍 ROADMAP.md · SceneGo 项目总览（SSOT）

> **docs/ 唯一入口文件。** 所有详细文档位于 [`reference/`](reference/) 子目录。

## ⚠️ 给所有 Agent 的声明（必读）

**本文件是 SceneGo 项目「完成状态」的唯一事实来源（Single Source of Truth）。**

1. **查状态**：任何 Agent 需要了解某个能力/模块做到哪一步，**只看本文件**，不要从 PRD / OPS / 代码注释推断。
2. **改状态**：能力状态发生变化时，**只改本文件**；其他文档**禁止重复维护状态**（它们引用本文件即可）。
3. **状态变化时**：更新本表 + 将过时过程文档移入 `reference/` 并标注 ARCHIVE- 前缀。
4. **状态图例**：⬜ 未开始 · 🔄 进行中 · 🔶 部分完成 · ✅ 已完成（含日期）。
5. **维护节奏**：每阶段达成 Definition of Done（验收通过）时更新，不设模糊的"推进中"。

---

## 文档导航（reference/ 子目录）

| 前缀 | 类别 | 文件 |
|---|---|---|
| `PRD-` | 产品需求 | `reference/PRD-01.md` |
| `STRAT-` | 产品战略 | `reference/STRAT-01.md` |
| `TECH-` | 技术架构 / 工程 | `reference/TECH-01.md`、`reference/TECH-02.md` |
| `OPS-` | 运营 / 合规 | `reference/OPS-01.md`、`reference/OPS-02.md` |
| `DESIGN-` | 设计规范 / 数据 / 草图 | `reference/DESIGN-01.md`、`reference/DESIGN-02.json`、`reference/scenego.pen`、`reference/DESIGN-v*.tldraw` |
| `SCREEN-` | UI 截图 | `reference/SCREEN-01-dialog.png` ~ `reference/SCREEN-13-engine-settings.png` |
| `ARCHIVE-` | 归档（不再活跃） | `reference/ARCHIVE-01.md`、`reference/ARCHIVE-02.md` |
| `DEPENDENCIES-` | 能力依赖关系 | `reference/DEPENDENCIES-01.md` |

**阅读顺序**：
- **新人/Agent**：本文件（进度总览）→ `reference/PRD-01.md` → `reference/STRAT-01.md` → `reference/TECH-01.md`
- **设计施工**：`reference/DESIGN-01.md` → `reference/DESIGN-02.json` → `reference/scenego.pen` → `reference/SCREEN-*.png`
- **运营规划**：`reference/OPS-01.md` → `reference/OPS-02.md`

---

## 一、NOW · 正在执行（当前迭代）

| 能力 | 状态 | 说明 | 关联文档 |
|---|---|---|---|
| 三输入触发（CAM / MIC / 文字） | ✅ 已实现 | 用户主动触发，App 不自动 | `PRD-01.md` |
| 插件管线（OCR → 匹配 → 动态卡） | ✅ 已实现 | 本地词库 + 云端 VLM 双源兜底 | `TECH-01.md` |
| 场景包体系（10 场景 / 26 国） | 🔶 部分完成 | 本地 + 接口已实现；远程下发 URL 待配置 | `TECH-01.md` |
| 位置上下文（一次性前台定位） | ✅ 已实现 | 5 分钟缓存，不监听不自动弹卡 | `TECH-01.md` |
| 会话历史 / 快速笔记 / 分享导出 | ✅ 已实现 | AsyncStorage 本地持久化 | `TECH-01.md` |
| AI 网关（URL 可配，默认 OpenRouter） | 🔶 部分完成 | 客户端完成；Supabase 代理待部署 | `TECH-01.md` |
| 合规三件套（隐私/协议/数据清单） | ✅ 2026-08-03 | App 内页 + 文档 | `OPS-02.md` |
| V2 UI（对话优先四 Tab 架构） | ✅ 已实现 | 2026-08-03 分段提交 | `DESIGN-01.md` |

## 二、NEXT · 中期规划（下阶段要做）

| 能力 | 状态 | 说明 | 关联文档 |
|---|---|---|---|
| AI 代理层（Edge Function） | ⬜ | 客户端已封装，服务端待部署；上架前置门槛 | `OPS-01.md` |
| 上架链路（eas build/submit） | ⬜ | TestFlight 内测分发 | `OPS-01.md` |
| 监控补全（崩溃/性能埋点） | ⬜ | 商店报告 + 自建埋点 | `OPS-01.md` |
| 匿名账号体系 | ⬜ | 设备 ID → 云端用户，token 鉴权 | `OPS-01.md` |
| 订阅商业化（IAP） | ⬜ | Day Pass / Weekly Pro + receipt 验证 | `OPS-01.md` |
| 行为分析埋点 | ⬜ | WSSE、场景识别精度、AI 成本 | `OPS-01.md` |
| Android 语音 | ⬜ | 当前 iOS only（SFSpeechRecognizer） | `OPS-01.md` |

## 三、LATER · 远期规划（未来可能）

| 能力 | 状态 | 说明 |
|---|---|---|
| 4 大实用度突破（双向沟通/菜单解读/场景感知/连贯步骤卡） | 未实现 | PRD §3.1 痛点突破，设计草图 v2.1 |
| 城市内容 SOP（曼谷 → 东京 → 首尔/新加坡） | ⬜ | 每城一套：打车/餐饮/退税/地铁/SOS + 本地规则 |
| 分享邀请 / 落地页 + ASO / 免费付费分层 | ⬜ | P2 增长运营 |
| eSIM 场景返佣 / UGC / 20+ 语言 / 离线包下载 | ⬜ | P3 生态拓展 |

---

## 里程碑

| 里程碑 | 出口条件 | 当前状态 |
|---|---|---|
| M1 TestFlight 小范围内测 | P0（AI 代理 + 上架链路 + 监控）完成 | ⬜ |
| M2 公开上架 + 订阅 + 场景包远程运营 | P1 全部完成 | ⬜ |
| M3 增长动作可执行 | P2-9/10/11 完成 | ⬜ |
| M4 生态与多语言 | P3 按优先级推进 | ⬜ |

## 依赖关系

> 依赖结构见 [`reference/DEPENDENCIES-01.md`](reference/DEPENDENCIES-01.md)，本文件不重复维护。
> 关键前置：AI 代理 → 订阅/分析；场景包 → 城市 SOP；匿名账号 → 订阅/分析。

---

## 版本关系

- v1 概念 → v2 功能实现（当前代码基线）→ v2.1 蓝图迭代（PRD §3.1/§3.2 落地）→ v3 构思（未实现，草稿已清理）

## 维护示例（给 Agent 的操作范式）

```
场景：场景包远程下发 URL 配置完成
动作：
  1. 本表 NOW 行「场景包体系」状态 🔶 → ✅（日期）
  2. 检查 TECH-01 / OPS-01 是否有重复状态描述 → 若有，改为引用本文件
  3. 若有被替代的过程文档 → git mv 至 reference/ 并标注 ARCHIVE- 前缀
  4. 提交信息遵循 Conventional Commits：docs(roadmap): 场景包远程下发完成
```

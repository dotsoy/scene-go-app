# SceneGo 文档索引

文档按**文件名类别前缀**区分归属，全部平铺在本目录。

## 命名规则

| 前缀 | 类别 | 示例 |
|---|---|---|
| `PRD-` | 产品需求 | `PRD-01.md` |
| `STRAT-` | 产品战略 | `STRAT-01.md` |
| `TECH-` | 技术架构 / 工程 | `TECH-01.md`、`TECH-02.md` |
| `OPS-` | 运营 / 合规 | `OPS-01.md`、`OPS-02.md` |
| `DESIGN-` | 设计规范 / 数据 / 草图 | `DESIGN-01.md`、`DESIGN-pen.pen`、`DESIGN-v2功能实现.tldraw` |
| `SCREEN-` | UI 截图 | `SCREEN-01-dialog.png` |
| `ARCHIVE-` | 归档（不再活跃） | `ARCHIVE-01.md`、`ARCHIVE-02.md` |

每类独立从 01 编号，新增文件不重排其他序号。

## 正式文档

| 文件 | 定位 |
|---|---|
| `PRD-01.md` | **产品需求**：功能规格 + 4 大痛点突破（§3.1）+ ScenarioFlow 抽象与界面红线（§3.2） |
| `STRAT-01.md` | **产品战略**：市场细分、价值主张、4 大突破战略、纯沟通边界 |
| `TECH-01.md` | **系统架构**：client-only、插件管线、数据存储、云端边界 |
| `TECH-02.md` | **Expo 工程管理**：构建/运行约定 |
| `OPS-01.md` | **运营路线图**：P0 安全网 → P1 运营闭环 → P2 增长 → P3 生态 |
| `OPS-02.md` | **合规三件套**：隐私政策/用户协议/数据清单 |
| `DESIGN-01.md` | **设计规范（当前版）**：Design Tokens、组件、屏幕规格 |
| `DESIGN-02.json` | **UI 规范数据**：Pen.app 生成，与 DESIGN-01 配套 |
| `ARCHIVE-01.md` | 设计规范 V1（归档，已被 DESIGN-01 取代） |
| `ARCHIVE-02.md` | V2 施工输入稿（归档，实现完成） |

## 设计草图（tldraw / pen）

| 文件 | 版本 | 内容 |
|---|---|---|
| `DESIGN-pen.pen` | v2（持续迭代） | **主设计稿**：13 屏高保真 UI（Pen.app 源文件） |
| `DESIGN-v1概念草图.tldraw` | v1 | 4 大突破功能早期概念架构 |
| `DESIGN-v2功能实现.tldraw` | v2 | 功能实现草图（四 Tab 结构 + 组件关系） |
| `DESIGN-v2.1蓝图迭代.tldraw` | v2.1 | V2.1 功能实现想法（ScenarioFlow 引擎 + 4 大突破 + 幂等分层） |

> 注：v3 构思草图（双向沟通闭环 / 菜单聚合 / 场景监听层 / 会话链 Undo）曾在 `~/Documents` 草拟，未达到预期已删除，未入仓库。

## UI 截图

`SCREEN-01-dialog.png` ~ `SCREEN-13-engine-settings.png`：13 屏界面预览（对话页 → 引擎设置）。

## 版本关系

- v1 概念 → v2 功能实现（当前代码基线）→ v2.1 蓝图迭代（PRD §3.1/§3.2 落地）→ v3 构思（未实现，草稿已清理）

## 阅读顺序建议

- **新人/评审**：`PRD-01.md` → `STRAT-01.md` → `TECH-01.md`
- **设计施工**：`DESIGN-01.md` → `DESIGN-02.json` → `DESIGN-pen.pen` → `SCREEN-*.png`
- **运营规划**：`OPS-01.md` → `OPS-02.md`

# SceneGo 文档索引

文档按**文件名**区分归属，全部平铺在本目录。文件名规则：数字前缀 `01-`~`10-` 为正式文档（按生命周期排序），`screen-` 为 UI 截图，`v*` 为设计草图。

## 正式文档

| 文件 | 定位 |
|---|---|
| `01-PRD.md` | **产品需求**：功能规格 + 4 大痛点突破（§3.1）+ ScenarioFlow 抽象与界面红线（§3.2） |
| `02-PRODUCT_STRATEGY.md` | **产品战略**：市场细分、价值主张、4 大突破战略、纯沟通边界 |
| `03-ARCHITECTURE.md` | **系统架构**：client-only、插件管线、数据存储、云端边界 |
| `04-EXPO_PROJECT_MANAGEMENT.md` | **Expo 工程管理**：构建/运行约定 |
| `05-OPERATIONS_ROADMAP.md` | **运营路线图**：P0 安全网 → P1 运营闭环 → P2 增长 → P3 生态 |
| `06-COMPLIANCE.md` | **合规三件套**：隐私政策/用户协议/数据清单 |
| `07-UI_DESIGN_PROMPT_V2.md` | **设计规范（当前版）**：Design Tokens、组件、屏幕规格 |
| `08-UI_SPEC_DATA.json` | **UI 规范数据**：Pen.app 生成，与 07 配套 |
| `09-UI_DESIGN_PROMPT.md` | 设计规范 V1（归档，已被 V2 取代） |
| `10-UI_IMPLEMENTATION_PROMPT_V2.md` | V2 施工输入稿（归档，实现完成） |

## 设计草图（tldraw / pen）

| 文件 | 版本 | 内容 |
|---|---|---|
| `scenego.pen` | v2（持续迭代） | **主设计稿**：13 屏高保真 UI（Pen.app 源文件） |
| `v1-概念草图.tldraw` | v1 | 4 大突破功能早期概念架构 |
| `v2-功能实现.tldraw` | v2 | 功能实现草图（四 Tab 结构 + 组件关系） |
| `v2.1-蓝图迭代.tldraw` | v2.1 | V2.1 功能实现想法（ScenarioFlow 引擎 + 4 大突破 + 幂等分层） |

> 注：v3 构思草图（双向沟通闭环 / 菜单聚合 / 场景监听层 / 会话链 Undo）曾在 `~/Documents` 草拟，未达到预期已删除，未入仓库。

## UI 截图

`screen-01-dialog.png` ~ `screen-13-engine-settings.png`：13 屏界面预览（对话页 → 引擎设置）。

## 版本关系

- v1 概念 → v2 功能实现（当前代码基线）→ v2.1 蓝图迭代（PRD §3.1/§3.2 落地）→ v3 构思（未实现，草稿已清理）

## 阅读顺序建议

- **新人/评审**：`01-PRD.md` → `02-PRODUCT_STRATEGY.md` → `03-ARCHITECTURE.md`
- **设计施工**：`07-UI_DESIGN_PROMPT_V2.md` → `08-UI_SPEC_DATA.json` → `scenego.pen` → `screen-*.png`
- **运营规划**：`05-OPERATIONS_ROADMAP.md` → `06-COMPLIANCE.md`

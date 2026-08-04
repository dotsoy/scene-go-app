# models/ 设计草图索引

本目录存放 SceneGo 的设计草图与原型文件，按版本递进组织。

| 文件 | 版本 | 内容 | 工具 |
|---|---|---|---|
| `scenego.pen` | v2（持续迭代） | **主设计稿**：13 屏高保真 UI（Pen.app 源文件，含 StatusBar/ExprCard/InputBar 等组件帧） | Pen.app |
| `v1-概念草图.tldraw` | v1 | 4 大突破功能早期概念架构（实用度突破方案） | tldraw |
| `v2-功能实现.tldraw` | v2 | 功能实现草图（四 Tab 结构 + 组件关系） | tldraw |
| `v2.1-蓝图迭代.tldraw` | v2.1 | V2.1 功能实现想法（ScenarioFlow 引擎 + 4 大突破 + 幂等分层） | tldraw |
| `v3-构思草图.tldraw` | v3 | V3 核心构思（双向沟通闭环 / 菜单聚合 / 场景监听层 / 会话链 Undo） | tldraw |

## 使用说明

- **查看**：tldraw Desktop 打开 `.tldraw`；Pen.app 打开 `.pen`
- **版本关系**：
  - v1 概念 → v2 功能实现（当前代码基线）→ v2.1 蓝图迭代（PRD §3.1/§3.2）→ v3 构思（未实现）
- **配套文档**：功能需求见 `../PRD.md`，战略见 `../PRODUCT_STRATEGY.md`

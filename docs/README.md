# SceneGo 文档索引

按产品生命周期组织的文档库。每个文件一句话定位，方便快速导航。

## 目录结构

```
docs/
├── README.md                ← 本索引
├── 01-product/              # 产品层（长期权威）
│   ├── PRD.md               # 产品需求文档：功能规格 + 痛点突破（§3.1）+ ScenarioFlow 抽象（§3.2）
│   └── PRODUCT_STRATEGY.md  # 战略定位：市场细分、价值主张、4 大突破战略、纯沟通边界
├── 02-architecture/         # 技术层（长期权威）
│   ├── ARCHITECTURE.md      # 系统架构：client-only、插件管线、数据存储、云端边界
│   └── EXPO_PROJECT_MANAGEMENT.md  # Expo 工程管理：构建/运行约定
├── 03-operations/           # 运营层（长期规划）
│   ├── OPERATIONS_ROADMAP.md  # 运营路线图：P0 安全网 → P1 运营闭环 → P2 增长 → P3 生态
│   └── COMPLIANCE.md        # 合规三件套：隐私政策/用户协议/数据清单
├── 04-design/               # 设计层（当前迭代）
│   ├── UI_DESIGN_PROMPT_V2.md  # V2 设计规范（当前版）：Design Tokens、组件、屏幕规格
│   ├── UI_SPEC_DATA.json    # UI 规范数据（Pen.app 生成，与 UI_DESIGN_PROMPT_V2.md 配套）
│   ├── models/              # 设计草图（tldraw/pen，按版本递进，见 models/README.md）
│   └── screens/             # UI 截图（01-dialog → 13-engine-settings）
├── 05-archive/              # 归档（不再活跃，留档追溯）
│   ├── UI_DESIGN_PROMPT.md  # V1 设计规范（已被 V2 取代）
│   └── UI_IMPLEMENTATION_PROMPT_V2.md  # V2 施工输入稿（实现完成，归档）
└── scenego.pen             # [已移至 models/] 主设计稿源文件
```

## 版本关系

| 版本 | 内容 | 位置 |
|---|---|---|
| v1 | 概念草图 | `04-design/models/实用度突破方案架构图.tldraw` |
| v2 | 功能实现草图（当前代码基线） | `04-design/models/v2-功能实现.tldraw` |
| v2.1 | 蓝图迭代（PRD §3.1/§3.2 落地） | `04-design/models/v2.1-蓝图迭代.tldraw` |
| v3 | 构思草图（未实现，草稿已清理） | — |

## 阅读顺序建议

- **新人/评审**：`01-product/PRD.md` → `01-product/PRODUCT_STRATEGY.md` → `02-architecture/ARCHITECTURE.md`
- **设计施工**：`04-design/UI_DESIGN_PROMPT_V2.md` → `04-design/models/` → `04-design/screens/`
- **运营规划**：`03-operations/OPERATIONS_ROADMAP.md` → `03-operations/COMPLIANCE.md`

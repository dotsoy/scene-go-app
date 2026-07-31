# SceneGo (境随心动) — 异国实时场景翻译与表达 App

> **Anywhere you are, instantly understood.**
> 面向出海与异国出行场景的实时翻译、零搜索大字沟通卡与上下文服务引擎。

---

## 📌 项目简介 (Project Overview)

SceneGo 是一款专门面向出海（异国出行）场景的智能工具 App。不同于传统的静态翻译软件，SceneGo 采用 **“零搜索 / Zero-Search”** 理念，通过硬件传感器与 LBS 围栏自动感知用户当前场景（机场打车、餐厅点餐、地铁换乘、退税计费等），动态调出大字沟通卡、双向语音同传及本地规避防坑指南。

---

## 📁 目录结构 (Project Structure)

```text
scenego/
├── README.md                   # 项目总览与启动指南
├── requirements.txt             # Python 依赖包
├── docs/
│   ├── PRODUCT_STRATEGY.md      # 产品战略画布 (Product Strategy Canvas)
│   ├── PRD.md                   # 产品需求文档 (PRD & MVP Roadmap)
│   ├── ARCHITECTURE.md          # 核心系统架构与感知引擎设计
│   └── EXPO_PROJECT_MANAGEMENT.md # Expo (React Native) 项目管理与 Sprint 规划
└── src/
    ├── __init__.py
    └── scene_engine.py          # 核心实时场景感知与翻译渲染引擎
```

---

## 🚀 快速启动 (Quick Start)

### 1. 安装依赖
```bash
cd /Users/tongqing/Personal/scenego
pip install -r requirements.txt
```

### 2. 运行场景翻译引擎测试
```bash
python3 src/scene_engine.py
```

---

## 📄 文档索引 (Documentation Index)

- 📘 [产品战略文档 (docs/PRODUCT_STRATEGY.md)](docs/PRODUCT_STRATEGY.md)
- 📙 [产品需求文档 (docs/PRD.md)](docs/PRD.md)
- 📗 [系统架构说明 (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- 📕 [Expo 项目管理与落地方案 (docs/EXPO_PROJECT_MANAGEMENT.md)](docs/EXPO_PROJECT_MANAGEMENT.md)

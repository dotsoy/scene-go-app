# System Architecture — SceneGo

## 1. 架构总览 (System Architecture)

```mermaid
flowchart TD
    subgraph Client [App 端侧 (Mobile Client)]
        Sensor[LBS / GPS / 加速度 / 传感器] --> SenseEngine[端侧感知模块 Sense Engine]
        UI[动态卡片 UI / 大字闪示] <--> StateMgr[状态管理器]
    end

    subgraph Cloud [云端核心服务]
        SenseEngine -->|地理位置与状态上报| ContextServer[场景推理与翻译服务器]
        ContextServer -->|提取场景词汇与规则| RuleEngine[离线规则与词汇引擎]
        ContextServer -->|下发场景表达卡与规则| StateMgr
    end
```

---

## 2. “ Sense -> Infer -> Render ” 闭环说明

1. **Sense (感知)**：
   - App 后台利用低功耗地理围栏 (Geofence) 与加速度传感器，判断用户当前处于机场、出租车排队区、餐厅还是地铁站。
2. **Infer (推理)**：
   - 场景推理服务器结合环境数据（位置、时间、速度），自动匹配当前最精准的场景表达卡与本地沟通模板。
3. **Render (渲染)**：
   - App 界面以 0.1 秒延时切出全屏/半屏高对比度大字闪示卡，并配置本地语音朗读能力。

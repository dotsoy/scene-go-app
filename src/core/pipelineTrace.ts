/**
 * 管线实时 trace（测试反馈用）：记录"定位 → 场景推理 → 推荐输出 → 成卡"每一站，
 * 由 __DEV__ 悬浮面板订阅展示；生产构建不渲染面板，存储开销可忽略。
 */
import { createStore } from 'zustand/vanilla';
import { PlaceContext } from '../utils/locationContext';
import { SceneInference, SceneKey } from './sceneInference';

/** 一次成卡链路（输入 → 引擎路径 → 卡关键字段） */
export interface CardTrace {
  at: number;
  input: string;
  path: 'sop' | 'vlm' | 'capsule' | 'none';
  category: string;
  targetText: string;
  steps: number;
  /** VLM 菜单摘要（如 signature=2/dishes=5） */
  menu?: string;
}

interface PipelineTraceState {
  place: PlaceContext | null;
  scene: SceneInference | null;
  /** 推荐输出（胶囊 key 列表） */
  capsules: string[];
  traces: CardTrace[];
  /** 定位/推理站写入（scene/capsules 由 App 计算后一并提交） */
  setScene: (place: PlaceContext | null, scene: SceneInference | null, capsules: string[]) => void;
  pushTrace: (t: CardTrace) => void;
  clearTraces: () => void;
}

const MAX_TRACES = 20;

export const pipelineTraceStore = createStore<PipelineTraceState>()((set) => ({
  place: null,
  scene: null,
  capsules: [],
  traces: [],
  setScene: (place, scene, capsules) => set({ place, scene, capsules }),
  pushTrace: (t) =>
    set((s) => ({ traces: [t, ...s.traces].slice(0, MAX_TRACES) })),
  clearTraces: () => set({ traces: [] }),
}));

export type { SceneKey };

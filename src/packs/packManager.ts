/**
 * 场景包管理器：版本化内容包的加载、缓存与远程下发。
 *
 * 加载优先级：远程包（运营下发）→ 本地缓存（上次成功下载）→ 内嵌 DEFAULT_PACK。
 * 远程 URL 未配置时保持纯本地模式（当前阶段），运营后台就绪后仅需填入 URL。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PACK } from './defaultPack';
import { ScenePack } from './types';

const STORAGE_KEY = '@scenego/scene-pack';
/** 远程场景包地址：运营后台就绪后配置（如 Supabase Storage 的 JSON 直链）；留空 = 纯本地包 */
const REMOTE_PACK_URL = '';

let currentPack: ScenePack = DEFAULT_PACK;

export function getPack(): ScenePack {
  return currentPack;
}

/** 结构校验：拒绝不合法/被篡改的包（宽松字段校验，schemaVersion 递增时在此做迁移分支） */
function isValidPack(v: unknown): v is ScenePack {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.schemaVersion === 'number' &&
    typeof p.version === 'string' &&
    typeof p.updatedAt === 'string' &&
    Array.isArray(p.scenes) &&
    Array.isArray(p.countries)
  );
}

async function loadCached(): Promise<ScenePack | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidPack(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 启动初始化：先应用本地缓存（离线可用、避免白屏等待），再异步刷新远程。
 * 远程未配置/失败时静默保持当前包。
 */
export async function initPack(): Promise<void> {
  const cached = await loadCached();
  if (cached) currentPack = cached;
  await refreshPack();
}

/**
 * 远程刷新：下载 → 校验 → 应用并缓存。失败回退（缓存/默认包），不中断调用方。
 * 显式传 url 可绕过默认配置（如设置页手动更新）。
 */
export async function refreshPack(url: string = REMOTE_PACK_URL): Promise<ScenePack> {
  if (!url) return currentPack;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: unknown = await res.json();
    if (!isValidPack(json)) throw new Error('场景包结构校验失败');
    currentPack = json;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(json));
  } catch (err) {
    console.warn('[ScenePack] 远程刷新失败，沿用本地包:', err);
  }
  return currentPack;
}

/**
 * 一次性位置上下文（非监听）：分析时获取当前位置并逆地理编码为地名文本，
 * 注入 VLM 请求作为语种/场景判断上下文。5 分钟缓存，权限被拒则返回 null（分析照常进行）。
 */
import * as Location from 'expo-location';

const CACHE_MS = 5 * 60 * 1000;

let cached: { text: string; at: number } | null = null;

export async function getLocationContext(): Promise<string | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.text;
  }
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      return null; // 未授权：分析不带位置，照常进行
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;
    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = geo[0];
    // 地名优先：城市, 国家；解析失败退回经纬度
    const text =
      place && (place.city || place.region || place.country)
        ? [place.city, place.region, place.country].filter(Boolean).join(', ')
        : `(${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
    cached = { text, at: Date.now() };
    return text;
  } catch {
    return null;
  }
}

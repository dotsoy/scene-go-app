/**
 * 一次性位置上下文（非监听）：分析时获取当前位置并逆地理编码，返回结构化地点。
 * 5 分钟缓存；权限被拒或失败返回 null（分析照常进行）。
 */
import * as Location from 'expo-location';

const CACHE_MS = 5 * 60 * 1000;

/** 结构化位置（国家选择/位置卡用） */
export interface PlaceContext {
  countryCode: string | null; // ISO 3166-1 alpha-2，如 TH
  country: string | null;     // 设备语言下的国家名
  city: string | null;
  region: string | null;
  timezone: string | null;
  lat: number;
  lng: number;
}

let cached: { place: PlaceContext; at: number } | null = null;

async function resolvePlace(): Promise<PlaceContext | null> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      return null; // 未授权：返回空位置
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;
    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place: Partial<Location.LocationGeocodedAddress> = geo[0] ?? {};
    return {
      countryCode: place.isoCountryCode ?? null,
      country: place.country ?? null,
      city: place.city ?? null,
      region: place.region ?? null,
      timezone: place.timezone ?? null,
      lat: latitude,
      lng: longitude,
    };
  } catch {
    return null;
  }
}

export async function getPlaceContext(force = false): Promise<PlaceContext | null> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) {
    return cached.place;
  }
  const place = await resolvePlace();
  if (place) {
    cached = { place, at: Date.now() };
  }
  return place;
}

/** 文本形式位置上下文（VLM 提示用）："曼谷, 泰国"；解析失败退回经纬度 */
export async function getLocationContext(): Promise<string | null> {
  const place = await getPlaceContext();
  if (!place) return null;
  const name =
    [place.city, place.region, place.country].filter(Boolean).join(', ') ||
    `(${place.lat.toFixed(3)}, ${place.lng.toFixed(3)})`;
  return name;
}

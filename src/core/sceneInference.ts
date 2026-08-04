/**
 * GPS 场景推理：由真实定位（PlaceContext）推断当前场景（v1 仅机场）。
 * 判定策略：
 *   1. 坐标距离：内置机场表 + haversine 距离 < AIRPORT_RADIUS_KM 即命中（逆地理编码只给区县名，不含 airport 字样，必须用坐标）；
 *   2. 地名关键词兜底：place 字符串含机场关键词（少数逆地理结果直接带 airport/机场 字样）。
 * 纯模块（无 RN 依赖），可被自检脚本直接测试。
 */

/** 推理输入：与 utils/locationContext.PlaceContext 结构兼容（不 import 以保持零依赖） */
export interface ScenePlaceInput {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number;
  lng: number;
}

export type SceneKey = 'airport';

export interface SceneInference {
  key: SceneKey;
  /** 命中依据（面板展示"为什么"）：如「距素万那普机场 3.2km」或「地名含 airport」 */
  matched: string;
  distanceKm?: number;
  /** 场景相关目的地（机场场景 = 命中的机场，供打车卡目的地槽位） */
  dest?: { zh: string; en: string };
}

/** 机场表（经纬度中心点；扩展新场景/新机场即加条目，规则表驱动） */
export const AIRPORTS: { code: string; zh: string; en: string; lat: number; lng: number }[] = [
  { code: 'BKK', zh: '素万那普机场', en: 'Suvarnabhumi Airport', lat: 13.69, lng: 100.7501 },
  { code: 'DMK', zh: '廊曼机场', en: 'Don Mueang Airport', lat: 13.9126, lng: 100.6066 },
  { code: 'NRT', zh: '成田机场', en: 'Narita Airport', lat: 35.772, lng: 140.3929 },
  { code: 'HND', zh: '羽田机场', en: 'Haneda Airport', lat: 35.5494, lng: 139.7798 },
  { code: 'KIX', zh: '关西机场', en: 'Kansai Airport', lat: 34.4347, lng: 135.2328 },
  { code: 'ICN', zh: '仁川机场', en: 'Incheon Airport', lat: 37.4602, lng: 126.4407 },
  { code: 'SIN', zh: '樟宜机场', en: 'Changi Airport', lat: 1.3644, lng: 103.9915 },
  { code: 'TPE', zh: '桃园机场', en: 'Taoyuan Airport', lat: 25.0777, lng: 121.2328 },
  { code: 'HKG', zh: '香港机场', en: 'Hong Kong Airport', lat: 22.308, lng: 113.9185 },
  { code: 'KUL', zh: '吉隆坡机场', en: 'Kuala Lumpur Airport', lat: 2.7456, lng: 101.7099 },
  { code: 'SGN', zh: '新山一机场', en: 'Tan Son Nhat Airport', lat: 10.8188, lng: 106.652 },
  { code: 'SYD', zh: '悉尼机场', en: 'Sydney Airport', lat: -33.9399, lng: 151.1753 },
];

/** 机场场景判定半径（km） */
export const AIRPORT_RADIUS_KM = 10;

/** 地名关键词兜底（逆地理结果直接含这些字样时命中机场场景） */
const AIRPORT_NAME_KEYWORDS = ['airport', '机场', 'สนามบิน', 'sân bay'];

/** haversine 距离（km） */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 真实定位 → 场景推理；无定位 / 未命中 → null（胶囊条不显示） */
export function inferSceneFromPlace(place: ScenePlaceInput | null): SceneInference | null {
  if (!place) return null;

  // 1. 坐标距离优先：机场表内最近机场在阈值内即命中
  if (typeof place.lat === 'number' && typeof place.lng === 'number' && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
    let nearest: (typeof AIRPORTS)[number] | null = null;
    let nearestKm = Infinity;
    for (const ap of AIRPORTS) {
      const km = haversineKm(place.lat, place.lng, ap.lat, ap.lng);
      if (km < nearestKm) {
        nearest = ap;
        nearestKm = km;
      }
    }
    if (nearest && nearestKm <= AIRPORT_RADIUS_KM) {
      return {
        key: 'airport',
        matched: `距${nearest.en} ${nearestKm.toFixed(1)}km（阈值 ${AIRPORT_RADIUS_KM}km）`,
        distanceKm: nearestKm,
        dest: { zh: nearest.zh, en: nearest.en },
      };
    }
  }

  // 2. 地名关键词兜底
  const joined = [place.city, place.region, place.country].filter(Boolean).join(' ').toLowerCase();
  const hit = AIRPORT_NAME_KEYWORDS.find((k) => joined.includes(k));
  if (hit) {
    return { key: 'airport', matched: `地名含 "${hit}"` };
  }

  return null;
}

/**
 * 场景地理围栏定义与匹配（纯逻辑，无 expo 依赖，可独立单测）
 *
 * v1 覆盖范围：东南亚/东亚主要机场（出海审计优先级：机场围栏 > 地铁站 > 餐厅 > 退税柜台）。
 * 区域命中后自动切到对应场景卡；未命中区域时保持手动模式。
 */

/** 地理围栏：一个区域 → 一个自动触发场景（scenarioKey 对应 App.tsx 的 SCENARIO_GENERATORS） */
export interface ScenarioZone {
  id: string;
  /** 卡面展示名（locationName） */
  name: string;
  scenarioKey: string;
  lat: number;
  lng: number;
  /** 命中半径（米） */
  radiusM: number;
}

export const SCENARIO_ZONES: ScenarioZone[] = [
  { id: 'bkk', name: '曼谷素万那普机场 (BKK)', scenarioKey: 'AIRPORT_TAXI', lat: 13.69, lng: 100.7501, radiusM: 3000 },
  { id: 'dmk', name: '曼谷廊曼机场 (DMK)', scenarioKey: 'AIRPORT_TAXI', lat: 13.9126, lng: 100.6066, radiusM: 2500 },
  { id: 'nrt', name: '东京成田机场 (NRT)', scenarioKey: 'AIRPORT_TAXI', lat: 35.772, lng: 140.3929, radiusM: 3000 },
  { id: 'hnd', name: '东京羽田机场 (HND)', scenarioKey: 'AIRPORT_TAXI', lat: 35.5494, lng: 139.7798, radiusM: 2500 },
];

/** Haversine 球面距离（米） */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface ZoneMatch {
  zone: ScenarioZone;
  distanceM: number;
}

/** 命中（半径内）且最近的围栏；全部未命中返回 null */
export function matchZone(
  lat: number,
  lng: number,
  zones: ScenarioZone[] = SCENARIO_ZONES,
): ZoneMatch | null {
  let best: ZoneMatch | null = null;
  for (const zone of zones) {
    const distanceM = haversineM(lat, lng, zone.lat, zone.lng);
    if (distanceM <= zone.radiusM && (!best || distanceM < best.distanceM)) {
      best = { zone, distanceM };
    }
  }
  return best;
}

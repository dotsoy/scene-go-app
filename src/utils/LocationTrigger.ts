/**
 * 定位驱动的场景自动触发（前台模式）
 *
 * - 请求前台定位权限（NSLocationWhenInUseUsageDescription 已在 app.json 配置）
 * - 权限被拒时返回 false，App 保持手动模式
 * - watchPositionAsync 前台持续监听，每次定位更新按围栏匹配：
 *   命中新区域才上报（同一区域不重复触发，避免抖动）
 *
 * v1 仅前台；后台 Geofence（Always 权限 + startGeofencingAsync）留待后续版本。
 */
import * as Location from 'expo-location';
import { SCENARIO_ZONES, matchZone, ScenarioZone } from './scenarioZones';

export interface ZoneReport {
  zone: ScenarioZone;
  distanceM: number;
}

export class LocationTrigger {
  private watcher: Location.LocationSubscription | null = null;
  private lastZoneId: string | null = null;

  /** 返回是否成功开启（权限被拒 / 定位不可用返回 false） */
  async start(
    onZoneEntered: (report: ZoneReport) => void,
  ): Promise<boolean> {
    await this.stop();

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    try {
      this.watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 100,
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          const match = matchZone(latitude, longitude, SCENARIO_ZONES);
          if (!match) {
            // 离开所有围栏：清空记录，但不主动切换卡片（保留用户当前选择）
            this.lastZoneId = null;
            return;
          }
          if (match.zone.id === this.lastZoneId) {
            return; // 同一区域，防抖
          }
          this.lastZoneId = match.zone.id;
          onZoneEntered({ zone: match.zone, distanceM: match.distanceM });
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.remove();
      this.watcher = null;
    }
    this.lastZoneId = null;
  }
}

/** 单例：App 挂载时启动 */
export const locationTrigger = new LocationTrigger();

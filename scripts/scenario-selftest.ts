/**
 * 场景数据自检（数据层回归防线）：bun run scripts/scenario-selftest.ts
 * 覆盖：GPS 场景推理 / haversine 距离。
 * 修任何内容数据（sceneInference）前必跑；全绿才可提交。
 * （SOP 成卡模板与机场胶囊已按产品决策删除，2026-08-06）
 */
import { inferSceneFromPlace, haversineKm } from '../src/core/sceneInference';

let failed = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ── GPS 场景推理 ──
console.log('── inferSceneFromPlace ──');
const bkk = inferSceneFromPlace({ city: 'Bang Phli', region: 'Samut Prakan', country: 'Thailand', lat: 13.69, lng: 100.7501 });
check('素万那普机场坐标命中', bkk?.key === 'airport' && bkk?.dest?.zh === '素万那普机场', JSON.stringify(bkk));
check('命中理由含距离', !!bkk?.matched.includes('km'), bkk?.matched);
const dkk = inferSceneFromPlace({ city: 'Don Mueang', region: 'Bangkok', country: 'Thailand', lat: 13.9126, lng: 100.6066 });
check('廊曼机场坐标命中', dkk?.dest?.zh === '廊曼机场', JSON.stringify(dkk));
const far = inferSceneFromPlace({ city: 'Cupertino', region: 'CA', country: 'United States', lat: 37.3318, lng: -122.0312 });
check('远点不命中', far === null, JSON.stringify(far));
const kw = inferSceneFromPlace({ city: 'Somewhere Airport', region: '', country: '', lat: 0, lng: 0 });
check('地名关键词兜底命中', kw?.key === 'airport' && kw.matched.includes('airport'), JSON.stringify(kw));
check('无定位不命中', inferSceneFromPlace(null) === null);
check('haversine 自洽（BKK 到 BKK = 0）', haversineKm(13.69, 100.7501, 13.69, 100.7501) < 0.01);

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`);
process.exit(failed === 0 ? 0 : 1);

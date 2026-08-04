/**
 * 场景数据自检（数据层回归防线）：bun run scripts/scenario-selftest.ts
 * 覆盖：GPS 场景推理 / SOP 引擎（打车/药店/中英/回退）/ 卡构建字段 / 点餐卡 / 机场检测 / 胶囊。
 * 修任何内容数据（scenarioSops/sceneInference/sopEngine）前必跑；全绿才可提交。
 */
import { sopEngine } from '../src/core/sopEngine';
import { inferSceneFromPlace, haversineKm } from '../src/core/sceneInference';
import {
  buildOrderCard,
  detectAirportDest,
  getAirportCapsules,
  buildStepsCard,
  TAXI_SOP,
} from '../src/data/scenarioSops';

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

// ── SOP 引擎 ──
console.log('── sopEngine ──');
const taxi = sopEngine.matchLocalSop('我要打车去机场', { location: '泰国' });
check('中文打车命中', taxi?.categoryTag === '打车指引', taxi?.categoryTag);
check('打车 2 步', taxi?.steps?.length === 2, String(taxi?.steps?.length));
check('打车步骤0镜像到顶层', taxi?.targetText === taxi?.steps?.[0]?.targetText, taxi?.targetText);
check('打车英文大字', taxi?.targetText === 'Please take me to the airport.', taxi?.targetText);
check('打车回应 2 项且带回卡', taxi?.reply?.options.length === 2 && !!taxi?.reply?.options[0]?.replyCard);
const pha = sopEngine.matchLocalSop('我发烧头痛', {});
check('中文药店命中', pha?.categoryTag === '药店购药指引', pha?.categoryTag);
check('药店 3 步', pha?.steps?.length === 3, String(pha?.steps?.length));
check('药店症状句', pha?.targetText === 'I have a fever and a headache. Do you have fever medicine?', pha?.targetText);
const en = sopEngine.matchLocalSop('I need a taxi to the Grand Palace', { lang: 'en-US' });
check('英文打车命中', en?.categoryTag === '打车指引' && en?.targetText.includes('Grand Palace'), en?.targetText);
const enPha = sopEngine.matchLocalSop('I have a fever and a cough', { lang: 'en-US' });
check('英文药店命中', enPha?.categoryTag === '药店购药指引', enPha?.categoryTag);
check('未知目的地交 VLM', sopEngine.matchLocalSop('我要打车去东京塔') === null);
check('无关文本不命中', sopEngine.matchLocalSop('你好') === null);
check('模板直构可测（TAXI_SOP 步骤数）', buildStepsCard(TAXI_SOP, { dest: { zh: '机场', en: 'the airport' } }, '泰国').steps?.length === 2);

// ── 点餐卡 ──
console.log('── buildOrderCard ──');
const dish = { zh: '泰式炒河粉', en: 'Pad Thai', th: 'ผัดไทย', price: '150 铢', spice: '🌶️🌶️', allergens: ['花生'] };
const order = buildOrderCard(dish, { location: '泰国', languageCode: 'th-TH' });
check('过敏原点餐卡', order.targetText === 'Pad Thai without peanuts, please', order.targetText);
check('少辣追加', order.subText.includes('少辣'), order.subText);
check('不含过敏原点餐卡', buildOrderCard({ ...dish, allergens: [] }, { location: '泰国', languageCode: 'th-TH' }).targetText === 'Pad Thai, please');

// ── 机场检测 / 胶囊 ──
console.log('── detectAirportDest / capsules ──');
check('素万那普', detectAirportDest('Bangkok Suvarnabhumi').zh === '素万那普机场');
check('廊曼', detectAirportDest('Don Mueang International Airport').zh === '廊曼机场');
check('通用机场', detectAirportDest('Bangkok, Thailand').zh === '机场');
check('胶囊 3 个', getAirportCapsules().length === 3 && getAirportCapsules()[0].key === 'taxi');

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`);
process.exit(failed === 0 ? 0 : 1);

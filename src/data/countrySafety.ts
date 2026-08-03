/**
 * 国家安全数据访问层：数据已抽离至场景包（src/packs/defaultPack.ts），
 * 此处保持原有 API（COUNTRY_SAFETY / SUPPORTED_COUNTRY_CODES / getCountrySafety / CountrySafety），
 * 消费方无需改动，内容随场景包版本化并可远程下发。
 *
 * 注意：电话/惯例数据上线前请逐条核验（领事馆电话以中国领事服务网为准）。
 */
import { getPack } from '../packs/packManager';
import { CountrySafetyData as CountrySafety } from '../packs/types';

export type { CountrySafety };

export const COUNTRY_SAFETY: CountrySafety[] = getPack().countries;

export const SUPPORTED_COUNTRY_CODES = COUNTRY_SAFETY.map((c) => c.code);

export function getCountrySafety(code: string): CountrySafety | undefined {
  return COUNTRY_SAFETY.find((c) => c.code === code);
}

from typing import Dict, Any, Optional
from pydantic import BaseModel

class ScenarioCardResponse(BaseModel):
    scenario_code: str
    scenario_tag: str
    location_name: str
    title: str
    target_text: str
    phonetic: str
    english: str
    local_tip: str
    language_code: str
    badge_color: str

class CardTemplateEngine:
    """
    Renders high-contrast zero-search scenario cards and local protocol tips in Chinese for testing.
    """
    TEMPLATES = {
        "AIRPORT_TAXI": {
            "scenario_tag": "打车 / 计价器",
            "title": "出租车按表计费声明",
            "target_text": "请按表计费，谢谢（请打表）",
            "phonetic": "Qing An Biao Ji Fei, Xie Xie",
            "english": "请使用计价器按标准费率打表",
            "local_tip": "曼谷机场打车请前往 1 楼叫号机，按表付费另加 50 铢附加费。",
            "language_code": "zh-CN",
            "badge_color": "#059669"
        },
        "DINING_ORDER": {
            "scenario_tag": "餐饮 / 忌口过敏",
            "title": "餐食过敏与忌口说明",
            "target_text": "我对花生严重过敏，请勿添加",
            "phonetic": "Wo Dui Hua Sheng Yan Zhong Guo Min",
            "english": "请确保菜品无花生及花生制品",
            "local_tip": "居酒屋默认自动提供开胃小菜（お通し，人头消费 300-500 日元）。",
            "language_code": "zh-CN",
            "badge_color": "#d97706"
        },
        "TAX_REFUND": {
            "scenario_tag": "购物 / 退税",
            "title": "购物退税单开具申请",
            "target_text": "请帮我开具退税申请单，谢谢",
            "phonetic": "Qing Bang Wo Kai Ju Tui Shui Dan",
            "english": "请开具官方退税凭证与表格",
            "local_tip": "单日消费满 2,000 铢可开具退税单，离境在机场海关盖章。",
            "language_code": "zh-CN",
            "badge_color": "#2563eb"
        },
        "EMERGENCY_SOS": {
            "scenario_tag": "紧急 / 救援",
            "title": "紧急大字求助与 GPS 坐标",
            "target_text": "求助！请协助联系警察并定位此坐标",
            "phonetic": "Qiu Zhu! Qing Xie Zhu Lian Xi Jing Cha",
            "english": "紧急联系电话：旅游警察专线 1155",
            "local_tip": "遭遇紧急危险请出示此卡给路人，当地旅游警察专线：1155。",
            "language_code": "zh-CN",
            "badge_color": "#dc2626"
        }
    }

    @classmethod
    def render(cls, scenario_code: str, location_name: str = "异国出行现场") -> ScenarioCardResponse:
        data = cls.TEMPLATES.get(scenario_code, {
            "scenario_tag": "日常沟通",
            "title": "常用表达卡",
            "target_text": "非常感谢您的帮助",
            "phonetic": "Fei Chang Gan Xie Nin De Bang Zhu",
            "english": "礼貌问候与感谢",
            "local_tip": "礼貌问候与感谢能大幅提升异国出行沟通顺畅度。",
            "language_code": "zh-CN",
            "badge_color": "#4b5563"
        })

        return ScenarioCardResponse(
            scenario_code=scenario_code,
            location_name=location_name,
            **data
        )

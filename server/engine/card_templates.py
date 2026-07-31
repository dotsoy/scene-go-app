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
    Renders high-contrast zero-search scenario cards and local protocol tips.
    """
    TEMPLATES = {
        "AIRPORT_TAXI": {
            "scenario_tag": "机场打车 / 接机",
            "title": "🚕 出租车按表计费卡",
            "target_text": "กรุณาเปิดมิเตอร์ด้วยครับ / ค่ะ",
            "phonetic": "Gru-na open meter krub/ka",
            "english": "Please use the meter.",
            "local_tip": "曼谷机场打车请前往 1 楼叫号机。按表付费另需付 50 铢机场附加费。",
            "language_code": "th-TH",
            "badge_color": "#059669"
        },
        "DINING_ORDER": {
            "scenario_tag": "餐厅用餐 / 忌口",
            "title": "🍲 用餐过敏/忌口沟通卡",
            "target_text": "ไม่ใส่น้ำแข็ง / ไม่ใส่ถั่ว",
            "phonetic": "Mai sai nam-kheng / Mai sai thua",
            "english": "No ice / No peanuts, please.",
            "local_tip": "当地餐厅冷饮默认加满冰块，如需无冰请提早展示此卡。",
            "language_code": "th-TH",
            "badge_color": "#d97706"
        },
        "TAX_REFUND": {
            "scenario_tag": "商场购物 / 退税",
            "title": "🧾 购物退税申请卡",
            "target_text": "ขอแบบฟอร์มคืนภาษี (Tax Refund) ด้วยครับ",
            "phonetic": "Kho baeb form kheen pha-si krub",
            "english": "Could I have a tax refund form, please?",
            "local_tip": "同一商场当日消费满 2,000 铢可开具退税单，离境时在机场海关盖章。",
            "language_code": "th-TH",
            "badge_color": "#2563eb"
        },
        "SOS_EMERGENCY": {
            "scenario_tag": "SOS 紧急救援",
            "title": "🆘 紧急大字救援与位置卡",
            "target_text": "Help! Please send assistance.",
            "phonetic": "Emergency call 1155 (Tourist Police)",
            "english": "I need urgent assistance.",
            "local_tip": "遭遇危险第一时间出示此卡给路人，当地旅游警察专线支持多语种。",
            "language_code": "en-US",
            "badge_color": "#dc2626"
        }
    }

    @classmethod
    def render(cls, scenario_code: str, location_name: str = "异国出行现场") -> ScenarioCardResponse:
        data = cls.TEMPLATES.get(scenario_code, {
            "scenario_tag": "日常沟通",
            "title": "💬 常用表达卡",
            "target_text": "ขอบคุณครับ / ค่ะ",
            "phonetic": "Khop khun krub/ka",
            "english": "Thank you.",
            "local_tip": "礼貌问候与感谢能大幅提升异国出行沟通顺畅度。",
            "language_code": "th-TH",
            "badge_color": "#4b5563"
        })

        return ScenarioCardResponse(
            scenario_code=scenario_code,
            location_name=location_name,
            **data
        )

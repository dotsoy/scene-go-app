import pytest
from engine.scene_detector import SceneDetector, LocationPayload
from engine.card_templates import CardTemplateEngine

def test_scene_detection_airport():
    payload = LocationPayload(latitude=13.6900, longitude=100.7501, location_tag="Suvarnabhumi Airport Arrivals")
    scenario = SceneDetector.detect(payload)
    assert scenario == "AIRPORT_TAXI"

def test_scene_detection_restaurant():
    payload = LocationPayload(latitude=35.6938, longitude=139.7034, location_tag="Shinjuku Izakaya Restaurant")
    scenario = SceneDetector.detect(payload)
    assert scenario == "DINING_ORDER"

def test_card_template_render():
    card = CardTemplateEngine.render("AIRPORT_TAXI", "Suvarnabhumi Airport")
    assert card.scenario_code == "AIRPORT_TAXI"
    assert "มิเตอร์" in card.target_text
    assert card.language_code == "th-TH"

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from engine.scene_detector import SceneDetector, LocationPayload
from engine.card_templates import CardTemplateEngine, ScenarioCardResponse

app = FastAPI(
    title="SceneGo Real-Time Scenario Engine API",
    version="1.0.0",
    description="Backend service providing real-time location scenario inference and flash card templates for SceneGo Expo App."
)

# 允许 Expo 移动端与 Web 客户端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "SceneGo Scenario Engine", "version": "1.0.0"}

@app.post("/api/v1/detect-scenario", response_model=ScenarioCardResponse)
def detect_and_render_scenario(payload: LocationPayload):
    """
    接收地理位置与 POI 围栏信息，自动推理当前场景并返回大字闪示卡。
    """
    scenario_code = SceneDetector.detect(payload)
    location_name = payload.location_tag or f"GPS ({payload.latitude:.4f}, {payload.longitude:.4f})"
    return CardTemplateEngine.render(scenario_code, location_name)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

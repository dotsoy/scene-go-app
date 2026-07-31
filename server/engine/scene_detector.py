from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class LocationPayload(BaseModel):
    latitude: float = Field(..., description="Latitude")
    longitude: float = Field(..., description="Longitude")
    speed_m_s: float = Field(0.0, description="Speed in meters per second")
    location_tag: str = Field("", description="POI/Geofence tag, e.g. Suvarnabhumi Airport")

class SceneDetector:
    """
    Infers real-time travel scenarios based on location, geofencing, and movement speed.
    """
    @staticmethod
    def detect(payload: LocationPayload) -> str:
        tag = payload.location_tag.lower()
        
        if "airport" in tag or "terminal" in tag or "arrival" in tag:
            return "AIRPORT_TAXI"
        elif "restaurant" in tag or "cafe" in tag or "dining" in tag or "izakaya" in tag:
            return "DINING_ORDER"
        elif "station" in tag or "subway" in tag or "metro" in tag or "train" in tag:
            return "TRANSIT_NAV"
        elif "mall" in tag or "duty free" in tag or "tax" in tag or "shopping" in tag:
            return "TAX_REFUND"
        elif "sos" in tag or "emergency" in tag:
            return "SOS_EMERGENCY"
        else:
            return "GENERAL_COMMUNICATION"

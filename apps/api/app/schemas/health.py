from pydantic import BaseModel
from datetime import datetime

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime

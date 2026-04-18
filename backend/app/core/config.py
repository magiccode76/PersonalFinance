import json
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "PersonalFinance"
    MONGODB_URL: str = "mongodb://pfuser:pfpass123@localhost:27017/personalfinance?authSource=personalfinance"
    MONGODB_DB: str = "personalfinance"
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost"]'

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"


settings = Settings()

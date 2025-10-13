from pydantic_settings import BaseSettings
from typing import Dict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./ape_in_game.db"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Game settings
    MAX_SCORE: int = 150
    MAX_ROUNDS: int = 10
    TURN_TIMEOUT_SECONDS: int = 60
    
    # Bot configurations
    BOT_CONFIGS: Dict[str, Dict] = {
        "sandy": {
            "name": "Sandy",
            "difficulty": "Easy",
            "winning_score": 150,
            "max_rounds": 10,
            "target_scores": [21],
            "description": "Tutorial bot - Perfect for beginners!",
            "personality": "Friendly and encouraging"
        },
        "aida": {
            "name": "Aida",
            "difficulty": "Medium",
            "winning_score": 200,
            "max_rounds": 12,
            "target_scores": [21, 26],
            "description": "Balanced strategy with smart plays",
            "personality": "Strategic and analytical"
        },
        "lana": {
            "name": "Lana",
            "difficulty": "Hard",
            "winning_score": 250,
            "max_rounds": 15,
            "target_scores": [26, 34],
            "description": "Aggressive player who takes big risks",
            "personality": "Bold and daring"
        },
        "enj1n": {
            "name": "EnJ1n",
            "difficulty": "Expert",
            "winning_score": 300,
            "max_rounds": 18,
            "target_scores": [34, 42, 55],
            "description": "Master player with unpredictable moves",
            "personality": "Calculated chaos"
        },
        "nifty": {
            "name": "Nifty",
            "difficulty": "Medium-Hard",
            "winning_score": 180,
            "max_rounds": 12,
            "target_scores": [21, 26, 34],
            "description": "Adaptable player who changes tactics",
            "personality": "Clever and unpredictable"
        }
    }
    
    class Config:
        env_file = ".env"


settings = Settings()

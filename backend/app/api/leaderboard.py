from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import LeaderboardEntry

router = APIRouter()


@router.get("/")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get leaderboard entries"""
    try:
        result = await db.execute(
            select(LeaderboardEntry)
            .order_by(LeaderboardEntry.total_wins.desc(), LeaderboardEntry.high_score.desc())
            .limit(limit)
        )
        entries = result.scalars().all()
        
        return [
            {
                "rank": idx + 1,
                "playerName": entry.player_name,
                "walletAddress": entry.wallet_address,
                "totalWins": entry.total_wins,
                "highScore": entry.high_score,
                "gamesPlayed": entry.total_games,
            }
            for idx, entry in enumerate(entries)
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/player/{wallet_address}")
async def get_player_stats(
    wallet_address: str,
    db: AsyncSession = Depends(get_db)
):
    """Get player statistics"""
    try:
        result = await db.execute(
            select(LeaderboardEntry).where(
                LeaderboardEntry.wallet_address == wallet_address
            )
        )
        entry = result.scalar_one_or_none()
        
        if not entry:
            raise HTTPException(status_code=404, detail="Player not found")
        
        return {
            "playerName": entry.player_name,
            "walletAddress": entry.wallet_address,
            "totalWins": entry.total_wins,
            "totalLosses": entry.total_losses,
            "totalGames": entry.total_games,
            "highScore": entry.high_score,
            "averageScore": entry.total_score // entry.total_games if entry.total_games > 0 else 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))







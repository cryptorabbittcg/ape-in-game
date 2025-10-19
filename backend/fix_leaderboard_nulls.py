#!/usr/bin/env python3
"""
Leaderboard Null Fix Script
Fixes any NULL values in the leaderboard table by setting them to appropriate defaults.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select, update
from app.models import LeaderboardEntry
from app.config import settings

async def fix_leaderboard_nulls():
    """Fix NULL values in leaderboard entries"""
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        try:
            # Get all leaderboard entries
            result = await session.execute(select(LeaderboardEntry))
            entries = result.scalars().all()
            
            print(f"Found {len(entries)} leaderboard entries to check...")
            
            fixed_count = 0
            for entry in entries:
                needs_update = False
                
                # Check and fix NULL values
                if entry.total_wins is None:
                    entry.total_wins = 0
                    needs_update = True
                
                if entry.total_losses is None:
                    entry.total_losses = 0
                    needs_update = True
                
                if entry.total_games is None:
                    entry.total_games = 0
                    needs_update = True
                
                if entry.high_score is None:
                    entry.high_score = 0
                    needs_update = True
                
                if entry.total_score is None:
                    entry.total_score = 0
                    needs_update = True
                
                if needs_update:
                    fixed_count += 1
                    print(f"Fixed entry for {entry.player_name} ({entry.wallet_address})")
            
            if fixed_count > 0:
                await session.commit()
                print(f"✅ Successfully fixed {fixed_count} leaderboard entries")
            else:
                print("✅ No NULL values found - leaderboard is clean")
                
        except Exception as e:
            print(f"❌ Error fixing leaderboard: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    print("🔧 Fixing leaderboard NULL values...")
    asyncio.run(fix_leaderboard_nulls())

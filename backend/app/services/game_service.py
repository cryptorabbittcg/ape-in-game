from typing import Dict, List, Optional, Tuple
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Game, Player, GameState, LeaderboardEntry
from app.game_logic import (
    Card,
    draw_weighted_card,
    apply_ape_in_effect,
    roll_dice,
    check_bust,
)
from app.config import settings


class GameService:
    """Service for managing game logic and state"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_game(
        self,
        mode: str,
        player_name: str,
        wallet_address: Optional[str] = None
    ) -> Dict:
        """Create a new game"""
        # Get bot-specific configuration
        bot_config = settings.BOT_CONFIGS.get(mode, {})
        winning_score = bot_config.get("winning_score", settings.MAX_SCORE)
        max_rounds = bot_config.get("max_rounds", settings.MAX_ROUNDS)
        
        # Create game
        game = Game(
            mode=mode,
            status="waiting" if mode in ["pvp", "multiplayer"] else "playing",
            winning_score=winning_score,
            max_rounds=max_rounds
        )
        self.db.add(game)
        await self.db.flush()

        # Create player
        player = Player(
            game_id=game.id,
            name=player_name,
            wallet_address=wallet_address,
            is_ai=False
        )
        self.db.add(player)
        await self.db.flush()  # Flush to get player.id

        # Create AI opponent if single-player mode
        if mode in ["sandy", "aida", "lana", "enj1n", "nifty"]:
            bot_name = bot_config.get("name", mode.capitalize())
            ai_player = Player(
                game_id=game.id,
                name=bot_name,
                is_ai=True,
                ai_type=mode
            )
            self.db.add(ai_player)
            game.status = "playing"

        # Create game state
        game_state = GameState(
            game_id=game.id,
            current_player_id=player.id,  # Now player.id is guaranteed to be set
            used_bearish_flags=[],
            game_log=[]
        )
        self.db.add(game_state)

        await self.db.commit()
        await self.db.refresh(game)

        return await self.get_game_data(game.id)

    async def get_game_data(self, game_id: str) -> Dict:
        """Get complete game data"""
        result = await self.db.execute(
            select(Game).where(Game.id == game_id)
        )
        game = result.scalar_one_or_none()
        
        if not game:
            raise ValueError("Game not found")

        # Get players
        result = await self.db.execute(
            select(Player).where(Player.game_id == game_id)
        )
        players = result.scalars().all()

        # Get game state
        result = await self.db.execute(
            select(GameState).where(GameState.game_id == game_id)
        )
        state = result.scalar_one_or_none()

        # Find human player and opponent
        human_player = next((p for p in players if not p.is_ai), None)
        opponent = next((p for p in players if p.is_ai or p.id != human_player.id), None)

        # Get winner name instead of ID
        winner_name = None
        if game.winner_id:
            winner_player = next((p for p in players if p.id == game.winner_id), None)
            winner_name = winner_player.name if winner_player else None

        return {
            "gameId": game.id,
            "mode": game.mode,
            "status": game.status,
            "playerScore": human_player.score if human_player else 0,
            "opponentScore": opponent.score if opponent else 0,
            "playerTurnScore": human_player.turn_score if human_player else 0,
            "opponentTurnScore": opponent.turn_score if opponent else 0,
            "currentCard": state.current_card if state else None,
            "lastRoll": state.last_roll if state else None,
            "roundCount": game.current_round,
            "maxRounds": game.max_rounds,
            "winningScore": game.winning_score,
            "isPlayerTurn": state.current_player_id == human_player.id if human_player and state else False,
            "gameStatus": game.status,
            "winner": winner_name,
            "apeInActive": state.ape_in_active if state else False,
        }

    async def draw_card(self, game_id: str, player_id: str) -> Card:
        """Draw a card for a player"""
        result = await self.db.execute(
            select(GameState).where(GameState.game_id == game_id)
        )
        state = result.scalar_one()

        # Draw a card
        card = draw_weighted_card(state.used_bearish_flags)
        
        # Store card in state
        state.current_card = card.model_dump()
        
        # Activate Ape In effect if Ape In card is drawn
        if card.name == "Ape In!":
            state.ape_in_active = True
        
        await self.db.commit()
        return card

    async def roll_dice_action(
        self,
        game_id: str,
        player_id: str,
        dice_profile: str = "balanced"
    ) -> Tuple[int, bool, str]:
        """Roll dice and process result"""
        result = await self.db.execute(
            select(GameState).where(GameState.game_id == game_id)
        )
        state = result.scalar_one()

        result = await self.db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = result.scalar_one()

        # Must have a current card
        if not state.current_card:
            raise ValueError("No card to roll for")

        current_card = Card(**state.current_card)
        
        # Roll dice
        roll = roll_dice(dice_profile)
        state.last_roll = roll

        # Check if Ape In is active
        was_ape_in_active = state.ape_in_active

        # Handle Bearish cards
        if current_card.type == "Bearish":
            # Check if penalty can be dodged (even roll)
            if roll % 2 == 0:
                # Dodged!
                if state.ape_in_active:
                    state.ape_in_active = False
                    message = "Dodged bearish!"
                    if was_ape_in_active:
                        message += " (Ape In! negated)"
                    return roll, True, message
                else:
                    state.used_bearish_flags.append(current_card.penalty)
                    state.current_card = None
                    await self.db.commit()
                    message = "Dodged bearish!"
                    if was_ape_in_active:
                        message += " (Ape In! negated)"
                    return roll, True, message
            else:
                # Apply penalty
                if current_card.penalty == "Reset":
                    player.score = 0
                    state.used_bearish_flags.append("Reset")
                elif current_card.penalty == "Half":
                    player.score = player.score // 2
                    state.used_bearish_flags.append("Half")
                elif current_card.penalty == "Minus10":
                    player.score = max(0, player.score - 10)
                    state.used_bearish_flags.append("Minus10")
                
                player.turn_score = 0
                state.current_card = None
                
                await self.db.commit()
                message = f"Hit by {current_card.penalty}!"
                if was_ape_in_active:
                    message += " (Ape In! negated)"
                return roll, False, message

        # Check bust
        if check_bust(roll):
            player.turn_score = 0
            state.current_card = None
            state.ape_in_active = False
            
            await self.db.commit()
            return roll, False, "Busted!"

        # Success - add card value to turn score
        card_value = current_card.value
        
        # Apply Ape In effect
        if state.ape_in_active:
            card_value *= 2
            state.ape_in_active = False

        player.turn_score += card_value
        state.current_card = None
        
        await self.db.commit()
        return roll, True, f"Added {card_value} sats to turn score!"

    async def stack_sats(self, game_id: str, player_id: str, skip_ai_turn: bool = False) -> Dict:
        """Stack sats (end turn)"""
        result = await self.db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = result.scalar_one()

        result = await self.db.execute(
            select(Game).where(Game.id == game_id)
        )
        game = result.scalar_one()
        
        result = await self.db.execute(
            select(GameState).where(GameState.game_id == game_id)
        )
        state = result.scalar_one()

        # Add turn score to total score
        player.score += player.turn_score
        player.turn_score = 0

        # Check win condition
        if player.score >= game.winning_score:
            game.status = "finished"
            game.winner_id = player.id
            if not player.is_ai:
                await self._update_leaderboard(player, won=True)

        # Increment round ONLY when AI player completes their turn (bot's score is finalized)
        # This marks the end of a complete round (player turn + bot turn)
        if player.is_ai and game.status != "finished":
            game.current_round += 1

        # Check max rounds
        if game.current_round > game.max_rounds and game.status != "finished":
            game.status = "finished"
            # Determine winner
            result = await self.db.execute(
                select(Player).where(Player.game_id == game_id).order_by(Player.score.desc())
            )
            winner = result.scalars().first()
            game.winner_id = winner.id if winner else None

        await self.db.commit()

        # If AI opponent and human player just stacked, play AI turn
        if not skip_ai_turn and player.is_ai is False and game.status == "playing":
            await self._ai_play_turn(game_id)

        return await self.get_game_data(game_id)

    async def _ai_play_turn(self, game_id: str):
        """AI opponent plays their turn and return action log"""
        result = await self.db.execute(
            select(Player).where(Player.game_id == game_id, Player.is_ai == True)
        )
        ai_player = result.scalar_one_or_none()

        if not ai_player:
            return []

        result = await self.db.execute(
            select(Game).where(Game.id == game_id)
        )
        game = result.scalar_one()

        # AI decision logic based on type
        ai_type = ai_player.ai_type or "sandy"
        target_turn_score = self._get_ai_target_score(ai_type, ai_player, game)

        # Track actions for replay
        actions = []

        # AI draws and rolls with Sandy-specific risk logic
        while True:
            # Draw card
            card = await self.draw_card(game_id, ai_player.id)
            
            # Special handling for Ape In card
            if card.name == "Ape In!":
                actions.append({
                    "type": "ape_in",
                    "card": card.model_dump(),
                    "message": "Ape In! activated"
                })
                continue  # AI continues to draw another card
            
            # Log the draw action
            actions.append({
                "type": "draw",
                "card": card.model_dump()
            })

            # Roll dice
            roll, success, message = await self.roll_dice_action(
                game_id, ai_player.id, dice_profile=ai_type
            )
            
            # Refresh ai_player to get updated turn_score
            result = await self.db.execute(
                select(Player).where(Player.id == ai_player.id)
            )
            ai_player = result.scalar_one()
            
            actions.append({
                "type": "roll",
                "value": roll,
                "success": success,
                "message": message,
                "turnScore": ai_player.turn_score
            })

            if not success:
                # AI busted or hit bearish
                break
            
            # Sandy-specific decision logic
            if ai_type == "sandy" and ai_player.turn_score >= 21:
                # Get human player score for comparison
                result = await self.db.execute(
                    select(Player).where(Player.game_id == game_id, Player.is_ai == False)
                )
                human_player = result.scalar_one()
                
                # Calculate score difference
                score_difference = human_player.score - ai_player.score
                
                # Decision logic
                should_continue = False
                
                if score_difference > 50:
                    # Behind by >50 sats: 50% chance to continue
                    should_continue = random.random() < 0.5
                    if should_continue:
                        actions.append({
                            "type": "decision",
                            "message": f"Sandy is behind by {score_difference} sats. Taking a risk!"
                        })
                else:
                    # At or ahead: 10% chance to continue
                    should_continue = random.random() < 0.1
                    if should_continue:
                        actions.append({
                            "type": "decision", 
                            "message": "Sandy decides to push her luck!"
                        })
                
                if not should_continue:
                    # Sandy decides to stack
                    break
            elif ai_player.turn_score >= target_turn_score:
                # Other AIs use standard target logic
                break

        # Stack sats (skip AI turn to prevent recursion)
        await self.stack_sats(game_id, ai_player.id, skip_ai_turn=True)
        actions.append({
            "type": "stack",
            "finalScore": ai_player.score
        })
        
        return actions

    def _get_ai_target_score(self, ai_type: str, ai_player: Player, game: Game) -> int:
        """Get AI target turn score based on type"""
        bot_config = settings.BOT_CONFIGS.get(ai_type, {})
        target_scores = bot_config.get("target_scores", [21])
        return random.choice(target_scores)

    async def _update_leaderboard(self, player: Player, won: bool):
        """Update leaderboard entry"""
        if not player.wallet_address:
            return

        result = await self.db.execute(
            select(LeaderboardEntry).where(
                LeaderboardEntry.wallet_address == player.wallet_address
            )
        )
        entry = result.scalar_one_or_none()

        if not entry:
            entry = LeaderboardEntry(
                player_name=player.name,
                wallet_address=player.wallet_address
            )
            self.db.add(entry)

        entry.total_games += 1
        if won:
            entry.total_wins += 1
        else:
            entry.total_losses += 1

        if player.score > entry.high_score:
            entry.high_score = player.score

        entry.total_score += player.score

        await self.db.commit()

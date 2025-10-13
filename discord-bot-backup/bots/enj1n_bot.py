from datetime import datetime
import discord
import asyncio
from discord.ext import commands

from game_logic.enj1n_game import Enj1nGame
from views.delete_thread_view import DeleteThreadView
from views.draw_card_view import DrawCardView
from views.dice_roll_view import DiceRollView
from views.stack_options_view import StackOptionsView
from utils.post_results import post_results_to_channel
from utils.score_utils import format_score_message
from utils.thread_manager import close_game_thread
from utils.timeout_handler import TimeoutHandler
from utils.leaderboard_store import record_game_result


class Enj1nBot(commands.Cog):
    def __init__(self, bot):
        """
        Initializes the Enj1nBot cog.
        """
        self.bot = bot
        self.active_games = {}
        self.timeout_handler = TimeoutHandler()
        self.IDLE_TIMEOUT = 120
        self.ROUND_LIMIT = 15
        self.WINNING_SCORE = 300

    async def start_enj1n_game(self, interaction: discord.Interaction, player_name: str = None):
        """
        Starts a new game against En-J1n.
        """
        user = interaction.user
        player_id = user.id
        player_name = player_name or user.display_name

        if player_id in self.active_games:
            await interaction.followup.send("🟡 You already have a game in progress!", ephemeral=True)
            return

        thread = await interaction.channel.create_thread(
            name=f"🧠 En-J1n-vs-{player_name}",
            type=discord.ChannelType.public_thread,
            reason="New En-J1n Game",
        )

        await interaction.followup.send(f"🧠 En-J1n game started in {thread.mention}", ephemeral=True)

        game = Enj1nGame(self.bot, interaction, thread, player_name)
        self.active_games[player_id] = {
            "game": game,
            "thread": thread,
            "player_name": player_name
        }

        intro = [
            "🤖 Time to test your luck against me, En-J1n",
            "🎮 In Ape In! the stakes are high!",
            "💥 I'm not one to play safe — get ready for risk-heavy moves!",
            "🎴 Draw cards, 🎲 roll dice, 📈 stack sats, and ⚠️ dodge penalties!",
            "🏁 First to 300 sats or most after 15 rounds wins!",
            "Let's clash!"
        ]
        for line in intro:
            await thread.send(line)

        await self.begin_player_turn(player_id)

    async def begin_player_turn(self, player_id):
        """
        Starts the player's turn.
        """
        thread = self.active_games[player_id]["thread"]
        game = self.active_games[player_id]["game"]

        # Increment round counter
        game.round_count += 1

        # Show round info
        await thread.send(f"🔄 **Round {game.round_count}/{self.ROUND_LIMIT}**")
        await thread.send(f"🎴 **{game.player_name}'s Turn**: Click to draw your card.")

        view = DrawCardView(
            player_id=player_id,
            on_draw_callback=self.on_player_draw
        )
        await thread.send(view=view)

        user = self.bot.get_user(player_id)
        await self.timeout_handler.start_turn_timeout(
            user_id=player_id,
            thread=thread,
            timeout_seconds=self.IDLE_TIMEOUT,
            user_mention=user.mention if user else f"<@{player_id}>",
            on_timeout_callback=lambda uid=player_id: self.handle_idle_forfeit(uid)
        )

    async def on_player_draw(self, user_id, interaction):
        """
        Handles the player's card draw.
        """

        game = self.active_games[user_id]["game"]
        thread = self.active_games[user_id]["thread"]

        # Step 1: Draw the card
        card, draw_type = game.player_draw()

        # Step 2: Display the card
        if card.filename:
            await thread.send(content="You drew a card:",
                            embed=discord.Embed().set_image(
                                url=f"https://thecryptorabbithole.io/risk_reward/cards/{card.filename}"))
        else:
            await thread.send("You drew a card with no image.")

        # Step 3: Handle "Ape In!" logic
        if draw_type == "ape_in":
            await thread.send("🦍 **Ape In!**: Your next value card will have double points!")
            await asyncio.sleep(2)  # Pause before drawing the next card
            next_card, next_draw_type = game.player_draw()

            # Display the next card
            if next_card.filename:
                await thread.send(content="You drew a card:",
                                embed=discord.Embed().set_image(
                                    url=f"https://thecryptorabbithole.io/risk_reward/cards/{next_card.filename}"))
            else:
                await thread.send("You drew a card with no image.")

            if next_card.type in ["Cipher", "Oracle", "Historacle"]:
                next_card = game.ape_in_effect.apply_effect(next_card)  # Apply the "Ape In!" effect
                await thread.send(f"🦍 **Ape In! Effect**: The value of this card is doubled to {next_card.value} points!")
                await self.initiate_dice_roll(user_id, next_card, thread)
            elif next_card.type == "Bearish":
                # Negate "Ape In!" and handle bearish card
                game.ape_in_active = False  # Reset the "Ape In!" effect
                await thread.send("⚠️ The next card is a Bearish card. Negating 'Ape In!' and applying penalty.")
                success, roll, phrase = game.handle_bearish(next_card, is_player=True)
                if success:
                    await thread.send(f"🛡️ You dodged the bearish penalty! You rolled a {roll}.")
                    await self.offer_stack_options(user_id)
                else:
                    await thread.send(f"💥 Bearish penalty applied! You rolled a {roll}. {phrase}")
                    await self.enj1n_turn(user_id)
            else:
                # Handle non-value, non-bearish cards
                await thread.send("⚠️ The next card is not a value card. Resuming normal gameplay.")
                await self.begin_player_turn(user_id)
           
        else:
            # Step 4: Proceed to dice roll for the drawn card
            await self.initiate_dice_roll(user_id, card, thread)

    async def initiate_dice_roll(self, user_id, card, thread):
        """
        Initiates a dice roll for the given card.
        """
        game = self.active_games[user_id]["game"]
        view = DiceRollView(
            player_id=user_id,
             on_roll_callback=lambda player_id, roll_result: self.on_roll_dice(user_id, card, roll_result),
            player_name=game.player_name
        )
        await thread.send("🎲 Click to roll the dice!", view=view)

    async def on_roll_dice(self, user_id, card, roll_result):
        """
        Handles the dice roll result for a card.
        """
        game = self.active_games[user_id]["game"]
        thread = self.active_games[user_id]["thread"]

        try:
            outcome, roll = roll_result  # Unpack only two values
        except Exception as e:
            print(f"ERROR: Failed to unpack roll_result: {e}")
            await thread.send("❌ An error occurred while processing your dice roll. Please try again.")
            return

        if outcome == "success":
            if game.ape_in_active:
                game.player_turn_score += card.value
                await thread.send(f"✅ **Ape In!** You've successfully doubled your card's value and earned {card.value} sats! Your turn score is now **{game.player_turn_score}**.")
                game.ape_in_active = False  # Reset the "Ape In!" effect
            else:
                game.player_turn_score += card.value
                await thread.send(f"✅ You've successfully earned {card.value} sats! Your turn score is now **{game.player_turn_score}**.")
            await self.offer_stack_options(user_id)
        else:
            game.player_turn_score = 0  # Reset turn score on failure
            await thread.send(f"💥 You rolled a 1 and got rekt! No sats gained.")
            game.ape_in_active = False  # Reset the "Ape In!" effect
            await self.enj1n_turn(user_id)

    async def on_player_roll(self, user_id, interaction):
        game = self.active_games[user_id]["game"]
        thread = self.active_games[user_id]["thread"]

        result = game.player_roll()

        if result[0] == "rekt!":
            game.player_turn_score = 0  # Reset turn score on rekt
            await thread.send("💥 You rolled a 1! Turn rekt!. No sats gained.")
            await self.enj1n_turn(user_id)

        elif result[0] == "Rekt!":
            roll, phrase = result[1], result[2]  # Extract the roll and phrase
            game.player_turn_score = 0  # Reset turn score for bearish penalty
            await thread.send(f"⚠️ You rolled a {roll}. {phrase if phrase else ''}")
            await self.enj1n_turn(user_id)

        elif result[0] == "dodged":
            roll, phrase = result[1], result[2]  # Extract the roll and phrase
            await thread.send(f"🛡️ {phrase if phrase else ''} You rolled a {roll}. Continue drawing or stack your sats.")
            await self.offer_stack_options(user_id)

        elif result[0] == "success":
            # Check if "Ape In!" was active
            if game.ape_in_active:
                await thread.send(f"✅ You rolled a {result[1]}! **Ape In!** effect applied. Turn sats: **{game.player_turn_score}**.")
                game.ape_in_active = False  # Reset the "Ape In!" effect
            else:
                await thread.send(f"✅ You rolled a {result[1]}! Turn sats: **{game.player_turn_score}**.")
            await self.offer_stack_options(user_id)

    async def offer_stack_options(self, user_id):
        """
        Offers the player options to continue their turn.
        """
        thread = self.active_games[user_id]["thread"]
        view = StackOptionsView(
            player_id=user_id,
            on_draw_callback=self.on_player_draw,
            on_stack_callback=self.on_player_stack,
            on_forfeit_callback=self.on_player_forfeit
        )
        await thread.send("➕ Choose your next move:", view=view)

    async def on_player_stack(self, user_id, interaction):
        """
        Handles the player's decision to stack their sats.
        """
        thread = self.active_games[user_id]["thread"]
        game = self.active_games[user_id]["game"]

        won = game.player_stack()
        await thread.send(f"📥 You stacked your sats. Total: **{game.player_score}**")

        if won or game.is_game_over():
            await self.end_game(user_id)
        else:
            await self.enj1n_turn(user_id)

    async def enj1n_turn(self, user_id):
        """
        Handles En-J1n's turn.
        """
        thread = self.active_games[user_id]["thread"]
        game = self.active_games[user_id]["game"]

        await thread.send("🤖 En-J1n is drawing cards...")

        actions, enj1n_won = game.enj1n_play_turn()
        for msg in actions:
            await thread.send(msg)

        await thread.send(
            f"🧮 **Scores Update**\n"
            f"👤 {game.player_name}: `{game.player_score} sats`\n"
            f"🤖 En-J1n: `{game.enj1n_score} sats`"
        )

        if enj1n_won or game.is_game_over():
            await self.end_game(user_id)
        else:
            await self.begin_player_turn(user_id)

    async def end_game(self, user_id):
        """
        Ends the game and posts results.
        """
        thread = self.active_games[user_id]["thread"]
        game = self.active_games[user_id]["game"]
        player_name = self.active_games[user_id]["player_name"]

        player_score = game.player_score
        enj1n_score = game.enj1n_score

        # Determine the winner
        if player_score >= self.WINNING_SCORE or player_score > enj1n_score:
            winner = player_name
        elif enj1n_score >= self.WINNING_SCORE or enj1n_score > player_score:
            winner = "En-J1n"
        else:
            winner = "Draw"

        # Post results to the thread
        await thread.send(
            f"🎮 Final Scores:\n"
            f"👤 {player_name}: `{player_score} sats`\n"
            f"🤖 En-J1n: `{enj1n_score} sats`\n"
            f"🏆 Winner: {winner}"
        )

        # Record the game result
        try:
            await record_game_result(
                winner_id=user_id if winner == player_name else None,
                winner_name=winner,
                score=max(player_score, enj1n_score),
                mode="En-J1n",
                participant_ids=[user_id, "En-J1n"],
                participant_names=[player_name, "En-J1n"]
            )
        except Exception as e:
            print(f"❌ Error recording game result: {e}")

        # Post results to the general chat channel
        try:
            await post_results_to_channel(
                self.bot,
                winner_name=winner,
                total_score=max(player_score, enj1n_score),
                game_mode="En-J1n",
                player_names=[player_name, "En-J1n"],
                player_name=player_name
            )
        except Exception as e:
            print(f"❌ Error posting results to general chat: {e}")

        # Add the "Delete Thread" button
        delete_thread_view = DeleteThreadView(thread)
        await thread.send("🗑️ Use the button below to delete this thread:", view=delete_thread_view)

        # Clean up the game
        await close_game_thread(thread)
        self.active_games.pop(user_id, None)
        self.timeout_handler.remove_tracker(user_id)

    async def on_player_forfeit(self, user_id, interaction):
        """
        Handles player forfeiting the game.
        """
        thread = interaction.channel
        game = self.active_games[user_id]["game"]
        player_name = self.active_games[user_id]["player_name"]

        await thread.send("🏳️ You forfeited the match. Sandy wins by default.")

        try:
            await post_results_to_channel(
                self.bot,
                winner_name="En-J1n",
                total_score=game.enj1n_score,
                game_mode="En-J1n",
                player_names=[player_name, "En-J1n"],
                player_name=player_name
            )
        except Exception as e:
            print(f"❌ Error posting results for forfeit: {e}")

        await close_game_thread(thread)
        self.active_games.pop(user_id, None)
        self.timeout_handler.remove_tracker(user_id)

    async def handle_idle_forfeit(self, user_id):
        """
        Handles idle timeout by ending the player's turn and moving to Sandy's turn.
        """
        if user_id not in self.active_games:
            return

        # Retrieve the game and thread information
        thread = self.active_games[user_id]["thread"]
        player_name = self.active_games[user_id]["player_name"]
        game = self.active_games[user_id]["game"]

        # Notify the player and reset their turn score
        await thread.send(f"🕒 {player_name}, you were idle too long. Your turn has ended, and En-J1n will now play.")
        game.player_turn_score = 0  # Reset the player's turn score

        # Move to En-J1n's turn
        await self.enj1n_turn(user_id)


async def start_enj1n_game(interaction: discord.Interaction, player_name: str = None):
    bot_cog = interaction.client.get_cog("EnJ1nBot")
    if bot_cog:
        await bot_cog.start_enj1n_game(interaction, player_name)
    else:
        print("❌ Enj1nBot cog not found.")
        try:
            await interaction.followup.send("🚨 Could not find Enj1nBot cog.", ephemeral=True)
        except discord.InteractionResponded:
            pass


async def setup(bot):
    """
    Sets up the Enj1nBot cog.
    """
    await bot.add_cog(Enj1nBot(bot))
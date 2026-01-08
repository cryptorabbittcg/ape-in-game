# Ape In Implementation Summary

## Completed:
1. ✅ Updated dailyFreeGames.ts - 5 free plays per day per mode (Aida, Lana, En-J1n, Nifty)
2. ✅ Created pointsService.ts - Points calculation with formulas
3. ✅ Updated paymentService.ts - Added getPricingDisplay() method
4. ✅ Updated result.ts types - Added game_type, game_mode, game_subtype

## Remaining Tasks:

### 1. Update GameBoard.tsx
- Add error tracking state (track bearish penalties, rolling 1)
- Calculate points when game ends using pointsService
- Send points to arcade hub via postMessage (APE_IN_GAME_END)
- Update result submission to include game_type, game_mode, game_subtype
- Ensure Sandy doesn't submit to leaderboard (already done)

### 2. Update HomePage.tsx
- Show "Free plays remaining: X/5" or "Cost: 0.1 APE" in game mode cards
- Use DailyFreeGameService.getFreePlaysRemaining() and PaymentService.getPricingDisplay()

### 3. Update NewHeader.tsx
- Remove profile editing UI (name modal, PFP modal, file upload)
- Read profile from arcade session: session.username, session.address, session.avatar
- Display username, address, and PFP from session (read-only)
- Fix PFP glitch by using session.avatar with proper error handling/fallback

### 4. Verify Sandy mode
- Ensure Sandy mode does NOT submit to leaderboard (already implemented)

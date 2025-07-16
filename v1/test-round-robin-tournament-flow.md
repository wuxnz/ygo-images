# Round Robin Tournament End-to-End Test Guide

This guide provides a comprehensive test for the Round Robin tournament functionality in the Yu-Gi-Oh! tournament system.

## Overview

Round Robin tournaments ensure every participant plays every other participant exactly once. This format is excellent for smaller tournaments where you want to guarantee a certain number of matches per player.

## Test Prerequisites

1. Ensure the development server is running: `npm run dev`
2. Have at least 2 test users registered in the system
3. Have at least 2 test decks created

## Test Steps

### 1. Create a Round Robin Tournament

**Action:** Create a new tournament with Round Robin format

**Steps:**

1. Navigate to the tournaments page
2. Click "Create Tournament"
3. Fill in tournament details:
   - Name: "Test Round Robin Tournament"
   - Size: 4 (or any number 2-16)
   - Bracket Type: "Round Robin"
   - Rules: "Standard Yu-Gi-Oh! rules"
   - Prize: "Test Prize"
   - Start Date: Today
   - End Date: Next week
4. Submit the form

**Expected Result:** Tournament created successfully with Round Robin format selected

### 2. Add Participants

**Action:** Add 4 test participants to the tournament

**Steps:**

1. Navigate to the tournament details page
2. Click "Join Tournament" with different test users
3. Each user should select a deck when joining
4. Verify 4 participants are registered

**Expected Result:** Tournament shows 4 participants with their selected decks

### 3. Start the Tournament

**Action:** Start the Round Robin tournament

**Steps:**

1. As the tournament creator, click "Start Tournament"
2. Confirm the action in the dialog

**Expected Result:**

- Tournament status changes to "started"
- All matches are generated automatically
- For 4 players, expect 6 total matches (3 rounds with 2 matches each)

### 4. Verify Match Generation

**Action:** Check that all Round Robin matches are created correctly

**Expected Result:**

- **Round 1:** 2 matches (Player 1 vs Player 2, Player 3 vs Player 4)
- **Round 2:** 2 matches (Player 1 vs Player 3, Player 2 vs Player 4)
- **Round 3:** 2 matches (Player 1 vs Player 4, Player 2 vs Player 3)

### 5. Play Through All Matches

**Action:** Complete all tournament matches

**Steps:**

1. For each match, click on the winner button
2. Alternate winners to create varied standings
3. Example outcome:
   - Player 1 wins 3 matches
   - Player 2 wins 2 matches
   - Player 3 wins 1 match
   - Player 4 wins 0 matches

**Expected Result:** All 6 matches show as "COMPLETED" with winners assigned

### 6. Verify Standings

**Action:** Check the tournament standings

**Expected Result:**

- Player 1: 3 wins, 0 losses, 9 points (1st place)
- Player 2: 2 wins, 1 loss, 6 points (2nd place)
- Player 3: 1 win, 2 losses, 3 points (3rd place)
- Player 4: 0 wins, 3 losses, 0 points (4th place)

### 7. Complete the Tournament

**Action:** Finalize the tournament

**Steps:**

1. As the tournament creator, click "Complete Tournament"
2. Confirm the action

**Expected Result:**

- Tournament status changes to "completed"
- Tournament results are saved
- Winner is declared as Player 1

### 8. Verify Tournament Results

**Action:** Check the tournament history

**Steps:**

1. Navigate to "Tournament History"
2. Find the completed Round Robin tournament
3. Click to view details

**Expected Result:**

- Tournament shows final standings
- All match results are visible
- Winner is prominently displayed
- Tournament is marked as completed

## Edge Cases to Test

### 1. Odd Number of Participants

**Test with 3 or 5 players**

- System should handle byes correctly
- Each player should get appropriate number of matches

### 2. Minimum Participants

**Test with exactly 2 players**

- Should generate 1 match
- Tournament should complete correctly

### 3. Maximum Participants

**Test with 8+ players**

- Verify all matches are generated
- Check performance with larger tournaments

### 4. Tournament Cancellation

**Test cancelling mid-tournament**

- Verify matches can be reset
- Tournament can be restarted

## API Testing

### Test Round Robin Endpoints

1. **Start Tournament:**

```bash
curl -X POST http://localhost:3000/api/trpc/tournamentRoundRobin.startRoundRobinTournament \
  -H "Content-Type: application/json" \
  -d '{"json": {"id": "tournament-id-here"}}'
```

2. **Get Standings:**

```bash
curl http://localhost:3000/api/trpc/tournamentRoundRobin.getRoundRobinStandings \
  -H "Content-Type: application/json" \
  -d '{"json": {"tournamentId": "tournament-id-here"}}'
```

3. **Complete Tournament:**

```bash
curl -X POST http://localhost:3000/api/trpc/tournamentRoundRobin.completeRoundRobinTournament \
  -H "Content-Type: application/json" \
  -d '{"json": {"tournamentId": "tournament-id-here"}}'
```

## Algorithm Verification

The Round Robin algorithm should generate the following for different participant counts:

- **2 players:** 1 match (1 round)
- **3 players:** 3 matches (3 rounds, 1 bye per round)
- **4 players:** 6 matches (3 rounds, 2 matches per round)
- **5 players:** 10 matches (5 rounds, 2 matches per round, 1 bye per round)
- **6 players:** 15 matches (5 rounds, 3 matches per round)

## Manual Algorithm Test

You can test the Round Robin pairing algorithm manually by running:

```bash
node test-round-robin-algorithm.js
```

This will verify the pairing logic works correctly for different participant counts.

## Troubleshooting

### Common Issues

1. **Tournament won't start:** Ensure you have at least 2 participants
2. **Matches not generating:** Check that the tournament has the correct bracket type
3. **Standings incorrect:** Verify all matches have been completed
4. **Tournament won't complete:** Ensure all matches are marked as completed

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API endpoints are responding correctly
3. Check database for correct tournament and match data
4. Ensure all participants have selected decks

## Success Criteria

✅ Tournament created with Round Robin format  
✅ All participants can join and select decks  
✅ Tournament starts successfully  
✅ All matches generated correctly  
✅ Matches can be completed with winners  
✅ Standings calculated accurately  
✅ Tournament can be completed  
✅ Results saved to tournament history

Once all these steps pass successfully, the Round Robin tournament system is fully functional!

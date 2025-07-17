# Swiss Tournament End-to-End Test Guide

This guide provides a comprehensive test for the Swiss tournament functionality in the Yu-Gi-Oh! tournament system.

## Overview

Swiss tournaments pair players based on their current win/loss record, ensuring competitive matches throughout the tournament. This format is excellent for medium to large tournaments where elimination isn't desired.

## Test Prerequisites

1. Ensure the development server is running: `npm run dev`
2. Have at least 8 test users registered in the system
3. Have at least 8 test decks created

## Test Steps

### 1. Create a Swiss Tournament

**Action:** Create a new tournament with Swiss format

**Steps:**

1. Navigate to the tournaments page
2. Click "Create Tournament"
3. Fill in tournament details:
   - Name: "Test Swiss Tournament"
   - Size: 8 (or any number 4-32)
   - Bracket Type: "Swiss"
   - Rules: "Standard Yu-Gi-Oh! rules"
   - Prize: "Test Prize"
   - Start Date: Today
   - End Date: Next week
4. Submit the form

**Expected Result:** Tournament created successfully with Swiss format selected

### 2. Add Participants

**Action:** Add 8 test participants to the tournament

**Steps:**

1. Navigate to the tournament details page
2. Click "Join Tournament" with different test users
3. Each user should select a deck when joining
4. Verify 8 participants are registered

**Expected Result:** Tournament shows 8 participants with their selected decks

### 3. Start the Tournament

**Action:** Start the Swiss tournament

**Steps:**

1. As the tournament creator, click "Start Tournament"
2. Confirm the action in the dialog

**Expected Result:**

- Tournament status changes to "started"
- Round 1 matches are generated automatically
- For 8 players, expect 4 matches in Round 1

### 4. Verify Round 1 Pairings

**Action:** Check that Swiss Round 1 pairings are created correctly

**Expected Result:**

- **Round 1:** 4 matches (random pairings since no previous results)
- All players have exactly 1 match assigned

### 5. Play Through Round 1

**Action:** Complete all Round 1 matches

**Steps:**

1. For each match, click on the winner button
2. Create varied results (some 1-0, some 0-1 records)
3. Example outcome:
   - 4 players with 1-0 records
   - 4 players with 0-1 records

**Expected Result:** All 4 matches show as "COMPLETED" with winners assigned

### 6. Generate Round 2 Pairings

**Action:** Create Round 2 pairings based on Round 1 results

**Steps:**

1. Click "Generate Next Round" or let system auto-generate
2. Verify new pairings are created

**Expected Result:**

- **Round 2:** 4 matches
- Players paired with similar records (1-0 vs 1-0, 0-1 vs 0-1)
- No player plays the same opponent twice

### 7. Continue Through All Rounds

**Action:** Complete the full Swiss tournament

**Steps:**

1. Complete Round 2 matches
2. Generate Round 3 pairings
3. Continue for 4-5 total rounds (standard for 8 players)
4. Each round pairs players with similar cumulative records

**Expected Result:** Tournament completes after appropriate number of rounds

### 8. Verify Final Standings

**Action:** Check the final tournament standings

**Expected Result:**

- Players ranked by number of wins
- Tiebreakers applied for players with same records
- Clear winner determined

### 9. Complete the Tournament

**Action:** Finalize the tournament

**Steps:**

1. As the tournament creator, click "Complete Tournament"
2. Confirm the action

**Expected Result:**

- Tournament status changes to "completed"
- Tournament results are saved
- Winner is declared based on final standings

### 10. Verify Tournament Results

**Action:** Check the tournament history

**Steps:**

1. Navigate to "Tournament History"
2. Find the completed Swiss tournament
3. Click to view details

**Expected Result:**

- Tournament shows final standings
- All match results are visible
- Winner is prominently displayed
- Tournament is marked as completed

## Edge Cases to Test

### 1. Odd Number of Participants

**Test with 7 or 9 players**

- System should handle byes correctly
- Lowest-ranked player gets the bye each round

### 2. Minimum Participants

**Test with exactly 4 players**

- Should generate 3 rounds
- Each player gets 3 matches

### 3. Maximum Participants

**Test with 16+ players**

- Verify all rounds generate correctly
- Check performance with larger tournaments

### 4. Tiebreaker Scenarios

**Create intentional ties**

- Test tiebreaker calculations
- Verify correct ranking when records are identical

## API Testing

### Test Swiss Endpoints

1. **Start Tournament:**

```bash
curl -X POST http://localhost:3000/api/trpc/tournamentSwiss.startSwissTournament \
  -H "Content-Type: application/json" \
  -d '{"json": {"id": "tournament-id-here"}}'
```

2. **Get Standings:**

```bash
curl http://localhost:3000/api/trpc/tournamentSwiss.getSwissStandings \
  -H "Content-Type: application/json" \
  -d '{"json": {"tournamentId": "tournament-id-here"}}'
```

3. **Generate Next Round:**

```bash
curl -X POST http://localhost:3000/api/trpc/tournamentSwiss.generateSwissPairings \
  -H "Content-Type: application/json" \
  -d '{"json": {"tournamentId": "tournament-id-here"}}'
```

4. **Complete Tournament:**

```bash
curl -X POST http://localhost:3000/api/trpc/tournamentSwiss.completeSwissTournament \
  -H "Content-Type: application/json" \
  -d '{"json": {"tournamentId": "tournament-id-here"}}'
```

## Manual Algorithm Test

You can test the Swiss pairing algorithm manually by running:

```bash
node test-swiss-algorithm.js
```

This will verify the pairing logic works correctly for different participant counts and scenarios.

## Troubleshooting

### Common Issues

1. **Tournament won't start:** Ensure you have at least 4 participants
2. **Pairings not generating:** Check that previous round is complete
3. **Standings incorrect:** Verify all matches have been completed
4. **Tournament won't complete:** Ensure all rounds are finished

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API endpoints are responding correctly
3. Check database for correct tournament and match data
4. Ensure all participants have selected decks

## Success Criteria

✅ Tournament created with Swiss format  
✅ All participants can join and select decks  
✅ Tournament starts successfully  
✅ All rounds generate correctly  
✅ Swiss pairing algorithm works properly  
✅ Matches can be completed with winners  
✅ Standings calculated accurately after each round  
✅ Tournament can be completed  
✅ Results saved to tournament history

Once all these steps pass successfully, the Swiss tournament system is fully functional!

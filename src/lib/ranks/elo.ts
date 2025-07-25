// The k-factor used in the ELO rating system
const kFactor = 32;

// Maximum ELO rating cap
const maxElo = 3000;

/**
 * Calculates the expected score for a player based on the ELO rating system
 * @param challenger The rating of the challenger player
 * @param challenged The rating of the challenged player
 * @returns The expected score for the challenger (0-1)
 */
function getExpectedScore(challenger: number, challenged: number): number {
  return 1 / (1 + 10 ** ((challenged - challenger) / 400));
}

/**
 * Calculates a new rating for a player based on the ELO rating system
 * @param challenger The current rating of the challenger player
 * @param challenged The current rating of the challenged player
 * @param score The actual score (1 for win, 0 for loss, 0.5 for draw)
 * @returns The new rating for the challenger player
 */
function getNewRating(
  challenger: number,
  challenged: number,
  score: number,
): number {
  const newRating = Math.round(
    challenger + kFactor * (score - getExpectedScore(challenger, challenged)),
  );

  // Ensure the rating doesn't exceed the maximum ELO cap
  return Math.min(newRating, maxElo);
}

/**
 * Calculates new ratings for both players based on the match result
 * @param challenger The current rating of the challenger player
 * @param challenged The current rating of the challenged player
 * @param result The result of the match ("win", "loss", or "draw")
 * @returns A tuple containing the new ratings for [challenger, challenged]
 */
function getNewRatings(
  challenger: number,
  challenged: number,
  result: string,
): [number, number] {
  switch (result) {
    case "win":
      return [
        getNewRating(challenger, challenged, 1),
        getNewRating(challenged, challenger, 0),
      ];
    case "loss":
      return [
        getNewRating(challenger, challenged, 0),
        getNewRating(challenged, challenger, 1),
      ];
    case "draw":
      return [
        getNewRating(challenger, challenged, 0.5),
        getNewRating(challenged, challenger, 0.5),
      ];
    default:
      throw new Error(`Invalid result: ${result}`);
  }
}

export { getExpectedScore, getNewRating, getNewRatings, maxElo };

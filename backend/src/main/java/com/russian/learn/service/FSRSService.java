package com.russian.learn.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class FSRSService {

    // FSRS-6 default parameters
    private static final double W0 = 0.4;
    private static final double W1 = 0.6;
    private static final double W2 = 2.4;
    private static final double W3 = 5.8;
    private static final double W4 = 4.93;
    private static final double W5 = 0.94;
    private static final double W6 = 0.86;
    private static final double W7 = 0.01;
    private static final double W8 = 1.49;
    private static final double W9 = 0.14;
    private static final double W10 = 0.94;
    private static final double W11 = 2.18;
    private static final double W12 = 0.05;
    private static final double W13 = 0.34;
    private static final double W14 = 1.26;
    private static final double W15 = 0.29;
    private static final double W16 = 2.61;

    // Rating values: again=1, hard=2, good=3, easy=4
    private static final int RATING_AGAIN = 1;
    private static final int RATING_HARD = 2;
    private static final int RATING_GOOD = 3;
    private static final int RATING_EASY = 4;

    private static final double DECAY = -0.5;
    private static final double FACTOR = Math.pow(0.9, 1.0 / DECAY) - 1.0;

    public static class FSRSResult {
        public double difficulty;
        public double stability;
        public double retrievability;
        public LocalDateTime nextDue;
        public String status;

        public FSRSResult(double difficulty, double stability, double retrievability, LocalDateTime nextDue, String status) {
            this.difficulty = difficulty;
            this.stability = stability;
            this.retrievability = retrievability;
            this.nextDue = nextDue;
            this.status = status;
        }
    }

    /**
     * Calculate next review parameters based on FSRS-6 algorithm.
     *
     * @param currentDifficulty Current difficulty (1-10)
     * @param currentStability  Current stability (in days)
     * @param rating            Rating: "again", "hard", "good", "easy"
     * @param currentStatus     Current status: "new", "learning", "review", "mature"
     * @param lastReview        Last review timestamp
     * @param reviewCount       Total review count
     * @return FSRSResult with new difficulty, stability, retrievability, due date, and status
     */
    public FSRSResult calculateNextReview(Double currentDifficulty, Double currentStability,
                                          String rating, String currentStatus,
                                          LocalDateTime lastReview, int reviewCount) {

        int ratingValue = switch (rating.toLowerCase()) {
            case "again" -> RATING_AGAIN;
            case "hard" -> RATING_HARD;
            case "good" -> RATING_GOOD;
            case "easy" -> RATING_EASY;
            default -> RATING_GOOD;
        };

        boolean isFirstReview = (currentDifficulty == null || currentStability == null
                || "new".equals(currentStatus) || reviewCount == 0);

        double difficulty;
        double stability;

        if (isFirstReview) {
            // First encounter: initialize difficulty and stability
            difficulty = initDifficulty(ratingValue);
            stability = initStability(ratingValue);
        } else {
            difficulty = currentDifficulty;
            stability = currentStability;

            // Calculate retrievability from elapsed time
            double elapsedDays = 0;
            if (lastReview != null) {
                elapsedDays = java.time.Duration.between(lastReview, LocalDateTime.now()).toHours() / 24.0;
            }
            double retrievability = Math.exp(DECAY * elapsedDays / stability);

            // Update difficulty
            difficulty = updateDifficulty(difficulty, ratingValue);

            // Update stability based on rating
            stability = updateStability(stability, retrievability, difficulty, ratingValue);
        }

        // Clamp difficulty
        difficulty = Math.max(1.0, Math.min(10.0, difficulty));

        // Ensure stability is at least 0.01 days
        stability = Math.max(0.01, stability);

        // Calculate next due date
        int intervalDays = Math.max(1, (int) Math.round(stability));
        LocalDateTime nextDue = LocalDateTime.now().plusDays(intervalDays);

        // Calculate new retrievability at next due date (should be ~target retention)
        double newRetrievability = Math.exp(DECAY * intervalDays / stability);

        // Determine new status
        String newStatus;
        if ("again".equals(rating.toLowerCase()) && ("new".equals(currentStatus) || "learning".equals(currentStatus))) {
            newStatus = "learning";
        } else if (intervalDays >= 21) {
            newStatus = "mature";
        } else if (intervalDays >= 1) {
            newStatus = "review";
        } else {
            newStatus = "learning";
        }

        return new FSRSResult(difficulty, stability, newRetrievability, nextDue, newStatus);
    }

    private double initDifficulty(int rating) {
        return W4 - Math.exp(W5 * (rating - 1)) + 1;
    }

    private double initStability(int rating) {
        return Math.max(0.1, W0 + W1 * (rating - 1));
    }

    private double updateDifficulty(double difficulty, int rating) {
        // Mean reversion
        double meanReversion = W7 * (initDifficulty(RATING_EASY) - difficulty);
        // Difficulty update
        double delta = -W6 * (rating - 3);
        return difficulty + meanReversion + delta;
    }

    private double updateStability(double stability, double retrievability, double difficulty, int rating) {
        double hardPenalty = (rating == RATING_HARD) ? W15 : 1.0;
        double easyBonus = (rating == RATING_EASY) ? (1.0 + W16) : 1.0;

        double difficultyFactor = Math.pow(difficulty, -W9);
        double stabilityFactor = Math.exp(W10 * (1 - retrievability));
        double recallFactor = stabilityFactor * difficultyFactor * hardPenalty * easyBonus;

        double newStability;

        if (rating == RATING_AGAIN) {
            // Lapse: stability decreases significantly
            double lapsePenalty = Math.pow(stability, W11) * Math.exp(W12 * (1 - retrievability)) - 1;
            newStability = Math.max(0.01, stability / (1 + lapsePenalty));
        } else {
            // Successful review: stability increases
            newStability = stability * (1 + recallFactor);
        }

        return newStability;
    }

    /**
     * Get rating value from string.
     */
    public static int getRatingValue(String rating) {
        return switch (rating.toLowerCase()) {
            case "again" -> RATING_AGAIN;
            case "hard" -> RATING_HARD;
            case "good" -> RATING_GOOD;
            case "easy" -> RATING_EASY;
            default -> RATING_GOOD;
        };
    }
}

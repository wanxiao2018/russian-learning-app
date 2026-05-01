package com.russian.learn.service;

import com.russian.learn.dto.ReviewRequest;
import com.russian.learn.dto.ReviewResponse;
import com.russian.learn.dto.UserStatsResponse;
import com.russian.learn.dto.VocabResponse;
import com.russian.learn.entity.DailyStats;
import com.russian.learn.entity.UserVocab;
import com.russian.learn.entity.Vocab;
import com.russian.learn.entity.VocabEpisode;
import com.russian.learn.repository.DailyStatsRepository;
import com.russian.learn.repository.UserVocabRepository;
import com.russian.learn.repository.VocabRepository;
import com.russian.learn.repository.VocabEpisodeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LearningService {

    private final UserVocabRepository userVocabRepository;
    private final VocabRepository vocabRepository;
    private final DailyStatsRepository dailyStatsRepository;
    private final FSRSService fsrsService;
    private final VocabEpisodeRepository vocabEpisodeRepository;

    public LearningService(UserVocabRepository userVocabRepository,
                           VocabRepository vocabRepository,
                           DailyStatsRepository dailyStatsRepository,
                           FSRSService fsrsService,
                           VocabEpisodeRepository vocabEpisodeRepository) {
        this.userVocabRepository = userVocabRepository;
        this.vocabRepository = vocabRepository;
        this.dailyStatsRepository = dailyStatsRepository;
        this.fsrsService = fsrsService;
        this.vocabEpisodeRepository = vocabEpisodeRepository;
    }

    public List<Map<String, Object>> getDueCards(Long userId) {
        List<UserVocab> dueCards = userVocabRepository
                .findByUserIdAndDueDateBefore(userId, LocalDate.now().plusDays(1), PageRequest.of(0, 50));

        return dueCards.stream().map(uv -> {
            Vocab vocab = vocabRepository.findById(uv.getVocabId()).orElse(null);
            if (vocab == null) return null;

            Map<String, Object> card = new HashMap<>();
            card.put("userVocabId", uv.getId());
            card.put("vocabId", uv.getVocabId());
            card.put("word", vocab.getWord());
            card.put("stress", vocab.getStress());
            card.put("chinese", vocab.getChinese());
            card.put("pos", vocab.getPos());
            card.put("level", vocab.getLevel());
            card.put("status", uv.getStatus());
            card.put("difficulty", uv.getDifficulty());
            card.put("stability", uv.getStability());
            card.put("retrievability", uv.getRetrievability());
            card.put("dueDate", uv.getDueDate());
            card.put("reviewCount", uv.getReviewCount());
            card.put("sentences", getExampleSentences(vocab.getId()));
            return card;
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    @Transactional
    public ReviewResponse submitReview(Long userId, ReviewRequest request) {
        UserVocab userVocab = userVocabRepository.findByUserIdAndVocabId(userId, request.getVocabId())
                .orElse(null);

        boolean isNew = false;
        if (userVocab == null) {
            // Create new user-vocab entry
            userVocab = new UserVocab();
            userVocab.setUserId(userId);
            userVocab.setVocabId(request.getVocabId());
            userVocab.setStatus("new");
            userVocab.setFirstSeen(LocalDateTime.now());
            userVocab.setReviewCount(0);
            userVocab.setCorrectCount(0);
            userVocab.setLapseCount(0);
            isNew = true;
        }

        // Run FSRS algorithm
        FSRSService.FSRSResult result = fsrsService.calculateNextReview(
                userVocab.getDifficulty(),
                userVocab.getStability(),
                request.getRating(),
                userVocab.getStatus(),
                userVocab.getLastReview(),
                userVocab.getReviewCount()
        );

        // Update user vocab
        userVocab.setDifficulty(result.difficulty);
        userVocab.setStability(result.stability);
        userVocab.setRetrievability(result.retrievability);
        userVocab.setDueDate(result.nextDue);
        userVocab.setLastReview(LocalDateTime.now());
        userVocab.setLastRating(request.getRating());
        userVocab.setReviewCount(userVocab.getReviewCount() + 1);
        userVocab.setStatus(result.status);

        if ("again".equals(request.getRating())) {
            userVocab.setLapseCount(userVocab.getLapseCount() + 1);
        } else {
            userVocab.setCorrectCount(userVocab.getCorrectCount() + 1);
        }

        userVocabRepository.save(userVocab);

        // Update daily stats
        updateDailyStats(userId, isNew, !"again".equals(request.getRating()));

        return ReviewResponse.builder()
                .nextDue(result.nextDue)
                .newStability(result.stability)
                .newDifficulty(result.difficulty)
                .newStatus(result.status)
                .build();
    }

    public UserStatsResponse getStats(Long userId) {
        long totalWords = userVocabRepository.countByUserId(userId);
        long newWords = userVocabRepository.countByUserIdAndStatus(userId, "new");
        long learningWords = userVocabRepository.countByUserIdAndStatus(userId, "learning");
        long reviewWords = userVocabRepository.countByUserIdAndStatus(userId, "review");
        long matureWords = userVocabRepository.countByUserIdAndStatus(userId, "mature");
        
        // 计算可学习的新词总数（词库总数 - 已学词汇）
        long totalVocabCount = vocabRepository.count();
        long availableNewWords = totalVocabCount - totalWords;

        LocalDate today = LocalDate.now();
        Optional<DailyStats> todayStats = dailyStatsRepository.findByUserIdAndStudyDate(userId, today);

        // Get last 7 days of stats
        LocalDate weekAgo = today.minusDays(7);
        List<DailyStats> recentStats = dailyStatsRepository.findByUserIdAndStudyDateBetween(userId, weekAgo, today);

        List<Map<String, Object>> recentDays = recentStats.stream().map(ds -> {
            Map<String, Object> day = new HashMap<>();
            day.put("date", ds.getStudyDate().toString());
            day.put("newWords", ds.getNewWords());
            day.put("reviewedWords", ds.getReviewedWords());
            day.put("correctRate", ds.getCorrectRate());
            day.put("studySeconds", ds.getStudySeconds());
            return day;
        }).collect(Collectors.toList());

        return UserStatsResponse.builder()
                .totalWords(totalWords)
                .newWords(newWords)
                .learningWords(learningWords)
                .reviewWords(reviewWords)
                .matureWords(matureWords)
                .availableNewWords(availableNewWords)
                .todayNewWords(todayStats.map(DailyStats::getNewWords).orElse(0))
                .todayReviewedWords(todayStats.map(DailyStats::getReviewedWords).orElse(0))
                .todayCorrectRate(todayStats.map(DailyStats::getCorrectRate).orElse(0.0))
                .todayStudySeconds(todayStats.map(DailyStats::getStudySeconds).orElse(0))
                .recentDays(recentDays)
                .build();
    }

    public List<Map<String, Object>> getNewWords(Long userId, int count) {
        // Get words not yet in user's vocab that have Chinese translations
        List<Vocab> topVocab = vocabRepository.findWordsWithChinese(PageRequest.of(0, count * 3));

        // Filter out already-learned words
        return topVocab.stream()
                .filter(v -> userVocabRepository.findByUserIdAndVocabId(userId, v.getId()).isEmpty())
                .limit(count)
                .map(v -> {
                    Map<String, Object> word = new HashMap<>();
                    word.put("vocabId", v.getId());
                    word.put("word", v.getWord());
                    word.put("stress", v.getStress());
                    word.put("chinese", v.getChinese());
                    word.put("pos", v.getPos());
                    word.put("level", v.getLevel());
                    word.put("frequency", v.getFrequency());
                    word.put("sentences", getExampleSentences(v.getId()));
                    return word;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, String>> getExampleSentences(Long vocabId) {
        List<VocabEpisode> vocabEpisodes = vocabEpisodeRepository.findByVocabId(vocabId);
        List<Map<String, String>> sentences = new ArrayList<>();
        for (VocabEpisode ve : vocabEpisodes) {
            if (ve.getContextSentence() != null && !ve.getContextSentence().isEmpty()) {
                Map<String, String> s = new HashMap<>();
                s.put("ru", ve.getContextSentence());
                s.put("cn", ve.getContextTranslation() != null ? ve.getContextTranslation() : "");
                sentences.add(s);
            }
        }
        return sentences;
    }

    private void updateDailyStats(Long userId, boolean isNew, boolean isCorrect) {
        LocalDate today = LocalDate.now();
        DailyStats stats = dailyStatsRepository.findByUserIdAndStudyDate(userId, today)
                .orElseGet(() -> {
                    DailyStats newStats = new DailyStats();
                    newStats.setUserId(userId);
                    newStats.setStudyDate(today);
                    newStats.setNewWords(0);
                    newStats.setReviewedWords(0);
                    newStats.setStudySeconds(0);
                    return newStats;
                });

        if (isNew) {
            stats.setNewWords(stats.getNewWords() + 1);
        } else {
            stats.setReviewedWords(stats.getReviewedWords() + 1);
        }

        // Recalculate correct rate
        int totalReviewed = stats.getReviewedWords();
        if (totalReviewed > 0) {
            // Approximate correct rate tracking
            double currentCorrect = (stats.getCorrectRate() != null ? stats.getCorrectRate() : 0.0) * (totalReviewed - 1);
            double newRate = (currentCorrect + (isCorrect ? 1.0 : 0.0)) / totalReviewed;
            stats.setCorrectRate(Math.round(newRate * 100.0) / 100.0);
        }

        dailyStatsRepository.save(stats);
    }
}

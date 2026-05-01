package com.russian.learn.controller;

import com.russian.learn.dto.ReviewRequest;
import com.russian.learn.dto.ReviewResponse;
import com.russian.learn.dto.UserStatsResponse;
import com.russian.learn.service.LearningService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final LearningService learningService;

    public LearningController(LearningService learningService) {
        this.learningService = learningService;
    }

    @GetMapping("/due")
    public ResponseEntity<List<Map<String, Object>>> getDueCards(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Map<String, Object>> cards = learningService.getDueCards(userId);
        return ResponseEntity.ok(cards);
    }

    @PostMapping("/review")
    public ResponseEntity<ReviewResponse> submitReview(
            HttpServletRequest request,
            @Valid @RequestBody ReviewRequest reviewRequest) {
        Long userId = (Long) request.getAttribute("userId");
        ReviewResponse response = learningService.submitReview(userId, reviewRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getStats(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        UserStatsResponse response = learningService.getStats(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/new-words")
    public ResponseEntity<List<Map<String, Object>>> getNewWords(
            HttpServletRequest request,
            @RequestParam(defaultValue = "20") int count) {
        Long userId = (Long) request.getAttribute("userId");
        List<Map<String, Object>> words = learningService.getNewWords(userId, count);
        return ResponseEntity.ok(words);
    }
}

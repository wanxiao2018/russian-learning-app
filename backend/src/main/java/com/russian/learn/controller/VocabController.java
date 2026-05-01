package com.russian.learn.controller;

import com.russian.learn.dto.VocabListResponse;
import com.russian.learn.dto.VocabResponse;
import com.russian.learn.service.VocabService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocab")
public class VocabController {

    private final VocabService vocabService;

    public VocabController(VocabService vocabService) {
        this.vocabService = vocabService;
    }

    @GetMapping
    public ResponseEntity<VocabListResponse> list(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "freq") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        VocabListResponse response = vocabService.list(level, search, sort, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VocabResponse> getById(@PathVariable Long id) {
        VocabResponse response = vocabService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-episode/{episodeId}")
    public ResponseEntity<List<VocabResponse>> getByEpisode(@PathVariable Long episodeId) {
        List<VocabResponse> response = vocabService.getByEpisode(episodeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/random-quiz")
    public ResponseEntity<List<VocabResponse>> randomQuiz(
            @RequestParam(defaultValue = "10") int count) {
        List<VocabResponse> response = vocabService.getRandomQuiz(count);
        return ResponseEntity.ok(response);
    }
}

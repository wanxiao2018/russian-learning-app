package com.russian.learn.controller;

import com.russian.learn.dto.EpisodeResponse;
import com.russian.learn.service.EpisodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/episodes")
public class EpisodeController {

    private final EpisodeService episodeService;

    public EpisodeController(EpisodeService episodeService) {
        this.episodeService = episodeService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> response = episodeService.list(level, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EpisodeResponse> getById(@PathVariable Long id) {
        EpisodeResponse response = episodeService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/materials")
    public ResponseEntity<Map<String, Object>> getMaterials(@PathVariable Long id) {
        Map<String, Object> response = episodeService.getMaterials(id);
        return ResponseEntity.ok(response);
    }
}

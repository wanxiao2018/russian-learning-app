package com.russian.learn.service;

import com.russian.learn.dto.EpisodeResponse;
import com.russian.learn.entity.Episode;
import com.russian.learn.entity.VocabEpisode;
import com.russian.learn.repository.EpisodeRepository;
import com.russian.learn.repository.VocabEpisodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EpisodeService {

    private final EpisodeRepository episodeRepository;
    private final VocabEpisodeRepository vocabEpisodeRepository;

    public EpisodeService(EpisodeRepository episodeRepository,
                          VocabEpisodeRepository vocabEpisodeRepository) {
        this.episodeRepository = episodeRepository;
        this.vocabEpisodeRepository = vocabEpisodeRepository;
    }

    public Map<String, Object> list(String level, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("episodeNumber").ascending());
        Page<Episode> episodePage;

        if (level != null && !level.isEmpty()) {
            episodePage = episodeRepository.findByLevel(level, pageable);
        } else {
            episodePage = episodeRepository.findAll(pageable);
        }

        List<EpisodeResponse> items = episodePage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total", episodePage.getTotalElements());
        result.put("page", episodePage.getNumber());
        result.put("size", episodePage.getSize());
        result.put("totalPages", episodePage.getTotalPages());
        return result;
    }

    public EpisodeResponse getById(Long id) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Episode not found"));
        return toResponse(episode);
    }

    public Map<String, Object> getMaterials(Long episodeId) {
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new RuntimeException("Episode not found"));

        List<VocabEpisode> vocabEpisodes = vocabEpisodeRepository.findByEpisodeId(episodeId);

        Map<String, Object> result = new HashMap<>();
        result.put("episode", toResponse(episode));
        result.put("vocabContexts", vocabEpisodes.stream().map(ve -> {
            Map<String, Object> ctx = new HashMap<>();
            ctx.put("vocabId", ve.getVocabId());
            ctx.put("contextSentence", ve.getContextSentence());
            ctx.put("contextTranslation", ve.getContextTranslation());
            return ctx;
        }).collect(Collectors.toList()));

        return result;
    }

    private EpisodeResponse toResponse(Episode episode) {
        EpisodeResponse response = new EpisodeResponse();
        response.setId(episode.getId());
        response.setEpisodeNumber(episode.getEpisodeNumber());
        response.setTitle(episode.getTitle());
        response.setTitleCn(episode.getTitleCn());
        response.setLevel(episode.getLevel());
        response.setSummary(episode.getSummary());
        response.setTags(episode.getTags());
        response.setWordCount(episode.getWordCount());
        return response;
    }
}

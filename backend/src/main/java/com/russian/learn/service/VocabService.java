package com.russian.learn.service;

import com.russian.learn.dto.VocabListResponse;
import com.russian.learn.dto.VocabResponse;
import com.russian.learn.entity.Vocab;
import com.russian.learn.entity.VocabEpisode;
import com.russian.learn.entity.Episode;
import com.russian.learn.repository.VocabEpisodeRepository;
import com.russian.learn.repository.VocabRepository;
import com.russian.learn.repository.EpisodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VocabService {

    private final VocabRepository vocabRepository;
    private final VocabEpisodeRepository vocabEpisodeRepository;
    private final EpisodeRepository episodeRepository;

    public VocabService(VocabRepository vocabRepository, 
                        VocabEpisodeRepository vocabEpisodeRepository,
                        EpisodeRepository episodeRepository) {
        this.vocabRepository = vocabRepository;
        this.vocabEpisodeRepository = vocabEpisodeRepository;
        this.episodeRepository = episodeRepository;
    }

    public VocabListResponse list(String level, String search, String sort, int page, int size) {
        Pageable pageable;
        
        // Determine sort order
        if ("alpha".equals(sort)) {
            pageable = PageRequest.of(page, size, Sort.by("word").ascending());
        } else if ("random".equals(sort)) {
            // For random, we'll fetch all and shuffle client-side, or use native query
            pageable = PageRequest.of(page, size, Sort.by("frequency").descending());
        } else {
            pageable = PageRequest.of(page, size, Sort.by("frequency").descending());
        }
        
        Page<Vocab> vocabPage;
        String dbLevel = mapLevelToDatabase(level);

        if (dbLevel != null && !dbLevel.isEmpty() && search != null && !search.isEmpty()) {
            vocabPage = vocabRepository.findByLevelAndWordContaining(dbLevel, search, pageable);
        } else if (dbLevel != null && !dbLevel.isEmpty()) {
            vocabPage = vocabRepository.findByLevel(dbLevel, pageable);
        } else if (search != null && !search.isEmpty()) {
            vocabPage = vocabRepository.findByWordContaining(search, pageable);
        } else {
            vocabPage = vocabRepository.findAll(pageable);
        }

        List<VocabResponse> items = vocabPage.getContent().stream()
                .map(v -> toResponse(v, false))
                .collect(Collectors.toList());

        return VocabListResponse.builder()
                .items(items)
                .total(vocabPage.getTotalElements())
                .page(vocabPage.getNumber())
                .size(vocabPage.getSize())
                .totalPages(vocabPage.getTotalPages())
                .build();
    }

    private String mapLevelToDatabase(String level) {
        if (level == null || level.isEmpty()) return null;
        switch (level) {
            case "A1": return "A1";
            case "A2": return "A2-B1";
            case "B1": return "B1-B2";
            case "B2": return "B2-C1";
            default: return level;
        }
    }

    public VocabResponse getById(Long id) {
        Vocab vocab = vocabRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vocab not found"));
        return toResponse(vocab, true);
    }

    public List<VocabResponse> getByEpisode(Long episodeId) {
        List<VocabEpisode> vocabEpisodes = vocabEpisodeRepository.findByEpisodeId(episodeId);
        return vocabEpisodes.stream()
                .map(ve -> {
                    Vocab vocab = vocabRepository.findById(ve.getVocabId()).orElse(null);
                    if (vocab == null) return null;
                    return toResponse(vocab, false);
                })
                .filter(v -> v != null)
                .collect(Collectors.toList());
    }

    public List<VocabResponse> getRandomQuiz(int count) {
        List<Vocab> randomVocab = vocabRepository.findRandomWordsWithChinese(count);
        return randomVocab.stream()
                .map(v -> toResponse(v, false))
                .collect(Collectors.toList());
    }

    private VocabResponse toResponse(Vocab vocab, boolean includeSentences) {
        VocabResponse response = new VocabResponse();
        response.setId(vocab.getId());
        response.setWord(vocab.getWord());
        response.setStress(vocab.getStress());
        response.setChinese(vocab.getChinese());
        response.setPos(vocab.getPos());
        response.setLevel(vocab.getLevel());
        
        // Fetch example sentences if requested
        if (includeSentences) {
            List<VocabEpisode> vocabEpisodes = vocabEpisodeRepository.findByVocabId(vocab.getId());
            List<VocabResponse.SentenceDto> sentences = new ArrayList<>();
            
            for (VocabEpisode ve : vocabEpisodes) {
                if (ve.getContextSentence() != null && !ve.getContextSentence().isEmpty()) {
                    VocabResponse.SentenceDto sentence = new VocabResponse.SentenceDto();
                    sentence.setRu(ve.getContextSentence());
                    sentence.setCn(ve.getContextTranslation());
                    sentence.setEpisodeId(ve.getEpisodeId());
                    
                    // Get episode number
                    Episode episode = episodeRepository.findById(ve.getEpisodeId()).orElse(null);
                    if (episode != null) {
                        sentence.setEpisodeNumber(episode.getEpisodeNumber());
                    }
                    
                    sentences.add(sentence);
                }
            }
            
            response.setSentences(sentences);
        }
        
        return response;
    }
}

package com.russian.learn.repository;

import com.russian.learn.entity.VocabEpisode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabEpisodeRepository extends JpaRepository<VocabEpisode, Long> {
    List<VocabEpisode> findByVocabId(Long vocabId);
    List<VocabEpisode> findByEpisodeId(Long episodeId);
}

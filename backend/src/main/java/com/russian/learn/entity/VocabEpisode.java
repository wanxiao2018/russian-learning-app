package com.russian.learn.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "vocab_episodes")
@Data
public class VocabEpisode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vocab_id", nullable = false)
    private Long vocabId;

    @Column(name = "episode_id", nullable = false)
    private Long episodeId;

    @Column(name = "context_sentence", columnDefinition = "TEXT")
    private String contextSentence;

    @Column(name = "context_translation", columnDefinition = "TEXT")
    private String contextTranslation;
}

package com.russian.learn.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "episodes")
@Data
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "episode_number", nullable = false)
    private Integer episodeNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "title_cn", length = 200)
    private String titleCn;

    @Column(length = 20)
    private String level;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 500)
    private String tags;

    @Column(name = "word_count")
    private Integer wordCount;
}

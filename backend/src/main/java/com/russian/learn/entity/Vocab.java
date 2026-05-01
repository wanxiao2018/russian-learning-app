package com.russian.learn.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "vocab")
@Data
public class Vocab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String word;

    @Column(length = 200)
    private String stress;

    @Column(length = 500)
    private String chinese;

    @Column(name = "pos", length = 50)
    private String pos;

    @Column(length = 20)
    private String level;

    @Column
    private Integer frequency;

    @Column(name = "episode_count")
    private Integer episodeCount;
}

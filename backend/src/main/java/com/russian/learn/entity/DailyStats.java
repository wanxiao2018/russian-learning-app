package com.russian.learn.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "daily_stats")
@Data
public class DailyStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @Column(name = "new_words")
    private Integer newWords = 0;

    @Column(name = "reviewed_words")
    private Integer reviewedWords = 0;

    @Column(name = "correct_rate")
    private Double correctRate;

    @Column(name = "study_seconds")
    private Integer studySeconds = 0;
}

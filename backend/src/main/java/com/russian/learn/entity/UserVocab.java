package com.russian.learn.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_vocab")
@Data
public class UserVocab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "vocab_id", nullable = false)
    private Long vocabId;

    @Column(length = 20)
    private String status = "new";

    @Column(precision = 5)
    private Double difficulty;

    @Column(precision = 8)
    private Double stability;

    @Column(precision = 6)
    private Double retrievability;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "last_review")
    private LocalDateTime lastReview;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @Column(name = "correct_count")
    private Integer correctCount = 0;

    @Column(name = "lapse_count")
    private Integer lapseCount = 0;

    @Column(name = "first_seen")
    private LocalDateTime firstSeen;

    @Column(name = "last_rating", length = 20)
    private String lastRating;
}

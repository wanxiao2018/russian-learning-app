package com.russian.learn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
    private LocalDateTime nextDue;
    private Double newStability;
    private Double newDifficulty;
    private String newStatus;
}

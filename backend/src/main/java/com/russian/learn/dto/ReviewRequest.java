package com.russian.learn.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull(message = "vocabId is required")
    private Long vocabId;

    @NotBlank(message = "Rating is required")
    private String rating; // again, hard, good, easy
}

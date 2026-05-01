package com.russian.learn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VocabListResponse {
    private List<VocabResponse> items;
    private long total;
    private int page;
    private int size;
    private int totalPages;
}

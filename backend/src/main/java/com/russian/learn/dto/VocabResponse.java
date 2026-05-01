package com.russian.learn.dto;

import lombok.Data;
import java.util.List;

@Data
public class VocabResponse {
    private Long id;
    private String word;
    private String stress;
    private String chinese;
    private String pos;
    private String level;
    private List<SentenceDto> sentences;
    
    @Data
    public static class SentenceDto {
        private String ru;
        private String cn;
        private Long episodeId;
        private Integer episodeNumber;
    }
}

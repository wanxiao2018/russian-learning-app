package com.russian.learn.dto;

import lombok.Data;

@Data
public class EpisodeResponse {
    private Long id;
    private Integer episodeNumber;
    private String title;
    private String titleCn;
    private String level;
    private String summary;
    private String tags;
    private Integer wordCount;
}

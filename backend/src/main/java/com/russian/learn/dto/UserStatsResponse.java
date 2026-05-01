package com.russian.learn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserStatsResponse {
    private long totalWords;        // 用户已学词汇总数
    private long newWords;          // 用户状态为 new 的词数
    private long learningWords;     // 用户正在学习的词数
    private long reviewWords;       // 用户待复习的词数
    private long matureWords;       // 用户已掌握的词数
    private long availableNewWords; // 可学习的新词总数（词库总数 - 已学）
    private Integer todayNewWords;
    private Integer todayReviewedWords;
    private Double todayCorrectRate;
    private Integer todayStudySeconds;
    private List<Map<String, Object>> recentDays;
}

package com.russian.learn.repository;

import com.russian.learn.entity.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, Long> {
    Optional<DailyStats> findByUserIdAndStudyDate(Long userId, LocalDate studyDate);
    List<DailyStats> findByUserIdAndStudyDateBetween(Long userId, LocalDate start, LocalDate end);
}

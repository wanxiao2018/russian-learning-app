package com.russian.learn.repository;

import com.russian.learn.entity.UserVocab;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserVocabRepository extends JpaRepository<UserVocab, Long> {
    List<UserVocab> findByUserIdAndDueDateBefore(Long userId, LocalDate dueDate, Pageable pageable);
    List<UserVocab> findByUserIdAndStatus(Long userId, String status, Pageable pageable);
    Optional<UserVocab> findByUserIdAndVocabId(Long userId, Long vocabId);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, String status);
}

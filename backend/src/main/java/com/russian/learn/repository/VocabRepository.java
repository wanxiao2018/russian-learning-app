package com.russian.learn.repository;

import com.russian.learn.entity.Vocab;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabRepository extends JpaRepository<Vocab, Long> {
    
    Page<Vocab> findByLevel(String level, Pageable pageable);
    
    Page<Vocab> findByWordContaining(String word, Pageable pageable);
    
    Page<Vocab> findByLevelAndWordContaining(String level, String word, Pageable pageable);
    
    List<Vocab> findTopByOrderByFrequencyDesc(Pageable pageable);
    
    @Query("SELECT v FROM Vocab v WHERE v.chinese IS NOT NULL AND v.chinese != '' ORDER BY v.frequency DESC")
    List<Vocab> findWordsWithChinese(Pageable pageable);
    
    @Query(value = "SELECT * FROM vocab WHERE chinese IS NOT NULL AND chinese != '' ORDER BY RAND() LIMIT :count", nativeQuery = true)
    List<Vocab> findRandomWordsWithChinese(@Param("count") int count);
}

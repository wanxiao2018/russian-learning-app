-- Russian Learning App Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS russian_learning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE russian_learning;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  daily_goal INT DEFAULT 10 COMMENT '每日学习新词数',
  theme VARCHAR(10) DEFAULT 'light' COMMENT 'light/dark',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- 2. 播客集数表
-- ============================================================
CREATE TABLE episodes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  episode_number INT NOT NULL UNIQUE COMMENT 'RRS集数',
  title VARCHAR(255) NOT NULL COMMENT '俄语标题',
  title_cn VARCHAR(255) COMMENT '中文标题',
  level VARCHAR(10) NOT NULL COMMENT 'A1/A1-A2/A2-B1/B1-B2/B2-C1',
  summary TEXT COMMENT '中文摘要',
  tags JSON COMMENT '标签数组',
  word_count INT DEFAULT 0 COMMENT '本集词汇数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_episode_number (episode_number),
  INDEX idx_level (level)
) ENGINE=InnoDB;

-- ============================================================
-- 3. 词汇表（核心）
-- ============================================================
CREATE TABLE vocab (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  word VARCHAR(100) NOT NULL COMMENT '俄语单词（原形/词典形式）',
  stress VARCHAR(100) COMMENT '带重音标记的单词',
  chinese VARCHAR(255) NOT NULL COMMENT '中文释义',
  pos VARCHAR(30) COMMENT '词性 noun.m/noun.f/noun.n/verb/adj/adv/phrase/idiom',
  level VARCHAR(10) NOT NULL COMMENT 'A1/A2/B1/B2',
  frequency INT DEFAULT 0 COMMENT '语料库中出现次数',
  episode_count INT DEFAULT 0 COMMENT '出现在多少集中',
  audio_url VARCHAR(500) COMMENT 'TTS音频URL（可选）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_word (word),
  INDEX idx_level (level),
  INDEX idx_frequency (frequency DESC)
) ENGINE=InnoDB;

-- ============================================================
-- 4. 词汇-播客关联表（多对多）
-- ============================================================
CREATE TABLE vocab_episodes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vocab_id BIGINT NOT NULL,
  episode_id BIGINT NOT NULL,
  context_sentence TEXT COMMENT '该集中的例句',
  context_translation TEXT COMMENT '例句中文翻译',
  UNIQUE KEY uk_vocab_episode (vocab_id, episode_id),
  FOREIGN KEY (vocab_id) REFERENCES vocab(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  INDEX idx_vocab_id (vocab_id),
  INDEX idx_episode_id (episode_id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. 用户词汇学习记录（FSRS 间隔重复）
-- ============================================================
CREATE TABLE user_vocab (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  vocab_id BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' COMMENT 'new/learning/review/mature',
  -- FSRS 核心参数
  difficulty DOUBLE DEFAULT 5.0 COMMENT '难度 D (1-10)',
  stability DOUBLE DEFAULT 0.0 COMMENT '稳定性 S (天)',
  retrievability DOUBLE DEFAULT 1.0 COMMENT '可检索性 R (0-1)',
  -- 复习调度
  due_date DATETIME COMMENT '下次复习时间',
  last_review DATETIME COMMENT '上次复习时间',
  review_count INT DEFAULT 0 COMMENT '总复习次数',
  correct_count INT DEFAULT 0 COMMENT '正确次数',
  lapse_count INT DEFAULT 0 COMMENT '遗忘次数',
  -- 学习进度
  first_seen DATETIME COMMENT '首次学习时间',
  last_rating VARCHAR(10) COMMENT '上次评分 again/hard/good/easy',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_vocab (user_id, vocab_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vocab_id) REFERENCES vocab(id) ON DELETE CASCADE,
  INDEX idx_user_due (user_id, due_date),
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB;

-- ============================================================
-- 6. 播客材料页（好句子、笔记等）
-- ============================================================
CREATE TABLE episode_materials (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  episode_id BIGINT NOT NULL,
  good_sentences JSON COMMENT '好句子数组 [{ru, cn, grammar_note}]',
  notes TEXT COMMENT '文化/语法笔记',
  raw_file_path VARCHAR(500) COMMENT '原始转录文件路径',
  material_file_path VARCHAR(500) COMMENT '材料页文件路径',
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  INDEX idx_episode_id (episode_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. 用户每日学习统计
-- ============================================================
CREATE TABLE daily_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  study_date DATE NOT NULL,
  new_words INT DEFAULT 0 COMMENT '当日新学词数',
  reviewed_words INT DEFAULT 0 COMMENT '当日复习词数',
  correct_rate DOUBLE DEFAULT 0.0 COMMENT '当日正确率',
  study_seconds INT DEFAULT 0 COMMENT '当日学习时长(秒)',
  UNIQUE KEY uk_user_date (user_id, study_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, study_date)
) ENGINE=InnoDB;

import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { speakRussian } from '../utils/tts';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const generateOptions = useCallback((correct, allWords, field) => {
    const options = [correct];
    const pool = allWords.filter((w) => w[field] !== correct);
    while (options.length < 4 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const val = pool[idx][field];
      if (!options.includes(val)) {
        options.push(val);
      }
      pool.splice(idx, 1);
    }
    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await client.get('/vocab/random-quiz?count=10');
        const words = Array.isArray(res.data) ? res.data : [];
        if (words.length < 4) {
          setQuestions([]);
          setLoading(false);
          return;
        }

        const qs = words.map((w) => {
          // Randomly choose direction: ru->zh or zh->ru
          const isRuToZh = Math.random() > 0.5;
          if (isRuToZh) {
            return {
              prompt: w.word,
              promptLang: 'ru',
              correct: w.chinese || 'N/A',
              options: generateOptions(w.chinese || 'N/A', words, 'chinese'),
            };
          } else {
            return {
              prompt: w.chinese || 'N/A',
              promptLang: 'zh',
              correct: w.word,
              options: generateOptions(w.word, words, 'word'),
            };
          }
        });

        setQuestions(qs);
      } catch (err) {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [generateOptions]);

  const speak = (text) => {
    if (!text) return;
    speakRussian(text);
  };

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    setShowResult(true);
    if (option === questions[currentIndex].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setFinished(false);
    setLoading(true);
    // Re-fetch
    client.get('/vocab/random-quiz?count=10').then((res) => {
      const words = Array.isArray(res.data) ? res.data : [];
      const qs = words.map((w) => {
        const isRuToZh = Math.random() > 0.5;
        if (isRuToZh) {
          return {
            prompt: w.word,
            promptLang: 'ru',
            correct: w.chinese || 'N/A',
            options: generateOptions(w.chinese || 'N/A', words, 'chinese'),
          };
        } else {
          return {
            prompt: w.chinese || 'N/A',
            promptLang: 'zh',
            correct: w.word,
            options: generateOptions(w.word, words, 'word'),
          };
        }
      });
      setQuestions(qs);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  if (loading) return <div className="loading">加载测验中...</div>;

  if (questions.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>❓ 测验</h2>
          <p>词汇不足，无法开始测验。请先添加更多词汇！</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="page">
        <div className="quiz-result">
          <h2>🎉 测验完成！</h2>
          <div className="score-display">
            <span className="score-value">{score}</span>
            <span className="score-total">/ {questions.length}</span>
          </div>
          <p>{score === questions.length ? '满分！🌟' : score >= questions.length / 2 ? '做得好！👍' : '继续练习！💪'}</p>
          <button className="btn btn-primary" onClick={handleRestart}>
            再试一次
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="page">
      <h1>❓ 测验</h1>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-text">
        {currentIndex + 1} / {questions.length} | 得分: {score}
      </p>

      <div className="quiz-card">
        <div className="quiz-prompt">
          {q.promptLang === 'ru' && (
            <button
              className="btn btn-icon"
              onClick={() => speak(q.prompt)}
              title="听发音"
            >
              🔊
            </button>
          )}
          <h2>{q.prompt}</h2>
          <p className="quiz-hint">
            {q.promptLang === 'ru' ? '选择中文翻译：' : '选择俄语单词：'}
          </p>
        </div>

        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (showResult) {
              if (opt === q.correct) cls += ' correct';
              else if (opt === selected) cls += ' wrong';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleSelect(opt)}
                disabled={showResult}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {showResult && (
          <button className="btn btn-primary btn-full" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果'}
          </button>
        )}
      </div>
    </div>
  );
}

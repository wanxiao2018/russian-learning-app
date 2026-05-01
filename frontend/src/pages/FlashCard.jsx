import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { speakRussian } from '../utils/tts';
import { translatePOS, getPOSClass } from '../utils/pos';

const LEVELS = ['A1', 'A2-B1', 'B1-B2', 'B2-C1'];

export default function FlashCard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [order, setOrder] = useState('sequential'); // 'sequential' | 'shuffle'
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongWords, setWrongWords] = useState([]);

  // Fetch cards on mount and when level/order changes
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        let data = [];
        // Try to get due review cards first
        try {
          const res = await client.get('/learning/due');
          data = Array.isArray(res.data) ? res.data : [];
        } catch (e) {}

        // If no due cards, get new words
        if (data.length === 0) {
          const newRes = await client.get('/learning/new-words?count=50');
          data = Array.isArray(newRes.data) ? newRes.data : [];
        }

        // Filter by level if selected
        if (selectedLevel && data.length > 0) {
          data = data.filter(c => c.level === selectedLevel);
        }

        // Shuffle if needed
        if (order === 'shuffle' && data.length > 0) {
          data = [...data].sort(() => Math.random() - 0.5);
        }

        setCards(data);
        if (data.length > 0) {
          setTimeout(() => speakRussian(data[0].word), 500);
        }
      } catch (err) {
        setCards([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [selectedLevel, order]);

  // Auto-play audio when card changes
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      speakRussian(cards[currentIndex].word);
    }
  }, [currentIndex, cards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (done || loading) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(f => !f);
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        handleRate('again');
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        handleRate('good');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, currentIndex, cards, done, loading]);

  const handleRate = (rating) => {
    if (cards.length === 0 || currentIndex >= cards.length) return;
    const card = cards[currentIndex];

    // Track stats
    if (rating === 'good') {
      setCorrectCount(c => c + 1);
    } else {
      setWrongCount(w => w + 1);
      setWrongWords(prev => [...prev, card]);
    }

    // Submit review
    try {
      client.post('/learning/review', {
        vocabId: card.vocabId || card.id,
        rating,
      }).catch(() => {});
    } catch (e) {}

    // Next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else {
      setDone(true);
    }
  };

  if (loading) {
    return (
      <div className="fc-page">
        <div className="fc-loading">加载中...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="fc-page">
        <div className="fc-empty">
          <div className="fc-empty-icon">📭</div>
          <h2>暂无可学习的词汇</h2>
          <p>请先浏览词汇库添加更多词汇</p>
          <button className="fc-btn fc-btn-primary" onClick={() => navigate('/vocab')}>
            浏览词汇库
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fc-page">
        <div className="fc-done">
          <div className="fc-done-icon">🎉</div>
          <h2>全部完成！</h2>
          <div className="fc-done-stats">
            <div className="fc-done-stat fc-done-correct">
              <span className="fc-done-stat-num">{correctCount}</span>
              <span className="fc-done-stat-label">认识</span>
            </div>
            <div className="fc-done-stat fc-done-wrong">
              <span className="fc-done-stat-num">{wrongCount}</span>
              <span className="fc-done-stat-label">不认识</span>
            </div>
          </div>
          {wrongWords.length > 0 && (
            <div className="fc-done-wrong-list">
              <h3>需要复习的词</h3>
              <div className="fc-done-wrong-words">
                {wrongWords.map((w, i) => (
                  <span key={i} className="fc-done-wrong-word" onClick={() => speakRussian(w.word)}>
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="fc-done-actions">
            <button className="fc-btn fc-btn-primary" onClick={() => {
              setCurrentIndex(0);
              setFlipped(false);
              setDone(false);
              setCorrectCount(0);
              setWrongCount(0);
              setWrongWords([]);
            }}>
              再来一轮
            </button>
            <button className="fc-btn fc-btn-secondary" onClick={() => navigate('/vocab')}>
              浏览词汇库
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="fc-page">
      {/* Level selector */}
      <div className="fc-levels">
        <button
          className={`fc-level-btn ${selectedLevel === null ? 'active' : ''}`}
          onClick={() => setSelectedLevel(null)}
        >
          全部
        </button>
        {LEVELS.map(l => (
          <button
            key={l}
            className={`fc-level-btn ${selectedLevel === l ? 'active' : ''}`}
            onClick={() => setSelectedLevel(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Order toggle */}
      <div className="fc-order">
        <button
          className={`fc-order-btn ${order === 'sequential' ? 'active' : ''}`}
          onClick={() => setOrder('sequential')}
        >
          📌 顺序
        </button>
        <button
          className={`fc-order-btn ${order === 'shuffle' ? 'active' : ''}`}
          onClick={() => setOrder('shuffle')}
        >
          🔀 随机
        </button>
      </div>

      {/* Progress */}
      <div className="fc-progress-area">
        <div className="fc-progress-bar-wrap">
          <div className="fc-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="fc-progress-info">
          <span className="fc-progress-count">{currentIndex + 1} / {cards.length}</span>
          <span className="fc-progress-correct">✓ {correctCount}</span>
          <span className="fc-progress-wrong">✗ {wrongCount}</span>
        </div>
      </div>

      {/* Card */}
      <div className="fc-card-area">
        <div
          className={`fc-card-wrapper ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="fc-card">
            {/* Front: word + stress */}
            <div className="fc-card-front">
              {card.level && <span className="fc-card-level">{card.level}</span>}
              <button
                className="fc-card-tts"
                onClick={(e) => { e.stopPropagation(); speakRussian(card.word); }}
                title="听发音"
              >
                🔊
              </button>
              <div className="fc-card-word">{card.word}</div>
              {card.stress && card.stress !== card.word && (
                <div className="fc-card-stress">{card.stress}</div>
              )}
            </div>
            {/* Back: chinese + pos + sentences */}
            <div className="fc-card-back">
              <div className="fc-card-chinese">{card.chinese}</div>
              {card.pos && (
                <span className={`fc-card-pos ${getPOSClass(card.pos)}`}>
                  {translatePOS(card.pos)}
                </span>
              )}
              {card.sentences && card.sentences.length > 0 && (
                <div className="fc-card-sentences">
                  {card.sentences.slice(0, 2).map((s, i) => (
                    <div key={i} className="fc-sentence">
                      <button
                        className="fc-sentence-tts"
                        onClick={(e) => { e.stopPropagation(); speakRussian(s.ru); }}
                        title="播放例句"
                      >🔊</button>
                      <div className="fc-sentence-text">
                        <div className="fc-sentence-ru">{s.ru}</div>
                        <div className="fc-sentence-cn">{s.cn}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {card.level && <span className="fc-card-level-back">{card.level}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="fc-rating">
        <button className="fc-btn fc-btn-wrong" onClick={() => handleRate('again')}>
          ✗ 不认识
        </button>
        <button className="fc-btn fc-btn-right" onClick={() => handleRate('good')}>
          ✓ 认识
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="fc-hint">
        <span>空格 翻转</span>
        <span>← 不认识</span>
        <span>→ 认识</span>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { speakRussian } from '../utils/tts';
import { translatePOS, getPOSClass } from '../utils/pos';

export default function FlashCard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!mode) {
      setLoading(false);
      return;
    }
    
    const fetchCards = async () => {
      setLoading(true);
      try {
        let data = [];
        if (mode === 'review') {
          const res = await client.get('/learning/due');
          data = Array.isArray(res.data) ? res.data : [];
        }
        
        if (data.length === 0) {
          const newRes = await client.get('/learning/new-words?count=10');
          data = Array.isArray(newRes.data) ? newRes.data : [];
        }
        
        setCards(data);
        // Auto-play first card audio
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
  }, [mode]);

  // Auto-play audio when card changes
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      speakRussian(cards[currentIndex].word);
    }
  }, [currentIndex, cards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) {
          setFlipped(true);
        }
      } else if (e.key === 'ArrowLeft' && flipped) {
        handleRate('again');
      } else if (e.key === 'ArrowRight' && flipped) {
        handleRate('good');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, currentIndex, cards]);

  const handleRate = async (rating) => {
    const card = cards[currentIndex];
    try {
      await client.post('/learning/review', {
        vocabId: card.vocabId || card.id,
        rating,
      });
    } catch (err) {}

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setDragX(0);
    } else {
      setDone(true);
    }
  };

  // Touch/Mouse drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startXRef.current;
    setDragX(diff);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const threshold = 100;
    
    if (dragX > threshold) {
      // Swipe right = know
      handleRate('good');
    } else if (dragX < -threshold) {
      // Swipe left = don't know
      handleRate('again');
    }
    setDragX(0);
  };

  if (!mode) {
    return (
      <div className="page">
        <h1>🃏 闪卡背单词</h1>
        <div className="mode-selection">
          <div className="mode-card" onClick={() => setMode('review')}>
            <div className="mode-icon">🔄</div>
            <h3>复习卡片</h3>
            <p>复习已学过的单词</p>
          </div>
          <div className="mode-card" onClick={() => setMode('new')}>
            <div className="mode-icon">✨</div>
            <h3>学习新词</h3>
            <p>学习 10 个新单词</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">加载中...</div>;

  if (cards.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>📭 暂无可学习的词汇</h2>
          <p>请先浏览词汇库添加更多词汇</p>
          <button className="btn btn-primary" onClick={() => setMode(null)}>
            返回选择
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>🎉 全部完成！</h2>
          <p>本次学习了 {cards.length} 个单词</p>
          <div className="done-actions">
            <button className="btn btn-primary" onClick={() => {
              setMode(null);
              setDone(false);
              setCurrentIndex(0);
              setFlipped(false);
            }}>
              继续学习
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/vocab')}>
              浏览词汇库
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const rotation = dragX * 0.1;
  const opacity = 1 - Math.abs(dragX) / 300;

  return (
    <div className="page">
      <h1>🃏 闪卡背单词</h1>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-text">{currentIndex + 1} / {cards.length}</p>

      <div className="flashcard-area">
        {/* Swipe indicator */}
        {isDragging && (
          <div className={`swipe-indicator ${dragX > 0 ? 'swipe-right' : 'swipe-left'}`}>
            {dragX > 0 ? '✅ 认识' : '❌ 不认识'}
          </div>
        )}

        <div 
          ref={cardRef}
          className={`flashcard-container ${isDragging ? 'dragging' : ''}`}
          style={{ 
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            opacity: opacity
          }}
          onClick={() => !isDragging && setFlipped(!flipped)}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={() => { if (isDragging) handleDragEnd(); }}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-front">
              <button
                className="btn btn-icon tts-btn"
                onClick={(e) => { e.stopPropagation(); speakRussian(card.word); }}
                title="听发音"
              >
                🔊
              </button>
              <h2 className="flashcard-word">{card.word}</h2>
              {card.stress && card.stress !== card.word && (
                <p className="flashcard-stress">{card.stress}</p>
              )}
              <p className="flashcard-hint">点击翻转 · 左滑不认识 · 右滑认识</p>
            </div>
            <div className="flashcard-back">
              <h2 className="flashcard-word">{card.word}</h2>
              {card.chinese && <p className="flashcard-chinese">{card.chinese}</p>}
              {card.pos && <p className={`flashcard-pos ${getPOSClass(card.pos)}`}>词性: {translatePOS(card.pos)}</p>}
              {card.level && <p className="flashcard-level">级别: {card.level}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="rating-buttons">
        <button className="btn btn-danger btn-large" onClick={() => handleRate('again')}>
          ❌ 不认识
          <span className="rating-hint">← 左滑</span>
        </button>
        <button className="btn btn-success btn-large" onClick={() => handleRate('good')}>
          ✅ 认识
          <span className="rating-hint">右滑 →</span>
        </button>
      </div>

      <div className="keyboard-hint">
        <span>空格 翻转</span>
        <span>← 不认识</span>
        <span>→ 认识</span>
      </div>
    </div>
  );
}

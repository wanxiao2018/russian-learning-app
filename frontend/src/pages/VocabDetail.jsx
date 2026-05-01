import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { speakRussian } from '../utils/tts';
import { translatePOS, getPOSClass } from '../utils/pos';

export default function VocabDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWord = async () => {
      setLoading(true);
      try {
        const res = await client.get(`/vocab/${id}`);
        setWord(res.data);
      } catch (err) {
        setWord(null);
      } finally {
        setLoading(false);
      }
    };
    fetchWord();
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        const prevId = parseInt(id) - 1;
        if (prevId > 0) navigate(`/vocab/${prevId}`);
      } else if (e.key === 'ArrowRight') {
        navigate(`/vocab/${parseInt(id) + 1}`);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speakRussian(word?.word);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, navigate, word]);

  const speak = () => {
    if (!word?.word) return;
    speakRussian(word.word);
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!word) return <div className="page"><p>未找到单词</p></div>;

  return (
    <div className="page vocab-detail-page">
      {/* Top navigation */}
      <div className="detail-nav">
        <button className="btn btn-secondary back-btn" onClick={() => navigate('/vocab')}>
          ← 返回
        </button>
        <div className="nav-arrows">
          <button 
            className="btn btn-icon" 
            onClick={() => navigate(`/vocab/${parseInt(id) - 1}`)}
            disabled={parseInt(id) <= 1}
          >
            ◀
          </button>
          <span className="word-id">#{id}</span>
          <button 
            className="btn btn-icon"
            onClick={() => navigate(`/vocab/${parseInt(id) + 1}`)}
          >
            ▶
          </button>
        </div>
      </div>

      <div className="detail-card">
        {/* Word and TTS */}
        <div className="detail-header">
          <div className="word-main">
            <h1 className="word-title">{word.word}</h1>
            {word.stress && word.stress !== word.word && (
              <span className="word-stress">{word.stress}</span>
            )}
          </div>
          <button className="btn btn-icon tts-btn-large" onClick={speak} title="听发音">
            🔊
          </button>
        </div>

        {/* Inline info: Chinese + POS + Level */}
        <div className="word-meta-inline">
          {word.chinese && (
            <span className="meta-chinese">{word.chinese}</span>
          )}
          {word.pos && (
            <span className={`meta-pos ${getPOSClass(word.pos)}`}>
              {translatePOS(word.pos)}
            </span>
          )}
          {word.level && (
            <span className={`meta-level badge level-${word.level.toLowerCase()}`}>
              {word.level}
            </span>
          )}
        </div>

        {/* Example sentences */}
        {word.sentences && word.sentences.length > 0 && (
          <div className="detail-section">
            <h3>📖 播客例句</h3>
            <div className="sentences-list">
              {word.sentences.map((s, i) => (
                <div key={i} className="sentence-card">
                  <div className="sentence-row">
                    <button
                      className="sentence-tts-btn"
                      onClick={() => speakRussian(s.ru)}
                      title="播放例句"
                    >🔊</button>
                    <div className="sentence-texts">
                      <div className="sentence-ru">{s.ru}</div>
                      {s.cn && <div className="sentence-cn">{s.cn}</div>}
                    </div>
                  </div>
                  {s.episodeNumber && (
                    <div className="sentence-source">RRS #{s.episodeNumber}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="keyboard-hint-bottom">
          <span>← → 切换单词</span>
          <span>空格 发音</span>
        </div>
      </div>
    </div>
  );
}

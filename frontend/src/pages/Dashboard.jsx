import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dueRes] = await Promise.all([
          client.get('/learning/stats').catch(() => ({ data: {} })),
          client.get('/learning/due').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setDueCount(Array.isArray(dueRes.data) ? dueRes.data.length : 0);
      } catch (err) {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="page">
      <h1>欢迎，{user?.username}！👋</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats?.streak || 0}</div>
          <div className="stat-label">连续学习天数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{dueCount}</div>
          <div className="stat-label">待复习卡片</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-value">{stats?.availableNewWords || 0}</div>
          <div className="stat-label">可学习新词</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats?.totalWords || 0}</div>
          <div className="stat-label">已学词汇</div>
        </div>
      </div>

      <h2>快速开始</h2>
      <div className="actions-grid">
        <Link to="/flashcard" className="action-card">
          <span className="action-icon">🃏</span>
          <span className="action-label">背单词</span>
        </Link>
        <Link to="/vocab" className="action-card">
          <span className="action-icon">📖</span>
          <span className="action-label">浏览词汇</span>
        </Link>
        <Link to="/quiz" className="action-card">
          <span className="action-icon">❓</span>
          <span className="action-label">开始测验</span>
        </Link>
        <Link to="/episodes" className="action-card">
          <span className="action-icon">📺</span>
          <span className="action-label">播客</span>
        </Link>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import client from '../api/client';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          client.get('/user/profile').catch(() => ({ data: {} })),
          client.get('/learning/stats').catch(() => ({ data: {} })),
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
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
      <h1>👤 个人中心</h1>

      <div className="profile-card">
        <div className="profile-avatar">👤</div>
        <h2>{user?.username || profile?.username || '用户'}</h2>
        {profile?.email && <p className="profile-email">{profile.email}</p>}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats?.streak || 0}</div>
          <div className="stat-label">连续学习天数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats?.totalLearned || 0}</div>
          <div className="stat-label">已学单词</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats?.reviewsToday || 0}</div>
          <div className="stat-label">今日复习</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{stats?.accuracy || 0}%</div>
          <div className="stat-label">正确率</div>
        </div>
      </div>

      <div className="settings-section">
        <h3>⚙️ 设置</h3>
        <div className="setting-item">
          <span>主题</span>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 夜间模式' : '☀️ 日间模式'}
          </button>
        </div>
      </div>
    </div>
  );
}

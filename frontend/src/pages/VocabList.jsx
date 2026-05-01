import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function VocabList() {
  const [words, setWords] = useState([]);
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('freq');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVocab = async () => {
      setLoading(true);
      try {
        const params = { page, size: 20, sort };
        if (level) params.level = level;
        if (search) params.search = search;
        const res = await client.get('/vocab', { params });
        if (res.data.items) {
          setWords(res.data.items);
          setTotalPages(res.data.totalPages || 0);
          setTotal(res.data.total || 0);
        }
      } catch (err) {
        setWords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVocab();
  }, [level, search, page, sort]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <div className="page">
      <h1>📖 词汇浏览</h1>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索单词..."
          value={search}
          onChange={handleSearch}
          className="search-input"
        />
        <select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(0); }}
          className="filter-select"
        >
          <option value="">全部级别</option>
          <option value="A1">A1 入门</option>
          <option value="A2">A2-B1 初中级</option>
          <option value="B1">B1-B2 中级</option>
          <option value="B2">B2-C1 中高级</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(0); }}
          className="filter-select"
        >
          <option value="freq">按频率排序</option>
          <option value="alpha">按字母排序</option>
          <option value="random">随机排序</option>
        </select>
      </div>

      <div className="vocab-count">
        共 {total.toLocaleString()} 个单词
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div className="vocab-table">
            <div className="vocab-header">
              <span>单词</span>
              <span>释义</span>
              <span>级别</span>
            </div>
            {words.map((word) => (
              <div
                key={word.id}
                className="vocab-row"
                onClick={() => navigate(`/vocab/${word.id}`)}
              >
                <span className="vocab-word">{word.word}</span>
                <span className="vocab-chinese">{word.chinese || '-'}</span>
                <span className={`vocab-level level-${(word.level || '').toLowerCase()}`}>
                  {word.level || '-'}
                </span>
              </div>
            ))}
            {words.length === 0 && <div className="empty-msg">暂无词汇</div>}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                ← 上一页
              </button>
              <span>第 {page + 1} 页 / 共 {totalPages} 页</span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                下一页 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  auth,
  googleProvider,
  db,
  signInWithPopup,
  signOut,
  firebaseConfig
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  BookOpen,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Circle,
  Volume2,
  Search,
  BookMarked,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Award,
  CheckCheck,
  X
} from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [words, setWords] = useState([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  // New Word Form State
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newIsMemorized, setNewIsMemorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'learning' | 'memorized'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'alphabetical'

  // Edit Modal State
  const [editingWord, setEditingWord] = useState(null);
  const [editForm, setEditForm] = useState({ word: '', meaning: '', example: '', isMemorized: false });
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setErrorNotice({
        type: 'error',
        title: 'Firebase 초기화 오류',
        message: 'Firebase 모듈을 로드하지 못했습니다. 설정 값을 확인해 주세요.'
      });
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      setErrorNotice(null);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for Firestore real-time updates under users/{userId}/words
  useEffect(() => {
    if (!user || !db) {
      setWords([]);
      return;
    }

    setWordsLoading(true);
    // Path: users/{userId}/words
    const wordsCollectionRef = collection(db, 'users', user.uid, 'words');
    const q = query(wordsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const wordList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setWords(wordList);
        setWordsLoading(false);
        setErrorNotice(null);
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        setWordsLoading(false);
        const pid = firebaseConfig?.projectId || 'ssss-52bbd';
        if (error.code === 'permission-denied') {
          setErrorNotice({
            type: 'warning',
            title: 'Firestore 보안 규칙 또는 데이터베이스 설정 필요',
            message: 'Firebase 콘솔에서 Firestore Database를 생성하거나 보안 규칙을 배포해주세요.',
            url: `https://console.firebase.google.com/project/${pid}/firestore`
          });
        } else if (error.message?.includes('Cloud Firestore API') || error.code === 'failed-precondition') {
          setErrorNotice({
            type: 'warning',
            title: 'Cloud Firestore 활성화 필요',
            message: '현재 Firebase 프로젝트에 Firestore가 아직 생성되지 않았습니다. 콘솔에서 Firestore를 활성화해주세요.',
            url: `https://console.firebase.google.com/project/${pid}/firestore`
          });
        } else {
          setErrorNotice({
            type: 'error',
            title: '데이터 로드 오류',
            message: error.message
          });
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Google Sign In
  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      alert('Firebase 인증 모듈이 준비되지 않았습니다.');
      return;
    }
    try {
      setErrorNotice(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      const pid = firebaseConfig?.projectId || 'ssss-52bbd';
      if (error.code === 'auth/operation-not-allowed') {
        setErrorNotice({
          type: 'warning',
          title: 'Google 로그인 제공자 활성화 필요',
          message: 'Firebase 콘솔의 [Authentication] -> [Sign-in method]에서 Google 로그인을 사용 설정해주세요.',
          url: `https://console.firebase.google.com/project/${pid}/authentication/providers`
        });
      } else {
        setErrorNotice({
          type: 'error',
          title: '로그인 실패',
          message: error.message
        });
      }
    }
  };

  // Google Sign Out
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Add Word (Create) -> Firestore users/{userId}/words
  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newWord.trim() || !newMeaning.trim()) {
      alert('단어와 뜻을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const wordsCollectionRef = collection(db, 'users', user.uid, 'words');
      await addDoc(wordsCollectionRef, {
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        example: newExample.trim(),
        isMemorized: Boolean(newIsMemorized),
        createdAt: serverTimestamp()
      });

      // Reset form
      setNewWord('');
      setNewMeaning('');
      setNewExample('');
      setNewIsMemorized(false);
    } catch (error) {
      console.error('Error adding word:', error);
      alert('단어 추가 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Memorized Status
  const handleToggleMemorized = async (wordId, currentStatus) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'words', wordId);
      await updateDoc(docRef, {
        isMemorized: !currentStatus
      });
    } catch (error) {
      console.error('Error toggling memorized:', error);
    }
  };

  // Open Edit Modal
  const openEditModal = (word) => {
    setEditingWord(word);
    setEditForm({
      word: word.word,
      meaning: word.meaning,
      example: word.example || '',
      isMemorized: Boolean(word.isMemorized)
    });
  };

  // Save Edit (Update) -> Firestore users/{userId}/words/{id}
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!user || !editingWord) return;
    if (!editForm.word.trim() || !editForm.meaning.trim()) {
      alert('단어와 뜻을 입력해주세요.');
      return;
    }

    try {
      setIsUpdating(true);
      const docRef = doc(db, 'users', user.uid, 'words', editingWord.id);
      await updateDoc(docRef, {
        word: editForm.word.trim(),
        meaning: editForm.meaning.trim(),
        example: editForm.example.trim(),
        isMemorized: editForm.isMemorized,
        updatedAt: serverTimestamp()
      });
      setEditingWord(null);
    } catch (error) {
      console.error('Error updating word:', error);
      alert('단어 수정 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Word -> Firestore users/{userId}/words/{id}
  const handleDeleteWord = async (wordId, wordText) => {
    if (!user) return;
    if (!window.confirm(`'${wordText}' 단어를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid, 'words', wordId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting word:', error);
      alert('단어 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // Web Speech API for Pronunciation
  const speakWord = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Calculate Statistics
  const stats = useMemo(() => {
    const total = words.length;
    const memorized = words.filter((w) => w.isMemorized).length;
    const learning = total - memorized;
    const percentage = total > 0 ? Math.round((memorized / total) * 100) : 0;
    return { total, memorized, learning, percentage };
  }, [words]);

  // Filtered & Sorted Words
  const filteredWords = useMemo(() => {
    return words
      .filter((item) => {
        // Search query
        const matchesSearch =
          item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.example && item.example.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        // Filter tab
        if (filterStatus === 'memorized') return item.isMemorized;
        if (filterStatus === 'learning') return !item.isMemorized;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alphabetical') {
          return a.word.localeCompare(b.word);
        }
        // newest default (uses createdAt if available, else 0)
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
  }, [words, searchQuery, filterStatus, sortBy]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-area">
            <div className="logo-icon">
              <BookOpen size={22} />
            </div>
            <div className="logo-title">
              My Vocab
              <span className="badge-project">Firebase: ssss-52bbd</span>
            </div>
          </div>

          <div className="header-user">
            {authLoading ? (
              <div className="spinner" style={{ borderColor: '#cbd5e1', borderTopColor: '#4f46e5' }}></div>
            ) : user ? (
              <div className="user-profile">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.displayName ? user.displayName[0] : 'U'}
                  </div>
                )}
                <div className="user-info">
                  <span className="user-name">{user.displayName || '사용자'}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <button onClick={handleLogout} className="btn-outline btn-danger-outline" title="로그아웃">
                  <LogOut size={15} />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="btn-google">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google 계정으로 로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Notice/Error Banner if required */}
        {errorNotice && (
          <div className={`banner banner-${errorNotice.type}`}>
            <AlertTriangle size={20} className="banner-icon" />
            <div className="banner-content">
              <div className="banner-title">{errorNotice.title}</div>
              <div className="banner-text">{errorNotice.message}</div>
              {errorNotice.url && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={errorNotice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Firebase 콘솔에서 열기</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logged Out View */}
        {!user && !authLoading && (
          <section className="hero-section">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>클라우드 기반 단어장 웹앱</span>
            </div>
            <h1 className="hero-title">
              나만의 <span className="hero-title-highlight">영어 단어장</span>으로<br />
              매일 똑똑하게 외워보세요
            </h1>
            <p className="hero-desc">
              Google 계정으로 로그인하고 언제 어디서나 나만의 단어를 관리하세요.<br />
              단어, 뜻, 예문부터 발음 듣기와 외움 체크까지 안전하게 저장됩니다.
            </p>

            <div className="hero-cta">
              <button onClick={handleGoogleLogin} className="btn-google-large">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google 계정으로 시작하기</span>
              </button>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <LogIn size={20} />
                </div>
                <h3 className="feature-title">간편한 Google 로그인</h3>
                <p className="feature-desc">별도의 회원가입 없이 Google 계정 원클릭으로 바로 로그인할 수 있습니다.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <BookMarked size={20} />
                </div>
                <h3 className="feature-title">단어 / 뜻 / 예문 관리</h3>
                <p className="feature-desc">직접 단어를 추가하고 언제든 수정하거나 삭제할 수 있습니다.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Award size={20} />
                </div>
                <h3 className="feature-title">외움 상태 & 발음 듣기</h3>
                <p className="feature-desc">원클릭으로 외움 상태를 표시하고, 원어민 발음(TTS)도 함께 들어보세요.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Sparkles size={20} />
                </div>
                <h3 className="feature-title">users/{'{userId}'} 개인화</h3>
                <p className="feature-desc">Firestore 사용자별 경로로 분리되어 내 데이터는 오직 나만 볼 수 있습니다.</p>
              </div>
            </div>
          </section>
        )}

        {/* Logged In Dashboard */}
        {user && (
          <div>
            {/* Stats Dashboard */}
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">전체 단어</span>
                  <span className="stat-value">{stats.total}개</span>
                </div>
                <div className="stat-icon stat-icon-blue">
                  <BookOpen size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">외운 단어</span>
                  <span className="stat-value">{stats.memorized}개</span>
                </div>
                <div className="stat-icon stat-icon-green">
                  <CheckCheck size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">학습 중</span>
                  <span className="stat-value">{stats.learning}개</span>
                </div>
                <div className="stat-icon stat-icon-amber">
                  <Circle size={24} />
                </div>
              </div>

              <div className="progress-card">
                <div className="progress-header">
                  <span className="progress-title">암기 달성률</span>
                  <span className="progress-percent">{stats.percentage}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${stats.percentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Word Add Form Card */}
            <div className="form-card">
              <div className="form-header">
                <div className="form-title">
                  <Plus size={20} color="#4f46e5" />
                  <span>새 단어 추가</span>
                </div>
              </div>
              <form onSubmit={handleAddWord}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      영어 단어 <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: serendipity"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      뜻 (한국어) <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="예: 뜻밖의 행운, 우연한 발견"
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">예문 (선택사항)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="예: Finding this book was a complete serendipity."
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={newIsMemorized}
                      onChange={(e) => setNewIsMemorized(e.target.checked)}
                    />
                    <span>이미 외운 단어로 등록</span>
                  </label>

                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <span className="spinner"></span> : <Plus size={16} />}
                    <span>단어 추가</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Controls: Search, Filter Tabs & Sort */}
            <div className="controls-bar">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="단어, 뜻, 예문 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    전체 ({words.length})
                  </button>
                  <button
                    className={`filter-tab ${filterStatus === 'learning' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('learning')}
                  >
                    학습 중 ({stats.learning})
                  </button>
                  <button
                    className={`filter-tab ${filterStatus === 'memorized' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('memorized')}
                  >
                    외움 ({stats.memorized})
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="newest">최신 등록순</option>
                  <option value="alphabetical">알파벳순 (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Words Grid or Loading/Empty state */}
            {wordsLoading ? (
              <div className="spinner-primary"></div>
            ) : filteredWords.length === 0 ? (
              <div className="empty-state">
                <BookOpen className="empty-icon" />
                <h3 className="empty-title">
                  {searchQuery ? '검색 결과가 없습니다' : '등록된 단어가 없습니다'}
                </h3>
                <p className="empty-desc">
                  {searchQuery
                    ? `'${searchQuery}'에 일치하는 단어를 찾을 수 없습니다.`
                    : '위의 입력창을 통해 첫 번째 영어 단어를 추가해보세요!'}
                </p>
              </div>
            ) : (
              <div className="words-grid">
                {filteredWords.map((item) => (
                  <div
                    key={item.id}
                    className={`word-card ${item.isMemorized ? 'memorized' : 'learning'}`}
                  >
                    <div>
                      <div className="word-card-header">
                        <div className="word-title-group">
                          <span className="word-text">{item.word}</span>
                          <button
                            onClick={() => speakWord(item.word)}
                            className="btn-tts"
                            title="발음 듣기 (TTS)"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>

                        <div
                          onClick={() => handleToggleMemorized(item.id, item.isMemorized)}
                          className={`status-pill ${
                            item.isMemorized ? 'status-pill-memorized' : 'status-pill-learning'
                          }`}
                          title="클릭하여 상태 변경"
                        >
                          {item.isMemorized ? (
                            <>
                              <CheckCircle size={13} />
                              <span>외움</span>
                            </>
                          ) : (
                            <>
                              <Circle size={13} />
                              <span>학습 중</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="word-meaning">{item.meaning}</div>

                      {item.example && (
                        <div className="word-example">
                          "{item.example}"
                        </div>
                      )}
                    </div>

                    <div className="word-card-footer">
                      <button
                        onClick={() => handleToggleMemorized(item.id, item.isMemorized)}
                        className={`btn-quick-toggle ${
                          item.isMemorized ? 'mark-learning' : 'mark-memorized'
                        }`}
                      >
                        {item.isMemorized ? (
                          <>
                            <Circle size={13} />
                            <span>미암기로 변경</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck size={13} />
                            <span>외움 완료로 변경</span>
                          </>
                        )}
                      </button>

                      <div className="card-actions-right">
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn-icon-action"
                          title="단어 수정"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteWord(item.id, item.word)}
                          className="btn-icon-action delete"
                          title="단어 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Word Modal */}
      {editingWord && (
        <div className="modal-overlay" onClick={() => setEditingWord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">단어 수정</h3>
              <button onClick={() => setEditingWord(null)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    영어 단어 <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.word}
                    onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    뜻 (한국어) <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.meaning}
                    onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">예문</label>
                  <textarea
                    className="form-textarea"
                    value={editForm.example}
                    onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                  />
                </div>

                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={editForm.isMemorized}
                    onChange={(e) => setEditForm({ ...editForm, isMemorized: e.target.checked })}
                  />
                  <span>외움 완료 상태</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setEditingWord(null)}
                >
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={isUpdating}>
                  {isUpdating ? <span className="spinner"></span> : <CheckCircle size={16} />}
                  <span>수정 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div>
          My Vocab App • Firebase Project: <strong>ssss-52bbd</strong> • Cloud Firestore (<code>users/{'{userId}'}/words</code>)
        </div>
      </footer>
    </div>
  );
}

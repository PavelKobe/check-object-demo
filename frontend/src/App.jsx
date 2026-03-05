import { useState, useEffect } from 'react';
import CheckForm from './components/CheckForm';
import CheckHistory from './components/CheckHistory';
import { fetchChecks } from './api';

export default function App() {
  const [creds, setCreds] = useState(null);
  const [loginInput, setLoginInput] = useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [checks, setChecks] = useState([]);
  const [activeTab, setActiveTab] = useState('form');

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await fetchChecks(loginInput.username, loginInput.password);
      setCreds({ username: loginInput.username, password: loginInput.password });
      setChecks(data);
    } catch (err) {
      if (err.message === '401') {
        setLoginError('Неверный логин или пароль');
      } else {
        setLoginError('Не удалось подключиться к серверу');
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function refreshHistory() {
    if (!creds) return;
    try {
      const data = await fetchChecks(creds.username, creds.password);
      setChecks(data);
    } catch (_) { }
  }

  function handleResult() {
    refreshHistory();
    setActiveTab('history');
  }

  if (!creds) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🛡️</div>
          <h1>Безопасность<br />универмага</h1>
          <p>Система оценки службы охраны</p>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Логин</label>
              <input
                type="text"
                value={loginInput.username}
                onChange={e => setLoginInput(p => ({ ...p, username: e.target.value }))}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input
                type="password"
                value={loginInput.password}
                onChange={e => setLoginInput(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
            </div>
            {loginError && <div className="login-error">⚠️ {loginError}</div>}
            <button type="submit" className="btn-login" disabled={loginLoading}>
              {loginLoading ? '⏳ Вход...' : '🔐 Войти'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">🛡️</span>
          <div>
            <h1>Чек-лист безопасности</h1>
            <p>Оценка работы службы охраны универмага</p>
          </div>
        </div>
        <div className="header-right">
          <span className="user-badge">👤 {creds.username}</span>
          <button className="btn-logout" onClick={() => setCreds(null)}>Выйти</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          📝 Новая проверка
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); refreshHistory(); }}
        >
          📋 История ({checks.length})
        </button>
      </nav>

      {/* Content */}
      <main className="main-content">
        {activeTab === 'form' && (
          <CheckForm creds={creds} onResult={handleResult} />
        )}
        {activeTab === 'history' && (
          <CheckHistory checks={checks} />
        )}
      </main>
    </div>
  );
}

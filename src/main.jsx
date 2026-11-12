import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          maxWidth: '560px',
          margin: '80px auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            화면을 불러오는 중 오류가 발생했습니다
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <pre style={{
            background: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            overflowX: 'auto',
            border: '1px solid #e2e8f0',
            color: '#ef4444',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '11px 22px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            페이지 새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

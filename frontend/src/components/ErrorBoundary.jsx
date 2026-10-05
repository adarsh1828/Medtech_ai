import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: '#090e17',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#121c2e',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '2px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <AlertTriangle size={32} color="#f43f5e" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              काहीतरी तांत्रिक अडचण आली (Display Error)
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
              ॲप्लिकेशन रेंडर होताना अनपेक्षित त्रुटी आली आहे. खालील बटनावर क्लिक करून तुम्ही कॅशे (Cache) क्लिअर करून ॲप रीस्टार्ट करू शकता.
            </p>

            {this.state.error?.message && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.78rem',
                color: '#fb7185',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: '20px',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> रीलोड (Reload)
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)'
                }}
              >
                <LogOut size={16} /> कॅशे रीसेट (Reset & Clear)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

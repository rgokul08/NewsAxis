import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('NewsAxis render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '12px', fontFamily: 'system-ui, sans-serif',
          background: '#0d1117', color: '#f0f6fc', padding: '24px', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong loading NewsAxis</h1>
          <p style={{ color: '#8b949e', maxWidth: 480, fontSize: '0.875rem' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#a91b0d', color: 'white', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

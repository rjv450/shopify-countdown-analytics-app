import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';
import { getShopDomain } from '../utils/shop.js';

export default function Analytics() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const shop = getShopDomain();
      const response = await fetch(`/api/analytics/summary?shop=${shop}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="app-header">
          <h1>Analytics</h1>
        </div>
        <div style={{ padding: '2rem', color: '#000000', border: '1px solid #000000', background: '#f6f6f7', borderRadius: '4px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div>
          <h1>Analytics</h1>
          <p>View performance metrics for your countdown timers.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e1e3e5',
        marginBottom: '24px',
        gap: '8px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: '2px solid transparent',
            color: '#6d7175',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#202223';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#6d7175';
          }}
        >
          Timers
        </button>
        <button
          onClick={() => navigate('/analytics')}
          style={{
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: '2px solid #000000',
            color: '#202223',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Analytics
        </button>
      </div>
      <div className="app-main">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '4px',
            border: '1px solid #e1e3e5'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6d7175' }}>
              Total Timers
            </h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '600', color: '#202223' }}>
              {summary.totalTimers}
            </p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '4px',
            border: '1px solid #e1e3e5'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6d7175' }}>
              Active Timers
            </h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '600', color: '#202223' }}>
              {summary.activeTimers}
            </p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '4px',
            border: '1px solid #e1e3e5'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6d7175' }}>
              Total Impressions
            </h3>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '600', color: '#202223' }}>
              {summary.totalImpressions}
            </p>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: '4px',
          border: '1px solid #e1e3e5',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f6f6f7', borderBottom: '1px solid #e1e3e5' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Timer Name
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Status
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                  Impressions
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Last Impression
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.timers.map((timer, index) => (
                <tr 
                  key={timer.id}
                  style={{ 
                    borderBottom: index < summary.timers.length - 1 ? '1px solid #e1e3e5' : 'none'
                  }}
                >
                  <td style={{ padding: '12px', fontSize: '14px' }}>{timer.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: timer.status === 'active' ? '#000000' : '#f6f6f7',
                      color: timer.status === 'active' ? '#ffffff' : '#000000'
                    }}>
                      {timer.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                    {timer.impressions}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6d7175' }}>
                    {timer.lastImpressionAt
                      ? new Date(timer.lastImpressionAt).toLocaleString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaEye, FaTrash, FaSearch, FaEdit } from 'react-icons/fa';
import '../styles/App.css';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import TimerCreate from './TimerCreate';
import TimerPreview from '../components/TimerPreview.jsx';
import { getShopDomain, getApiBaseUrl } from '../utils/shop.js';

export default function Dashboard() {
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activatingId, setActivatingId] = useState(null);
  const [previewTimer, setPreviewTimer] = useState(null);
  const [deleteTimer, setDeleteTimer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTimers();
  }, []);

  const fetchTimers = async () => {
    try {
      setLoading(true);
      const shop = getShopDomain();
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/api/timers?shop=${shop}`;
      console.log('[Dashboard Debug] Fetching timers for shop:', shop);
      console.log('[Dashboard Debug] API Base URL:', apiBaseUrl);
      console.log('[Dashboard Debug] Full API URL:', apiUrl);
      console.log('[Dashboard Debug] Starting fetch request...');
      console.log('[Dashboard Debug] Fetch options:', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        url: apiUrl
      });
      
      // Add a warning if request takes too long
      const warningTimeout = setTimeout(() => {
        console.warn('[Dashboard Debug] ⚠️ Fetch request is taking longer than expected (>5s)');
        console.warn('[Dashboard Debug] Possible issues:');
        console.warn('  1. Backend server may not be running');
        console.warn('  2. MongoDB may not be connected');
        console.warn('  3. ngrok tunnel may not be forwarding requests');
        console.warn('  4. Check backend terminal for errors');
      }, 5000);
      
      const startTime = Date.now();
      
      // Fetch without timeout - let browser handle it naturally
      let response;
      try {
        console.log('[Dashboard Debug] Calling fetch()...');
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        clearTimeout(warningTimeout); // Clear warning if fetch succeeds
        const fetchTime = Date.now() - startTime;
        console.log('[Dashboard Debug] Fetch completed after', fetchTime, 'ms');
      } catch (fetchError) {
        clearTimeout(warningTimeout); // Clear warning on error
        const fetchTime = Date.now() - startTime;
        console.error('[Dashboard Debug] Fetch error after', fetchTime, 'ms:', fetchError);
        console.error('[Dashboard Debug] Error name:', fetchError.name);
        console.error('[Dashboard Debug] Error message:', fetchError.message);
        console.error('[Dashboard Debug] Error stack:', fetchError.stack);
        throw fetchError;
      }
      
      const fetchTime = Date.now() - startTime;
      
      console.log('[Dashboard Debug] Response received after', fetchTime, 'ms');
      console.log('[Dashboard Debug] Response status:', response.status);
      console.log('[Dashboard Debug] Response ok:', response.ok);
      console.log('[Dashboard Debug] Response headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length')
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Dashboard Debug] Response not OK. Status:', response.status);
        console.error('[Dashboard Debug] Error response body:', errorText);
        throw new Error(`Failed to fetch timers: ${response.status} ${response.statusText}`);
      }

      const parseStartTime = Date.now();
      const data = await response.json();
      const parseTime = Date.now() - parseStartTime;
      
      console.log('[Dashboard Debug] JSON parsed after', parseTime, 'ms');
      console.log('[Dashboard Debug] Timers data received:', data);
      console.log('[Dashboard Debug] Data keys:', Object.keys(data));
      console.log('[Dashboard Debug] Number of timers:', data.timers?.length || 0);
      console.log('[Dashboard Debug] Timers is array:', Array.isArray(data.timers));
      
      // Debug each timer's targetIds
      if (data.timers && Array.isArray(data.timers)) {
        console.log('[Dashboard Debug] Processing', data.timers.length, 'timers...');
        data.timers.forEach((timer, index) => {
          console.log(`[Dashboard Debug] Timer ${index + 1} (${timer.name || 'Unnamed'}):`, {
            id: timer._id || timer.id,
            name: timer.name,
            status: timer.status,
            targetType: timer.targetType,
            targetIds: timer.targetIds,
            targetIdsLength: timer.targetIds?.length || 0,
            targetIdsType: Array.isArray(timer.targetIds) ? 'array' : typeof timer.targetIds
          });
        });
      } else {
        console.warn('[Dashboard Debug] data.timers is not an array:', data.timers);
      }
      
      console.log('[Dashboard Debug] Setting timers state...');
      setTimers(data.timers || []);
      setError(null);
      console.log('[Dashboard Debug] State updated successfully');
    } catch (err) {
      console.error('[Dashboard Debug] Error fetching timers:', err);
      console.error('[Dashboard Debug] Error name:', err.name);
      console.error('[Dashboard Debug] Error message:', err.message);
      console.error('[Dashboard Debug] Error stack:', err.stack);
      
      // Provide more helpful error messages
      let errorMessage = err.message;
      if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check if the backend server is running on port 3001.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = 'Network error: Unable to connect to the backend server. Please ensure the server is running.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error: Check backend CORS configuration.';
      }
      
      setError(errorMessage);
    } finally {
      console.log('[Dashboard Debug] Setting loading to false');
      setLoading(false);
      console.log('[Dashboard Debug] fetchTimers completed');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }) + ' ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleActivate = async (timerId) => {
    try {
      setActivatingId(timerId);
      const shop = getShopDomain();
      const response = await fetch(`/api/timers/${timerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shop,
        },
        body: JSON.stringify({ status: 'active' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to activate timer' }));
        throw new Error(errorData.error || errorData.message || 'Failed to activate timer');
      }
      
      // Refresh timers after successful activation
      await fetchTimers();
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Activate error:', err);
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeleteClick = (timer) => {
    setDeleteTimer(timer);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTimer) return;
    
    try {
      const shop = getShopDomain();
      const response = await fetch(`/api/timers/${deleteTimer._id}`, {
        method: 'DELETE',
        headers: {
          'X-Shopify-Shop-Domain': shop,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete timer');
      }
      
      await fetchTimers();
      setDeleteTimer(null);
      setError(null);
    } catch (err) {
      setError(err.message);
      setDeleteTimer(null);
    }
  };

  // Apply filters
  const filteredTimers = timers.filter((timer) => {
    // Search filter
    const matchesSearch = timer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (timer.customization?.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || timer.status === statusFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || timer.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Apply sorting
  const sortedTimers = [...filteredTimers].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'status') {
      const statusOrder = { active: 0, scheduled: 1, draft: 2, expired: 3 };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    }
    return 0;
  });

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchTimers();
  };

  // Count timers by status
  const statusCounts = {
    all: timers.length,
    active: timers.filter(t => t.status === 'active').length,
    scheduled: timers.filter(t => t.status === 'scheduled').length,
    draft: timers.filter(t => t.status === 'draft').length,
    expired: timers.filter(t => t.status === 'expired').length,
  };
 
  // Debug render state
  console.log('[Dashboard Debug] Render state:', {
    loading,
    timersCount: timers.length,
    filteredCount: filteredTimers.length,
    sortedCount: sortedTimers.length,
    error: error || null
  });

  if (loading) {
    console.log('[Dashboard Debug] Showing loading state');
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '16px', color: '#6d7175' }}>Loading timers...</div>
        </div>
      </div>
    );
  }
  
  console.log('[Dashboard Debug] Rendering main Dashboard content');
  return (
    <div className="app-container">
      <div className="app-header">
        <div>
          <h1>Countdown Timer Manager</h1>
          <p>Create and manage countdown timers for your promotions.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            title="Create a new countdown timer"
          >
            + Create timer
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e1e3e5',
        marginBottom: '24px',
        gap: '8px',
        paddingLeft: '24px'
      }}>
        <button
          onClick={() => navigate('/')}
          title="View all timers"
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
          Timers
        </button>
        <button
          onClick={() => navigate('/analytics')}
          title="View analytics and performance metrics"
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
          Analytics
        </button>
      </div>

      <div className="app-layout">
        {/* Sidebar with Filters */}
        <div className="app-sidebar" style={{ padding: '16px' }}>
          <div className="search-container" style={{ marginBottom: '16px', position: 'relative' }}>
            <FaSearch 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#8c9196',
                pointerEvents: 'none'
              }} 
            />
            <input
              type="text"
              className="search-input"
              placeholder="Search timers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6d7175',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Status
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['all', 'active', 'scheduled', 'draft', 'expired'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  title={`Filter by ${status} status`}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    background: statusFilter === status ? '#000000' : 'transparent',
                    color: statusFilter === status ? 'white' : '#202223',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: statusFilter === status ? '600' : '400'
                  }}
                  onMouseEnter={(e) => {
                    if (statusFilter !== status) {
                      e.target.style.background = '#f6f6f7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (statusFilter !== status) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{status}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    opacity: 0.8,
                    background: statusFilter === status ? 'rgba(255,255,255,0.2)' : '#e1e3e5',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {statusCounts[status]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6d7175',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              title="Filter timers by type"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e1e3e5',
                borderRadius: '4px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Types</option>
              <option value="fixed">Fixed Timers</option>
              <option value="evergreen">Evergreen Timers</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6d7175',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Sort timers"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e1e3e5',
                borderRadius: '4px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="date">Date (Newest First)</option>
              <option value="name">Name (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="app-main" style={{ padding: '24px' }}>
          {/* Results Count */}
          <div style={{ 
            marginBottom: '16px', 
            fontSize: '14px', 
            color: '#6d7175',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              Showing {sortedTimers.length} of {timers.length} timer{sortedTimers.length !== 1 ? 's' : ''}
            </span>
            {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
                title="Clear all filters"
                style={{
                  padding: '4px 12px',
                  border: '1px solid #e1e3e5',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#202223',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: '#f6f6f7', 
              color: '#000000',
              border: '1px solid #000000', 
              borderRadius: '4px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#000000',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>
          )}

          {sortedTimers.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {sortedTimers.map((timer) => (
                <div key={timer._id} className="timer-card" style={{
                  background: 'white',
                  border: '1px solid #e1e3e5',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div className="timer-info" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#202223' }}>
                        {timer.name}
                      </h3>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: timer.status === 'active' ? '#000000' : 
                                        timer.status === 'scheduled' ? '#808080' : 
                                        timer.status === 'expired' ? '#000000' : '#f6f6f7',
                        color: timer.status === 'active' ? '#ffffff' : 
                               timer.status === 'scheduled' ? '#ffffff' : 
                               timer.status === 'expired' ? '#ffffff' : '#000000'
                      }}>
                        {timer.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </div>
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '14px', 
                      color: '#6d7175',
                      lineHeight: '1.5'
                    }}>
                      {timer.customization?.message || 'No description'}
                    </p>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px',
                      fontSize: '13px', 
                      color: '#8c9196' 
                    }}>
                      <div>
                        <span style={{ fontWeight: '500', color: '#6d7175' }}>Type:</span>{' '}
                        {timer.type === 'fixed' ? 'Fixed' : 'Evergreen'}
                      </div>
                      <div>
                        <span style={{ fontWeight: '500', color: '#6d7175' }}>Start:</span>{' '}
                        {timer.type === 'fixed' 
                          ? formatDate(timer.startDate) 
                          : 'Evergreen timer'}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontWeight: '500', color: '#6d7175' }}>Target:</span>{' '}
                        {timer.targetType === 'all' 
                          ? 'All products' 
                          : timer.targetType === 'products' 
                          ? `${timer.targetIds?.length || 0} product(s)`
                          : `${timer.targetIds?.length || 0} collection(s)`}
                        {timer.targetType !== 'all' && timer.targetIds && timer.targetIds.length > 0 && (
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '8px', 
                            background: '#f6f6f7', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxHeight: '100px',
                            overflowY: 'auto'
                          }}>
                            <div style={{ fontWeight: '500', color: '#6d7175', marginBottom: '4px' }}>
                              {timer.targetType === 'products' ? 'Product IDs:' : 'Collection IDs:'}
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: '4px',
                              color: '#202223'
                            }}>
                              {timer.targetIds.map((id, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #e1e3e5',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    fontFamily: 'monospace',
                                    fontSize: '11px'
                                  }}
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {timer.targetType !== 'all' && (!timer.targetIds || timer.targetIds.length === 0) && (
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '11px', 
                            color: '#8c9196', 
                            fontStyle: 'italic' 
                          }}>
                            No {timer.targetType === 'products' ? 'products' : 'collections'} selected
                          </div>
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: '500', color: '#6d7175' }}>Priority:</span>{' '}
                        <span style={{ 
                          color: timer.priority > 0 ? '#000000' : '#8c9196', 
                          fontWeight: timer.priority > 0 ? '600' : 'normal' 
                        }}>
                          {timer.priority || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="timer-actions" style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px', 
                    alignItems: 'stretch',
                    minWidth: '120px'
                  }}>
                    {timer.status === 'draft' && (
                      <button 
                        className="btn btn-primary"
                        disabled={activatingId === timer._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(timer._id);
                        }}
                        title="Activate this timer to make it visible on the storefront"
                        style={{ 
                          padding: '8px 16px', 
                          fontSize: '14px',
                          borderRadius: '4px',
                          background: activatingId === timer._id ? '#6d7175' : '#000000',
                          color: 'white',
                          border: 'none',
                          cursor: activatingId === timer._id ? 'not-allowed' : 'pointer',
                          width: '100%',
                          fontWeight: '500',
                          transition: 'background 0.2s'
                        }}
                      >
                        {activatingId === timer._id ? 'Activating...' : 'Activate'}
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button 
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTimer(timer);
                        }}
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '14px',
                          border: '1px solid #e1e3e5',
                          borderRadius: '4px',
                          background: 'white',
                          color: '#202223',
                          cursor: 'pointer',
                          flex: 1,
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        title="Preview timer"
                      >
                        <FaEye size={14} /> Preview
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/timers/${timer._id}/edit`);
                        }}
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '14px',
                          border: '1px solid #e1e3e5',
                          borderRadius: '4px',
                          background: 'white',
                          color: '#202223',
                          cursor: 'pointer',
                          flex: 1,
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Edit timer"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button 
                        className="menu-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(timer);
                        }}
                        style={{ 
                          padding: '8px 12px',
                          fontSize: '14px',
                          border: '1px solid #e1e3e5',
                          borderRadius: '4px',
                          background: 'white',
                          color: '#000000',
                          cursor: 'pointer',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete timer"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem', 
              color: '#6d7175',
              background: 'white',
              border: '1px solid #e1e3e5',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <FaClipboardList size={48} color="#6d7175" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: '500', color: '#202223', marginBottom: '8px' }}>
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No timers match your filters' 
                  : 'No timers yet'}
              </p>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first timer to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: '8px' }}
                >
                  + Create timer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Timer"
      >
        <TimerCreate 
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewTimer}
        onClose={() => setPreviewTimer(null)}
        title={`Preview: ${previewTimer?.name || 'Timer'}`}
      >
        {previewTimer && (
          <TimerPreview
            customization={previewTimer.customization || {}}
            type={previewTimer.type}
            startDate={previewTimer.startDate}
            endDate={previewTimer.endDate}
            duration={previewTimer.duration}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTimer}
        onClose={() => setDeleteTimer(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Timer"
        message={`Are you sure you want to delete "${deleteTimer?.name || 'this timer'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle={{
          background: '#000000',
          color: 'white'
        }}
        cancelButtonStyle={{
          background: 'white',
          color: '#202223',
          border: '1px solid #e1e3e5'
        }}
      />
    </div>
  );
}

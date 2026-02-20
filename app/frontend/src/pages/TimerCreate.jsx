import React, { useState, useEffect } from 'react';
import '../styles/App.css';
import ColorPickerGradient from '../components/ColorPickerGradient';
import { getShopDomain } from '../utils/shop.js';
import ResourcePickerButton from '../components/ResourcePickerButton.jsx';
import TimerPreview from '../components/TimerPreview.jsx';

export default function TimerCreate({ initialData, isEdit = false, timerId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    duration: 3600,
    targetType: 'all',
    targetIds: [],
    priority: 0,
    status: 'draft',
    promotionDescription: '',
    customization: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      position: 'top',
      timerSize: 'medium',
      urgencyNotification: 'color-pulse',
      title: '',
      description: '',
      showDescription: false,
      message: 'Hurry! Sale ends in',
      showUrgency: true,
      urgencyThreshold: 3600,
    },
  });

  useEffect(() => {
    if (initialData) {
      const startDate = initialData.startDate ? new Date(initialData.startDate) : null;
      const endDate = initialData.endDate ? new Date(initialData.endDate) : null;

      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'fixed',
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        startTime: startDate ? startDate.toTimeString().slice(0, 5) : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        endTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
        duration: initialData.duration || 3600,
        targetType: initialData.targetType || 'all',
        targetIds: initialData.targetIds || [],
        priority: initialData.priority || 0,
        status: initialData.status || 'draft',
        promotionDescription: initialData.customization?.message || '',
        customization: {
          backgroundColor: initialData.customization?.backgroundColor || '#000000',
          textColor: initialData.customization?.textColor || '#ffffff',
          position: initialData.customization?.position || 'top',
          timerSize: initialData.customization?.timerSize || 'medium',
          urgencyNotification: initialData.customization?.urgencyNotification || 'color-pulse',
          title: initialData.customization?.title || '',
          description: initialData.customization?.description || '',
          showDescription: initialData.customization?.showDescription || false,
          message: initialData.customization?.message || 'Hurry! Sale ends in',
          showUrgency: initialData.customization?.showUrgency !== false,
          urgencyThreshold: initialData.customization?.urgencyThreshold || 3600,
        },
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const shop = getShopDomain();

      // Combine date and time for fixed timers
      let submitData = { ...formData };
      if (formData.type === 'fixed') {
        if (formData.startDate && formData.startTime) {
          submitData.startDate = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
        }
        if (formData.endDate && formData.endTime) {
          submitData.endDate = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
        }
        delete submitData.startTime;
        delete submitData.endTime;
        delete submitData.duration; // Remove duration for fixed timers
      } else if (formData.type === 'evergreen') {
        // Remove date fields for evergreen timers
        delete submitData.startDate;
        delete submitData.endDate;
        delete submitData.startTime;
        delete submitData.endTime;
      }

      // Use promotion description as message if provided
      if (formData.promotionDescription) {
        submitData.customization.message = formData.promotionDescription;
      }
      delete submitData.promotionDescription;

      // All customization fields are now supported in the backend schema

      const url = isEdit ? `/api/timers/${timerId}` : '/api/timers';
      const method = isEdit ? 'PUT' : 'POST';

      // Don't send shop in body for updates (it's in header)
      const bodyData = { ...submitData };
      if (isEdit) {
        delete bodyData.shop; // Shop comes from header, not body
      }

      console.log(`[TimerCreate] ${isEdit ? 'Updating' : 'Creating'} timer:`, { url, method, bodyData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shop,
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[TimerCreate] Error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to ${isEdit ? 'update' : 'create'} timer`);
      }

      const result = await response.json();
      console.log(`[TimerCreate] Timer ${isEdit ? 'updated' : 'created'} successfully:`, result);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    if (field.startsWith('customization.')) {
      const key = field.split('.')[1];
      setFormData({
        ...formData,
        customization: {
          ...formData.customization,
          [key]: value,
        },
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  // Handle ResourcePicker selection
  const handleResourceSelection = (selectedIds) => {
    const newIds = [...new Set([...formData.targetIds, ...selectedIds])];
    updateField('targetIds', newIds);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          padding: '12px',
          background: '#f6f6f7',
          color: '#000000',
          border: '1px solid #000000',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label required">Timer name</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter timer name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label required">Timer type</label>
        <select
          className="form-select"
          value={formData.type}
          onChange={(e) => updateField('type', e.target.value)}
          required
        >
          <option value="fixed">Fixed Timer (Specific start/end date)</option>
          <option value="evergreen">Evergreen Timer (Session-based, resets per visitor)</option>
        </select>
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
          {formData.type === 'fixed'
            ? 'All users see the same countdown based on start/end dates'
            : 'Each visitor gets their own countdown timer that starts when they first visit'}
        </p>
      </div>

      {formData.type === 'fixed' && (
        <>
          <div className="form-group">
            <label className="form-label">Start date</label>
            <div className="date-time-row">
              <input
                type="date"
                className="form-input"
                placeholder="mm/dd/yyyy"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
              <input
                type="time"
                className="form-input"
                placeholder="--:--"
                value={formData.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">End date</label>
            <div className="date-time-row">
              <input
                type="date"
                className="form-input"
                placeholder="mm/dd/yyyy"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
              <input
                type="time"
                className="form-input"
                placeholder="--:--"
                value={formData.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {formData.type === 'evergreen' && (
        <div className="form-group">
          <label className="form-label required">Duration (seconds)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g., 3600 (1 hour)"
            value={formData.duration}
            onChange={(e) => updateField('duration', parseInt(e.target.value) || 3600)}
            min="60"
            max="86400"
            required
          />
          <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
            Minimum: 60 seconds (1 minute), Maximum: 86400 seconds (24 hours)
            <br />
            Current: {Math.floor(formData.duration / 3600)}h {Math.floor((formData.duration % 3600) / 60)}m {formData.duration % 60}s
          </p>
        </div>
      )}

      <div className="form-group">
        <label className="form-label required">Target products</label>
        <select
          className="form-select"
          value={formData.targetType}
          onChange={(e) => updateField('targetType', e.target.value)}
          required
        >
          <option value="all">All products</option>
          <option value="products">Specific products</option>
          <option value="collections">Specific collections</option>
        </select>
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
          {formData.targetType === 'all'
            ? 'Timer will appear on all product pages'
            : formData.targetType === 'products'
              ? 'Enter product IDs separated by commas (e.g., 123456789, 987654321)'
              : 'Enter collection IDs separated by commas (e.g., 123456789, 987654321)'}
        </p>
      </div>

      {(formData.targetType === 'products' || formData.targetType === 'collections') && (
        <div className="form-group">
          <label className="form-label required">
            {formData.targetType === 'products' ? 'Product IDs' : 'Collection IDs'}
          </label>
          <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
            {formData.targetType === 'products'
              ? 'Select specific products to display the timer on.'
              : 'Select specific collections to display the timer on.'}
          </p>

          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {formData.targetIds.map((id) => (
                <span
                  key={id}
                  style={{
                    background: '#e1e3e5',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => updateField('targetIds', formData.targetIds.filter(tid => tid !== id))}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px',
                      color: '#5c5f62'
                    }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={`Enter ${formData.targetType === 'products' ? 'product' : 'collection'} IDs separated by commas (e.g., 123456789, 987654321)`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target.value.trim();
                    if (input) {
                      const ids = input.split(',').map(id => id.trim()).filter(id => id);
                      const newIds = [...new Set([...formData.targetIds, ...ids])];
                      updateField('targetIds', newIds);
                      e.target.value = '';
                    }
                  }
                }}
                style={{ flex: 1 }}
              />
              <ResourcePickerButton
                resourceType={formData.targetType === 'products' ? 'product' : 'collection'}
                onSelection={handleResourceSelection}
                buttonText={`Browse ${formData.targetType === 'products' ? 'Products' : 'Collections'}`}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#6d7175', marginTop: '4px' }}>
              Press Enter to add IDs manually, or use "Browse" to select from Shopify (if available).
            </p>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Priority (0-100)</label>
        <input
          type="number"
          className="form-input"
          placeholder="0"
          value={formData.priority}
          onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)}
          min="0"
          max="100"
        />
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
          Higher priority timers will be shown when multiple timers match the same product.
          <br />
          Priority order: Specific products (highest) → Collections → All products (lowest)
          <br />
          Within same type, higher priority number wins. Default: 0
        </p>
      </div>

      <div className="form-group">
        <label className="form-label required">Status</label>
        <select
          className="form-select"
          value={formData.status}
          onChange={(e) => updateField('status', e.target.value)}
          required
        >
          <option value="draft">Draft (Not active)</option>
          <option value="active">Active (Show on storefront)</option>
          <option value="scheduled">Scheduled (For fixed timers - starts automatically)</option>
        </select>
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
          {formData.status === 'draft' && 'Timer will not be displayed on storefront'}
          {formData.status === 'active' && 'Timer will be displayed immediately (for evergreen) or when start date arrives (for fixed)'}
          {formData.status === 'scheduled' && 'Timer will automatically become active when start date arrives'}
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Promotion description</label>
        <textarea
          className="form-textarea"
          placeholder="Enter promotion details"
          value={formData.promotionDescription}
          onChange={(e) => updateField('promotionDescription', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Timer Title</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter timer title (optional)"
          value={formData.customization.title}
          onChange={(e) => updateField('customization.title', e.target.value)}
          maxLength={100}
        />
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
          Optional title displayed above the timer (max 100 characters)
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Timer Description</label>
        <textarea
          className="form-textarea"
          placeholder="Enter timer description (optional)"
          value={formData.customization.description}
          onChange={(e) => updateField('customization.description', e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px' }}>
          Optional description displayed below the timer (max 500 characters)
        </p>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.customization.showDescription}
            onChange={(e) => updateField('customization.showDescription', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Show description on timer</span>
        </label>
        <p style={{ fontSize: '12px', color: '#6d7175', marginTop: '4px', marginLeft: '28px' }}>
          Toggle to show or hide the description on the storefront timer
        </p>
      </div>

      <div className="form-group">
        <ColorPickerGradient
          label="Color"
          value={formData.customization.backgroundColor}
          onChange={(value) => updateField('customization.backgroundColor', value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Timer size</label>
        <select
          className="form-select"
          value={formData.customization.timerSize}
          onChange={(e) => updateField('customization.timerSize', e.target.value)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Timer position</label>
        <select
          className="form-select"
          value={formData.customization.position}
          onChange={(e) => updateField('customization.position', e.target.value)}
        >
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Urgency notification</label>
        <select
          className="form-select"
          value={formData.customization.urgencyNotification}
          onChange={(e) => updateField('customization.urgencyNotification', e.target.value)}
        >
          <option value="color-pulse">Color pulse</option>
          <option value="text-blink">Text blink</option>
          <option value="none">None</option>
        </select>
      </div>

      {/* Timer Preview */}
      <TimerPreview
        customization={formData.customization}
        type={formData.type}
        startDate={formData.type === 'fixed' && formData.startDate && formData.startTime 
          ? new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
          : formData.startDate}
        endDate={formData.type === 'fixed' && formData.endDate && formData.endTime
          ? new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
          : formData.endDate}
        duration={formData.duration}
      />

      <div className="button-group">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel || (() => { })}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading
            ? (isEdit ? 'Updating...' : 'Creating...')
            : (isEdit ? 'Update timer' : 'Create timer')}
        </button>
      </div>
    </form >
  );
}


import React, { useState, useEffect } from 'react';

/**
 * TimerPreview - Shows a preview of how the timer will look on the storefront
 */
export default function TimerPreview({ 
  customization = {},
  type = 'fixed',
  startDate,
  endDate,
  duration = 3600
}) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (type === 'fixed' && endDate) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const end = new Date(endDate).getTime();
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        
        setTimeRemaining(diff);
        setIsUrgent(diff <= (customization.urgencyThreshold || 3600) && diff > 0);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else if (type === 'evergreen') {
      // For evergreen, show a countdown from the duration
      let remaining = duration;
      setTimeRemaining(remaining);
      setIsUrgent(remaining <= (customization.urgencyThreshold || 3600));

      const interval = setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        setTimeRemaining(remaining);
        setIsUrgent(remaining <= (customization.urgencyThreshold || 3600) && remaining > 0);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [type, endDate, duration, customization.urgencyThreshold]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00:00';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerSize = customization.timerSize || 'medium';
  const urgencyNotification = customization.urgencyNotification || 'color-pulse';
  const message = customization.message || 'Hurry! Sale ends in';
  const title = customization.title || '';
  const description = customization.description || '';
  const showDescription = customization.showDescription && description;
  const backgroundColor = customization.backgroundColor || '#000000';
  const textColor = customization.textColor || '#ffffff';
  const position = customization.position || 'top';

  // Size styles
  const sizeStyles = {
    small: { 
      padding: '0.5rem 0.75rem', 
      fontSize: '0.85rem', 
      minHeight: '45px',
      countdownFontSize: '1.2rem',
      messageFontSize: '0.75rem'
    },
    medium: { 
      padding: '1rem 1.5rem', 
      fontSize: '1rem', 
      minHeight: '60px',
      countdownFontSize: '1.8rem',
      messageFontSize: '0.9rem'
    },
    large: { 
      padding: '1.5rem 2.5rem', 
      fontSize: '1.2rem', 
      minHeight: '80px',
      countdownFontSize: '2.5rem',
      messageFontSize: '1.1rem'
    },
  };

  const sizeStyle = sizeStyles[timerSize] || sizeStyles.medium;

  // Urgency styles
  const urgentStyle = isUrgent && customization.showUrgency !== false ? {
    fontWeight: 'bold',
    ...(urgencyNotification === 'color-pulse' && {
      animation: 'pulse 1s infinite',
      transform: 'scale(1.02)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    }),
    ...(urgencyNotification === 'text-blink' && {
      animation: 'blink 1s infinite',
    }),
  } : {};

  return (
    <div style={{
      border: '1px solid #e1e3e5',
      borderRadius: '8px',
      padding: '20px',
      background: '#ffffff',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '14px', 
        fontWeight: '600',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Preview
      </h3>
      
      <div style={{
        border: '2px dashed #e1e3e5',
        borderRadius: '4px',
        padding: '20px',
        background: '#f6f6f7',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Position indicator */}
        <div style={{
          position: 'absolute',
          top: position === 'top' ? '10px' : 'auto',
          bottom: position === 'bottom' ? '10px' : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px'
        }}>
          <div
            style={{
              background: backgroundColor,
              color: textColor,
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              ...sizeStyle,
              ...urgentStyle,
              transition: 'all 0.3s ease',
            }}
          >
            {title && (
              <div style={{ 
                fontSize: sizeStyle.messageFontSize ? `calc(${sizeStyle.messageFontSize} * 1.1)` : '1rem',
                opacity: 0.95,
                fontWeight: '600',
                marginBottom: '0.25rem'
              }}>
                {title}
              </div>
            )}
            <div style={{ 
              fontSize: sizeStyle.messageFontSize,
              opacity: 0.9
            }}>
              {message}
            </div>
            <div style={{ 
              fontSize: sizeStyle.countdownFontSize,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              letterSpacing: '2px'
            }}>
              {timeRemaining !== null ? formatTime(timeRemaining) : '00:00:00'}
            </div>
            {showDescription && (
              <div style={{ 
                fontSize: sizeStyle.messageFontSize ? `calc(${sizeStyle.messageFontSize} * 0.9)` : '0.8rem',
                opacity: 0.9,
                fontWeight: '400',
                lineHeight: '1.4',
                marginTop: '0.25rem',
                textAlign: 'center'
              }}>
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Position label */}
        <div style={{
          position: 'absolute',
          top: position === 'top' ? '60px' : 'auto',
          bottom: position === 'bottom' ? '60px' : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          color: '#8c9196',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          Position: {position}
        </div>

        {/* Info text */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '20px',
          fontSize: '12px',
          color: '#6d7175',
          textAlign: 'center'
        }}>
          {type === 'fixed' && !endDate && 'Set end date to see countdown'}
          {type === 'evergreen' && 'Evergreen timer preview'}
          {type === 'fixed' && endDate && timeRemaining === 0 && 'Timer expired'}
          {type === 'fixed' && endDate && timeRemaining > 0 && `Ends: ${new Date(endDate).toLocaleString()}`}
        </div>
      </div>

      {/* Preview info */}
      <div style={{
        marginTop: '12px',
        padding: '12px',
        background: '#f6f6f7',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6d7175'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <strong>Size:</strong> {timerSize}
          </div>
          <div>
            <strong>Urgency:</strong> {customization.showUrgency !== false ? urgencyNotification : 'None'}
          </div>
          <div>
            <strong>Background:</strong> <span style={{ 
              display: 'inline-block',
              width: '16px',
              height: '16px',
              background: backgroundColor,
              border: '1px solid #e1e3e5',
              borderRadius: '2px',
              verticalAlign: 'middle',
              marginLeft: '4px'
            }}></span>
          </div>
          <div>
            <strong>Text:</strong> <span style={{ 
              display: 'inline-block',
              width: '16px',
              height: '16px',
              background: textColor,
              border: '1px solid #e1e3e5',
              borderRadius: '2px',
              verticalAlign: 'middle',
              marginLeft: '4px'
            }}></span>
          </div>
        </div>
      </div>

      {/* CSS animations for urgency effects */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}



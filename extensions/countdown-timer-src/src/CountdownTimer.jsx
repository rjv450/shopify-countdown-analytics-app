import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

function formatHHMMSS(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function secondsUntil(isoDateString) {
  const nowMs = Date.now();
  const endMs = new Date(isoDateString).getTime();
  return Math.max(0, Math.floor((endMs - nowMs) / 1000));
}

export function CountdownTimer({ productId, shop, apiUrl }) {
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [evergreenStartMs, setEvergreenStartMs] = useState(null);

  const evergreenStorageKey = useMemo(() => (timer?.id ? `countdown-timer-${timer.id}` : null), [timer?.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        console.log('[TimerDebug] Starting fetch...');
        console.log('[TimerDebug] API URL:', apiUrl);
        console.log('[TimerDebug] Params:', { productId, shop });

        const url = new URL(apiUrl);
        url.searchParams.set('productId', productId);
        url.searchParams.set('shop', shop);

        const res = await fetch(url.toString(), {
          cache: 'default',
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });

        console.log('[TimerDebug] Fetch response received. Status:', res.status);

        if (res.status === 404) {
          console.warn('[TimerDebug] 404 Not Found');
          if (!cancelled) {
            setTimer(null);
            setError(`No active timer found for this product.`);
          }
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const contentType = res.headers.get('content-type');
        console.log('[TimerDebug] Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.warn('[TimerDebug] Invalid content type. First 100 chars:', text.substring(0, 100));
          throw new Error('Invalid response format (not JSON)');
        }

        const json = await res.json();
        console.log('[TimerDebug] JSON parsed:', json);

        if (!cancelled) {
          if (json.timer) {
            console.log('[TimerDebug] Setting timer state:', json.timer);
            setTimer(json.timer);
          } else {
            console.warn('[TimerDebug] No timer object in JSON');
            setTimer(null);
            setError('API returned no timer object');
          }
        }
      } catch (err) {
        console.error('[TimerDebug] Error:', err);
        if (!cancelled) setError(err.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [apiUrl, productId, shop]);

  useEffect(() => {
    if (!timer) return;

    console.log('[TimerDebug] Timer active effect running');

    // Initial tick
    if (timer.type === 'fixed') {
      const initial = secondsUntil(timer.endDate);
      setSecondsLeft(initial);
    } else if (evergreenStorageKey) {
      // Evergreen initial logic
    }

    let interval;

    if (timer.type === 'fixed') {
      interval = setInterval(() => {
        const remaining = secondsUntil(timer.endDate);
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setTimer(null);
        }
      }, 1000);
    } else {
      if (!evergreenStorageKey) return;

      let start = evergreenStartMs;
      if (!start) {
        const stored = localStorage.getItem(evergreenStorageKey);
        if (stored) {
          start = parseInt(stored, 10);
        } else {
          start = Date.now();
          localStorage.setItem(evergreenStorageKey, start.toString());
        }
        setEvergreenStartMs(start);
        // Set initial seconds left for evergreen
        const elapsedSec = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, timer.duration - elapsedSec);
        setSecondsLeft(remaining);
      }

      interval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, timer.duration - elapsedSec);
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          localStorage.removeItem(evergreenStorageKey);
          setTimer(null);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer, evergreenStartMs, evergreenStorageKey]);

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center', color: '#666', border: '1px solid #ddd' }}>Loading timer... (Check Console)</div>;

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#721c24',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        <strong>Debug Error:</strong> {error}
      </div>
    );
  }

  if (!timer) return null;

  const customization = timer.customization || {};
  const isUrgent = customization.showUrgency && secondsLeft != null && secondsLeft <= (customization.urgencyThreshold || 3600);
  const showDescription = customization.showDescription && customization.description;
  
  // Timer size styles
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
  const timerSize = customization.timerSize || 'medium';
  const sizeStyle = sizeStyles[timerSize] || sizeStyles.medium;
  
  // Base styles from customization
  const baseStyle = {
    backgroundColor: customization.backgroundColor || '#000000',
    color: customization.textColor || '#ffffff',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '1rem 0',
    fontWeight: 'normal',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...sizeStyle,
  };

  // Urgency styles based on urgencyNotification setting
  const urgencyType = customization.urgencyNotification || 'color-pulse';
  const urgentStyle = isUrgent ? {
    fontWeight: 'bold',
    ...(urgencyType === 'color-pulse' && {
      animation: 'pulse 1s infinite',
      transform: 'scale(1.02)',
      boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
    }),
    ...(urgencyType === 'text-blink' && {
      animation: 'blink 1s infinite',
    }),
  } : {};

  // Position-based margin adjustments
  const positionStyle = customization.position === 'top' ? {
    marginTop: '0',
    marginBottom: '1rem',
  } : customization.position === 'bottom' ? {
    marginTop: '1rem',
    marginBottom: '0',
  } : {
    margin: '1rem 0',
  };

  const containerStyle = { ...baseStyle, ...urgentStyle, ...positionStyle };

  // Title style (scales with timer size)
  const titleStyle = {
    marginBottom: '0.5rem',
    fontSize: sizeStyle.messageFontSize ? `calc(${sizeStyle.messageFontSize} * 1.1)` : '1rem',
    opacity: 0.95,
    fontWeight: '600',
  };

  // Message style (scales with timer size)
  const messageStyle = {
    marginBottom: '0.5rem',
    fontSize: sizeStyle.messageFontSize || '0.9rem',
    opacity: 0.95,
    fontWeight: '500',
  };

  // Timer display style (scales with timer size)
  const timerDisplayStyle = {
    fontSize: sizeStyle.countdownFontSize || '1.8rem',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    lineHeight: '1.2',
  };

  // Description style (scales with timer size)
  const descriptionStyle = {
    marginTop: '0.5rem',
    fontSize: sizeStyle.messageFontSize ? `calc(${sizeStyle.messageFontSize} * 0.9)` : '0.8rem',
    opacity: 0.9,
    fontWeight: '400',
    lineHeight: '1.4',
  };

  return (
    <div style={containerStyle} className="countdown-timer-widget">
      {customization.title && (
        <div style={titleStyle}>{customization.title}</div>
      )}
      {customization.message && (
        <div style={messageStyle}>{customization.message}</div>
      )}
      <div style={timerDisplayStyle}>{formatHHMMSS(secondsLeft)}</div>
      {showDescription && (
        <div style={descriptionStyle}>{customization.description}</div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.85;
            transform: scale(1.05);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .countdown-timer-widget {
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

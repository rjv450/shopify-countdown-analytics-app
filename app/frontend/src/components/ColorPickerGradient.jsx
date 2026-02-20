import React, { useState, useRef, useEffect } from 'react';
import './ColorPickerGradient.css';

export default function ColorPickerGradient({ value, onChange, label }) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const gradientRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    // Convert hex to HSL if value is provided
    if (value) {
      const rgb = hexToRgb(value);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
      }
    }
  }, [value]);

  const handleGradientClick = (e) => {
    const rect = gradientRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    setSaturation(s);
    setLightness(l);
    updateColor(hue, s, l);
  };

  const handleSliderClick = (e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = Math.round((y / rect.height) * 360);
    setHue(h);
    updateColor(h, saturation, lightness);
  };

  const updateColor = (h, s, l) => {
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange(hex);
  };

  const gradientColor = `hsl(${hue}, 100%, 50%)`;
  const selectedColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return (
    <div className="color-picker-container">
      {label && <label className="color-picker-label">{label}</label>}
      <div className="color-picker-wrapper">
        <div
          ref={gradientRef}
          className="color-gradient"
          style={{
            background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, ${gradientColor})`,
          }}
          onClick={handleGradientClick}
        >
          <div
            className="color-selector"
            style={{
              left: `${saturation}%`,
              top: `${100 - lightness}%`,
            }}
          />
        </div>
        <div
          ref={sliderRef}
          className="color-slider"
          style={{
            background: `linear-gradient(to bottom, 
              hsl(0, 100%, 50%),
              hsl(60, 100%, 50%),
              hsl(120, 100%, 50%),
              hsl(180, 100%, 50%),
              hsl(240, 100%, 50%),
              hsl(300, 100%, 50%),
              hsl(360, 100%, 50%)
            )`,
          }}
          onClick={handleSliderClick}
        >
          <div
            className="slider-indicator"
            style={{ top: `${(hue / 360) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}







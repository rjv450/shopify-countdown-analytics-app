import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import TimerCreate from './TimerCreate';
import { getShopDomain } from '../utils/shop.js';

export default function TimerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimer();
  }, [id]);

  const fetchTimer = async () => {
    try {
      const shop = getShopDomain();
      const response = await fetch(`/api/timers/${id}?shop=${shop}`);

      if (!response.ok) {
        throw new Error('Failed to fetch timer');
      }

      const data = await response.json();
      setTimer(data.timer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      </div>
    );
  }

  if (error || !timer) {
    return (
      <div className="app-container">
        <div style={{ padding: '2rem', color: '#000000', border: '1px solid #000000', background: '#f6f6f7', borderRadius: '4px' }}>
          Error: {error || 'Timer not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Modal
        isOpen={true}
        onClose={handleCancel}
        title="Edit Timer"
      >
        <TimerCreate 
          initialData={timer} 
          isEdit={true} 
          timerId={id}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
}


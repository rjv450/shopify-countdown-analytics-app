import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TimerCreate from './pages/TimerCreate';
import TimerEdit from './pages/TimerEdit';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/timers/create" element={<TimerCreate />} />
        <Route path="/timers/:id/edit" element={<TimerEdit />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Generator from './components/Generator';
import Timelapse from './components/Timelapse';

export default function App(props) { 
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Generator />} />
        <Route exact path="/timelapse/:location/:day" element={<Timelapse />} />
      </Routes>
    </Router>
  );
}
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom';

import Generator from './components/Generator';
import Timelapse from './components/Timelapse';

export default function App(props) { 
  return (
    <Router>
      <div>
        <Route exact path="/" component={Generator} />
        <Route path="/timelapse" component={Timelapse} />
      </div>
    </Router>
  );
}
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom';

import Generator from './components/Generator';

export default function App(props) { 
  return (
    <Router>
      <Route exact path="/" component={Generator}/>
    </Router>
  );
}
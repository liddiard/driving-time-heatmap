import React, { Component } from 'react';

import '../styles/Timelapse.css';

export default class Timelapse extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="App">
        <input type="range" min="6" max="24" step="0.01" value="6" />
      </div>
    );
  }
}
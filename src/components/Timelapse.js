import React, { Component } from 'react';

import '../styles/Timelapse.css';

export default class Timelapse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      minsFromMidnight: this.props.startHour * 60
    };
    this.handleTimeChange = this.handleTimeChange.bind(this);
  }

  handleTimeChange(event) {
    this.setState({ minsFromMidnight: event.target.value });
  }

  slugToTitle(slug) {
    return slug.replace(/-/g, ' ');
  }

  formatTime(minsFromMidnight) {
    const hour = Math.floor(minsFromMidnight/60);
    const min = Math.round((minsFromMidnight/60 - hour) * 60, 2);
    return [hour, this.pad(min)].join(':');
  }

  pad(num) { 
    return ('0' + num).substr(-2);
  }

  render() {
    return (
      <div className="App">
        <h1>{this.slugToTitle(this.props.match.params.location)}</h1>
        <h2>{this.slugToTitle(this.props.match.params.day)}</h2>
        <figure className="maps">
          { new Array(1+(this.props.endHour-this.props.startHour)*2)
            .fill(null)
            .map((_, i) => {
              const hour = this.props.startHour + Math.floor(i/2);
              const time = i % 2 ? hour+':30' : hour+':00';
              return (
                <img src={[this.props.baseUrl, 
                          this.props.match.params.location, 
                          this.props.match.params.day, 
                          `${time}.png`].join('/')}
                          style={{opacity: 1}}
                          alt={time}
                          key={time} />
              );
            })
          }
        </figure>
        <input type="range" 
               min={this.props.startHour*60} 
               max={this.props.endHour*60}
               value={this.state.minsFromMidnight}
               onChange={this.handleTimeChange} />
        <time>{this.formatTime(this.state.minsFromMidnight)}</time>
      </div>
    );
  }
}

Timelapse.defaultProps = {
  startHour: 6,
  endHour: 22
};
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import config from '../config.json';
import '../styles/Timelapse.css';
import Legend from './Legend';

export default class Timelapse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      minsFromMidnight: this.props.startHour * 60,
      mapsLoaded: 0, // number of maps loaded
      playing: false
    };
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleMapLoad = this.handleMapLoad.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);
  }

  handleTimeChange(event) {
    window.clearInterval(this.interval);
    this.setState({ 
      playing: false,
      minsFromMidnight: parseInt(event.target.value) 
    });
  }

  handleMapLoad() {
    this.setState(prevState => ({
      mapsLoaded: prevState.mapsLoaded + 1
    }));
  }

  handlePlay() {
    this.setState({ playing: true }, () => {
      this.interval = window.setInterval(() => {
        if (this.state.minsFromMidnight < this.props.endHour * 60) {
          this.setState(prevState => ({
            minsFromMidnight: prevState.minsFromMidnight + 1
          }));
        }
        else {
          this.setState({ playing: false }, () => {
            window.clearInterval(this.interval);
          });
        }
      }, 50);
    });
  }

  handlePause() {
    this.setState({ playing: false }, () => {
      window.clearInterval(this.interval);
    });
  }

  slugToTitle(slug) {
    return slug.replace(/-/g, ' ');
  }

  formatTime(minsFromMidnight) {
    const hour = Math.floor(minsFromMidnight/60);
    const min = Math.round((minsFromMidnight/60 - hour) * 60, 2);
    return [this.pad(hour), this.pad(min)].join(':');
  }

  pad(num) { 
    return ('0' + num).substr(-2);
  }

  render() {
    const maps = [];
    for (let i = this.props.startHour; i <= this.props.endHour; i += 0.5) {
      const time = i % 1 ? this.pad(Math.floor(i))+'.30' : 
                           this.pad(Math.floor(i))+'.00';
      let opacity;
      if (i*60 <= this.state.minsFromMidnight) {
        opacity = 1;
      }
      else if (i*60 <= this.state.minsFromMidnight+30) {
        opacity = 1 - ((i*60 - this.state.minsFromMidnight) / 30);
      }
      else {
        opacity = 0;
      }
      maps.push(
        <img src={[this.props.baseUrl, 
                  this.props.match.params.location, 
                  this.props.match.params.day, 
                  `${time}.png`].join('/')}
                  style={{opacity: opacity}}
                  onLoad={this.handleMapLoad}
                  alt={time}
                  key={time} />
      );
    }
    const progress = <progress></progress>
    return (
      <div className="Timelapse App">
        <header>
          Driving times from
          <h1>{this.slugToTitle(this.props.match.params.location)}</h1>
          on a
          <h2>{this.slugToTitle(this.props.match.params.day)}</h2>
        </header>
        <Legend durations={this.props.durations} 
                iconUrlPrefix={this.props.iconUrlPrefix} />
        <figure className="maps">
          {maps}
          { this.state.mapsLoaded < this.props.numMaps ? 
            <progress min="0" max={this.props.numMaps} 
                      value={this.state.mapsLoaded}></progress> 
            : '' 
          }
        </figure>
        <time>{this.formatTime(this.state.minsFromMidnight)}</time>
        <input type="range" 
               min={this.props.startHour*60} 
               max={this.props.endHour*60}
               value={this.state.minsFromMidnight}
               onChange={this.handleTimeChange}
               autoFocus />
        { this.state.playing ? 
          <button className="pause control" title="pause"
                  onClick={this.handlePause}>⏸</button>

          : 
          <button className="play control" title="play" 
                  onClick={this.handlePlay}>▶️</button>
        } 
        <footer>
          <p>Created using <Link to="/">Driving Time Heatmap 🚗 ⏱ 🔥 🗺</Link></p>
        </footer>
      </div>
    );
  }
}

const startHour = 6;
const endHour = 22;
Timelapse.defaultProps = Object.assign({
  startHour: startHour,
  endHour: endHour,
  baseUrl: '/timelapse',
  numMaps: (endHour - startHour) * 2
}, config);
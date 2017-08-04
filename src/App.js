import React, { Component } from 'react';
import request from 'superagent';
import Autocomplete from 'react-google-autocomplete';
import Geodesy from 'geodesy';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apiLoaded: false,
      loading: false,
      place: null,
      apiKey: 'AIzaSyC4GIdBEWo_T_5-54ZqYWKM0P-CBWZH-ww',
      origin: {
        lat: null,
        lng: null
      },
      points: [],
      timeType: 'now', // valid values: 'arrival_time', 'departure_time', 'now'
      datetime: ''
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
    this.handlePlaceSelected = this.handlePlaceSelected.bind(this);
    this.handleDatetimeChange = this.handleDatetimeChange.bind(this);
    this.handleTimeTypeChange = this.handleTimeTypeChange.bind(this);
  }

  componentDidMount() {
    const mapsAPIScript = document.createElement('script');
    mapsAPIScript.src = `https://maps.googleapis.com/maps/api/js?key=${this.state.apiKey}&libraries=places`;
    document.body.appendChild(mapsAPIScript);
    mapsAPIScript.onload = () => this.setState({ apiLoaded: true });
  }

  handlePlaceSelected(place) {
    this.setState({ 
      origin: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      points: []
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    if (!this.state.origin.lat) {
      return;
    }
    this.setState({ loading: true }, this.getTravelTimes);
  }

  handleLoad(event) {
    this.setState({ loading: false });
  }

  handleTimeTypeChange(event) {
    this.setState({ timeType: event.target.value });
  }

  handleDatetimeChange(event) {
    console.log(event.target.value);
    this.setState({ datetime: event.target.value });
  }

  directionsFromNumPoints(numPoints) {
    const directions = [];
    for (let i = 0; i < numPoints; ++i) {
      directions.push((i / numPoints) * 360);
    }
    return directions;
  }

  query(points, acc) {
    if (!points.length) {
      return this.setState({ 
        points: this.state.points.map((p, i) => Object.assign({}, p, { duration: acc[i] }))
      });
    }
    const quantityPerCall = 24;
    const pointsFormatted = points
    .slice(0, quantityPerCall)
    .map(point => [point.lat, point.lon].join(','));
    return request
    .get('https://cors.harrisonliddiard.com/https://maps.googleapis.com/maps/api/distancematrix/json')
    .query({
      units: 'imperial',
      origins: [this.state.origin.lat, this.state.origin.lng].join(','),
      destinations: pointsFormatted.join('|'),
      key: this.state.apiKey,
      [this.state.timeType]: this.state.datetime ? Math.floor((new Date(this.state.datetime)).getTime() / 1000) : undefined
    })
    .then(res => {
      if (!res.body.rows.length || !res.body.rows[0].elements) {
        console.error(res.body);
        
        throw new Error('Malformed API response.');
      }
      const durations = res.body.rows[0].elements;
      const newAcc = durations
      .filter(d => d.duration_in_traffic || d.duration)
      .map(d => d.duration_in_traffic ? d.duration_in_traffic.value : d.duration.value);
      return this.query(points.slice(quantityPerCall), acc.concat(newAcc));
    });
  }

  getTravelTimes() {
    const LatLon = Geodesy.LatLonSpherical;
    const origin = LatLon(this.state.origin.lat, this.state.origin.lng);
    const ringRadii = new Array(this.props.rings.quantity)
    .fill(null)
    .map((_, index) => this.props.rings.radiusFunc(index));
    const ringPoints = ringRadii
    .map((radius, index) =>
      this.directionsFromNumPoints(this.props.rings.pointsFunc(index))
      .map(direction => 
        origin.destinationPoint(radius, direction)
      )
    );
    // https://stackoverflow.com/a/10865042
    this.setState({ points: [].concat.apply([], ringPoints) }, () => {
      this.query(this.state.points, []);
    });
  }

  render() {
    let map;
    if (this.state.origin.lat) {
      map = (
        <img className="map base" src={`https://maps.googleapis.com/maps/api/staticmap?center=${this.state.origin.lat},${this.state.origin.lng}&zoom=11&scale=2&size=640x640&maptype=roadmap&markers=${this.state.origin.lat},${this.state.origin.lng}`} alt="map" />
      );
    }
    let overlay;
    if (this.state.points.length && 
        this.state.points[0].hasOwnProperty('duration')) {
      const paths = Object.keys(this.props.durations)
      .map(Number)
      .map((duration, i) =>
        `&markers=scale:3|icon:http://s3-us-west-2.amazonaws.com/travel-time.harrisonliddiard.com/${this.props.durations[duration]}.png|` + this.state.points
        .filter(p => {
          const minutesTo = p.duration / 60;
          if (i === 0) {
            return minutesTo <= duration;
          }
          else if (i === Object.keys(this.props.durations).length - 1) {
            return minutesTo > duration;
          }
          else {
            return minutesTo <= duration && minutesTo > duration - 5
          }
        })
        .map(p => [p.lat.toFixed(4), p.lon.toFixed(4)].join(','))
        .join('|')
      )
      .join('');
      const overlayStyles = '&style=visibility:off';
      overlay = (
        <img className="map overlay" onLoad={this.handleLoad} src={`https://maps.googleapis.com/maps/api/staticmap?center=${this.state.origin.lat},${this.state.origin.lng}${overlayStyles}&zoom=9&scale=2&size=640x640&maptype=roadmap${paths}`} alt="map" />
      );
    }
    let submitText;
    if (this.state.loading) {
      submitText = <span>
        Generating Map… <span className="loading">{this.state.loading ? '↻' : ''}</span>
      </span>;
    }
    else {
      submitText = <span>Generate Map</span>;
    }
    return (
      <div className="App">
        <header>
          <h1>Harrison’s Fabulous Driving Time Map™ 📍🚗 🗺</h1>
          <h2>Moving somewhere new? Want to see how much your commute and other car travel will suck, or maybe try to avoid hating every minute in traffic? This map is for you!</h2>
          <form onSubmit={this.handleSubmit}>
            { this.state.apiLoaded ? 
              <Autocomplete
                style={{
                  width: '100%',
                  fontSize: '2em',
                  padding: '0.2em 0.4em'
                }}
                types={['address']}
                onPlaceSelected={this.handlePlaceSelected}
                autoFocus
              /> : ''
            }
            <div className="time-type">
              Time: 
              <label>
                <input type="radio" value="now" onChange={this.handleTimeTypeChange}
                      checked={this.state.timeType === 'now'} />
                Now
              </label>
              <label>
                <input type="radio" value="departure_time" onChange={this.handleTimeTypeChange}
                      checked={this.state.timeType === 'departure_time'} />
                Depart at:
              </label>
              <label>
                <input type="radio" value="arrival_time" onChange={this.handleTimeTypeChange}
                      checked={this.state.timeType === 'arrival_time'} />
                Arrive by:
              </label>
              <input className="datetime" type="datetime-local"
                    value={this.state.datetime}
                    onChange={this.handleDatetimeChange} 
                    disabled={this.state.timeType === 'now'}
                    min={(new Date()).toISOString().substr(0, 16)} />
              { this.state.timeType !== 'now' ? 
                <span className="tooltip">
                  Enter a date and time in the future; e.g. next Monday during rush hour.<br/>
                  Times are in your local time zone.
                </span>
                : ''
              }
              {/* https://stackoverflow.com/a/26749559 ^ */}
            </div>
            <button type="submit" disabled={!this.state.origin.lat || this.state.loading}>
              {submitText}
            </button>
          </form>
        </header>
        <figure className="map-wrapper">
          {overlay}
          {map}
        </figure>
      </div>
    );
  }
}

App.defaultProps = {
  rings: {
    quantity: 8,
    radiusFunc: ringNum => (2400 * ringNum) + 2400,
    pointsFunc: ringNum => (3 * ringNum) + 4
  },
  durations: {
    // max 5 unique icons per request
    // https://developers.google.com/maps/documentation/static-maps/intro#CustomIcons
    10: 'teal',
    15: 'green',
    20: 'yellow',
    25: 'orange',
    30: 'red'
  }
};

export default App;

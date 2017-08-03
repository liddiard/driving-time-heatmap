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
      apiKey: 'AIzaSyDCJf2aFDE5ylZIQueCfVk7G_AuPgbRQ74',
      origin: {
        lat: null,
        lng: null
      },
      points: [],
      timeType: 'now', // valid values: 'arrival_time', 'departure_time', 'now'
      datetime: ''
    };
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
      }
    }, this.getTravelTimes);
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
        throw new Error('Malformed API response:', res.body);
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
    let overlay, map;
    if (this.state.origin.lat) {
      const paths = Object.keys(this.props.durations)
      .reverse()
      .map(Number)
      .map(duration =>
        `&markers=scale:3|icon:http://s3-us-west-2.amazonaws.com/travel-time.harrisonliddiard.com/${this.props.durations[duration]}.png|` + this.state.points
        .filter(p => (p.duration / 60) <= duration && (p.duration / 60) > duration - 5)
        .map(p => [p.lat.toFixed(4), p.lon.toFixed(4)].join(','))
        .join('|')
      )
      .join('');
      const overlayStyles = '&style=visibility:off';
      overlay = (
        <img className="map overlay" src={`https://maps.googleapis.com/maps/api/staticmap?center=${this.state.origin.lat},${this.state.origin.lng}${overlayStyles}&zoom=9&scale=2&size=640x640&maptype=roadmap${paths}`} alt="map" />
      );
      map = (
        <img className="map base" src={`https://maps.googleapis.com/maps/api/staticmap?center=${this.state.origin.lat},${this.state.origin.lng}&zoom=11&scale=2&size=640x640&maptype=roadmap`} alt="map" />
      );
    }
    return (
      <div className="App">
        <h1>Hello world</h1>
        { this.state.apiLoaded ? 
          <Autocomplete
            style={{width: '100%'}}
            types={['address']}
            onPlaceSelected={this.handlePlaceSelected}
          /> : ''
        }
        <div className="time-type">
          <label>
            <input type="radio" value="now" onChange={this.handleTimeTypeChange}
                  checked={this.state.timeType === 'now'} />
            Now
          </label>
          <label>
          <label>
            <input type="radio" value="departure_time" onChange={this.handleTimeTypeChange}
                  checked={this.state.timeType === 'departure_time'} />
            Depart at
          </label>
            <input type="radio" value="arrival_time" onChange={this.handleTimeTypeChange}
                  checked={this.state.timeType === 'arrival_time'} />
            Arrive by
          </label>
          { this.state.timeType !== 'now' ? 
            <input id="datetime" type="datetime-local" value={this.state.datetime}
                  onChange={this.handleDatetimeChange} />
            : ''
          }
        </div>
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
    5: 'green',
    10: 'yellowgreen',
    15: 'yellow',
    20: 'orange',
    25: 'red',
    30: 'darkred'
  }
};

export default App;

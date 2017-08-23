import React, { Component } from 'react';
import request from 'superagent';
import Autocomplete from 'react-google-autocomplete';
import Flatpickr from 'react-flatpickr'
import Geodesy from 'geodesy';

import config from '../config.json';
import Examples from './Examples';
import Heatmap from './Heatmap';
import '../styles/Generator.css';

export default class Generator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apiLoaded: false,
      loading: false,
      place: null,
      apiKey: window.localStorage.getItem('apiKey') || '',
      origin: {
        lat: null,
        lng: null
      },
      points: [],
      timeType: 'now', // valid values: 'arrival_time', 'departure_time', 'now'
      datetime: ''
    };
    this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
    this.handlePlaceSelected = this.handlePlaceSelected.bind(this);
    this.handleDatetimeChange = this.handleDatetimeChange.bind(this);
    this.handleTimeTypeChange = this.handleTimeTypeChange.bind(this);
  }

  componentDidMount() {
    const mapsAPIScript = document.createElement('script');
    mapsAPIScript.src = `https://maps.googleapis.com/maps/api/js?key=${this.props.apiKey}&libraries=places`;
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

  handleApiKeyChange(event) {
    this.setState({ apiKey: event.target.value }, () => {
      window.localStorage.setItem('apiKey', this.state.apiKey);
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

  handleDatetimeChange(value) {
    this.setState({ datetime: value });
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
      if (res.body.status === 'OVER_QUERY_LIMIT') {
        return alert('Someone’s been generating a lot of maps!\n\nUnfortunately, you’ve exceeded your daily request limit for the Google Maps service that powers the driving time map generation.\n\nPlease try again in around 24 hours. :(');
      }
      else if (!res.body.rows.length || !res.body.rows[0].elements) {
        console.error(res.body);
        throw new Error('Malformed API response.');
      }
      const durations = res.body.rows[0].elements;
      const newAcc = durations
      .map(d => {
        if (d.duration_in_traffic)
          return d.duration_in_traffic.value;
        else if (d.duration)
          return d.duration.value;
        else // no route to destination point
          return Infinity;
      });
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
    let submitText;
    if (this.state.loading) {
      submitText = <span>
        Generating Your Map…
      </span>;
    }
    else {
      submitText = <span>4. Generate Your Map!</span>;
    }
    let map;
    if (this.state.origin.lat) {
      map = <Heatmap durations={this.props.durations} 
                     iconUrlPrefix={this.props.iconUrlPrefix} 
                     points={this.state.points} origin={this.state.origin} 
                     apiKey={this.props.apiKey} handleLoad={this.handleLoad} />
    }
    return (
      <div className="Generator App">
        <Examples />
        <header>
          <h1>Driving Time Heatmap 🚗 ⏱ 🔥 🗺</h1>
          <h2>Create a color map that shows how long it will take to drive from an origin point – like your apartment or a prospective home – to surrounding areas in different traffic conditions.</h2>
          <form onSubmit={this.handleSubmit}>
            <h3>1. Enter an origin address 📍</h3>
            { this.state.apiLoaded ? 
              <Autocomplete
                style={{
                  width: '100%',
                  fontSize: '2em',
                  padding: '0.2em 0.4em'
                }}
                types={['address']}
                onPlaceSelected={this.handlePlaceSelected}
                placeholder="42 Wallaby Way, Sydney, Australia"
                required
                autoFocus
              /> : ''
            }
            <h3>2. Choose a date and time for traffic conditions 🚦</h3>
            <div className="time-type">
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
              <Flatpickr data-enable-time
                         disabled={this.state.timeType === 'now'}
                         placeholder="Select date and time"
                         onChange={this.handleDatetimeChange}
                         options={{
                           // disable past dates
                           disable: [{ from: "1900-01-01", to: (new Date()).toISOString().substr(0, 10) }],
                         }} />
              {/* https://stackoverflow.com/a/26749559 ^ */}
              { this.state.timeType !== 'now' ? 
                <div className="tooltip">
                  Select a date and time in the future.<br/>
                  Times are based on your computer’s current time zone.
                </div>
                : ''
              }
            </div>
            <div className="api-key">
              <h3>3. Get and paste your Google Maps key 🔑</h3>
              <a href="#why-api-key" className="why">
                Why do I need to do this? ▾
              </a>
              <p id="why-api-key">
                Generating this map requires a Google Maps service that permits a limited number of daily uses per person. Because of this, you need to get and use your own (free!) key. Your key will allow you to generate about 20 driving time maps per day.
              </p>
              <ol>
                <li>Go to <a href="https://developers.google.com/maps/documentation/distance-matrix/get-api-key#step-1-get-an-api-key-from-the-google-api-console" target="_blank">this page</a> and press “Get a key”.</li>
                <li>From the “Select or create project” menu, choose “Create a new project”.</li>
                <li>Name the project “Driving time map”.</li>
                <li>Press “Create and enable API”.</li>
                <li>From “Your API key”, copy the string of letters and numbers and paste it below:</li>
              </ol>
              <input type="text" value={this.state.apiKey} 
                     onChange={this.handleApiKeyChange} 
                     required placeholder="Paste your key here"
                     autoCorrect="off" autoCapitalize="off" spellCheck="false" />
            </div>
            <button type="submit"
                    disabled={!this.state.apiKey || !this.state.origin.lat || this.state.loading}>
              {submitText}
            </button>
            { this.state.loading ? 
              <div className="loading-info">
                Map generation usually takes 10-15 seconds. Hang tight!
                <progress />
              </div> : ''
            }
          </form>
        </header>
        <main>
          {map}
        </main>
        <section className="how-it-works">
          <h3>How it works</h3>
          <p>Driving Time Heatmap creates an array of more than 100 points surrounding your origin address in concentric circles. It queries the <a href="https://developers.google.com/maps/documentation/distance-matrix/" target="_blank">Google Maps Distance Matrix API</a> for driving time estimates from your origin point to these surrounding points at your selected time. It plots the results onto a color-coded map using the <a href="https://developers.google.com/maps/documentation/static-maps/" target="_blank">Google Static Maps API</a>.</p>
          <p>For more info, check out <a href="https://harrisonliddiard.com/project/driving-time-heatmap/" target="_blank">my blog post</a></p>.
        </section>
        <footer>
          Created by <a href="https://harrisonliddiard.com" target="_blank">Harrison Liddiard</a>. Source <a href="https://github.com/liddiard/travel-time-map" target="_blank">on GitHub</a>.
        </footer>
      </div>
    );
  }
}

Generator.defaultProps = Object.assign({
  apiKey: 'AIzaSyC4GIdBEWo_T_5-54ZqYWKM0P-CBWZH-ww',
  // must be HTTP, not HTTPS, for static maps api
  rings: {
    quantity: 8,
    radiusFunc: ringNum => (2400 * ringNum) + 2400,
    pointsFunc: ringNum => (3 * ringNum) + 4
  }
}, config);
import React from 'react';
import PropTypes from 'prop-types';

import '../styles/Heatmap.css';
import Legend from './Legend';

function displayOverlay(props) {
  return props.points.length && 
         props.points[0].hasOwnProperty('duration');
}

export default function Heatmap(props) {
  const map = (
    <img className="map base" src={`https://maps.googleapis.com/maps/api/staticmap?center=${props.origin.lat},${props.origin.lng}&zoom=11&scale=2&size=640x640&maptype=roadmap&markers=${props.origin.lat},${props.origin.lng}&key=${props.apiKey}`} alt="map" />
  );
  let overlay, legend;
  if (displayOverlay(props)) {
    const paths = Object.keys(props.durations)
    .map(Number)
    .map((duration, i) =>
      `&markers=scale:3|icon:${props.iconUrlPrefix}${props.durations[duration]}.png|` + props.points
      .filter(p => {
        const minutesTo = p.duration / 60;
        if (i === 0) {
          return minutesTo <= duration;
        }
        else if (i === Object.keys(props.durations).length - 1) {
          return minutesTo > duration;
        }
        else {
          return minutesTo <= duration && minutesTo > duration - 5
        }
      })
      .map(p => [p._lat.toFixed(4), p._lon.toFixed(4)].join(','))
      .join('|')
    )
    .join('');
    const overlayStyles = '&style=visibility:off';
    overlay = (
      <img className="map overlay" onLoad={props.handleLoad} src={`https://maps.googleapis.com/maps/api/staticmap?center=${props.origin.lat},${props.origin.lng}${overlayStyles}&zoom=9&scale=2&size=640x640&maptype=roadmap${paths}&key=${props.apiKey}`} alt="map" />
    );
    legend = (
      <Legend durations={props.durations} 
              iconUrlPrefix={props.iconUrlPrefix} />
    );
  }
  return (
    <div>
      {legend}
      <figure className="map-wrapper">
        {overlay}
        {map}
      </figure>
    </div>
  );
}

Heatmap.propTypes = {
  durations: PropTypes.object.isRequired,
  iconUrlPrefix: PropTypes.string.isRequired,
  points: PropTypes.array.isRequired,
  origin: PropTypes.object.isRequired,
  apiKey: PropTypes.string.isRequired,
  handleLoad: PropTypes.func.isRequired
};
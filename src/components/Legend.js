import React from 'react';
import PropTypes from 'prop-types';

import '../styles/Legend.css';

function makeHttps(url) {
  return url.replace('http://', 'https://');
}

export default function Legend(props) {
  return (
    <legend>
      <h3>Minutes from origin point:</h3>
      <ul>
        { Object.keys(props.durations)
          .map((d, i) => {
            const color = props.durations[d];
            let range;
            if (i === 0)
              range = `0–${d}`;
            else if (i === Object.keys(props.durations).length - 1)
              range = `${d-5}+`;
            else
              range = `${d-5}–${d}`;
            return <li key={d}>
              <img src={`${makeHttps(props.iconUrlPrefix)}${color}.png`} 
                   alt={color} /> {range}
            </li>
          }) 
        }
      </ul>
    </legend>
  );
}

Legend.propTypes = {
  durations: PropTypes.object.isRequired,
  iconUrlPrefix: PropTypes.string.isRequired
};
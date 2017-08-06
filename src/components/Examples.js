import React from 'react';
import PropTypes from 'prop-types';

import '../styles/Examples.css';

export default function Examples(props) {
  return (
    <ul className="examples">
      {props.blah}
      { props.items.map(item => <li key={item.image}>
          <img src={`${props.baseUrl}${item.image}`} alt={item.description} />
          <p>{item.description}</p>
        </li>)
      }
    </ul>
  );
}

Examples.propTypes = {
  baseUrl: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired
};

Examples.defaultProps = {
  baseUrl: '/examples/',
  items: [
    {
      image: 'la_early_morning_weekend.png',
      description: 'From Downtown LA on an early morning weekend'
    },
    {
      image: 'la_rush_hour.png',
      description: 'From Downtown LA during rush hour'
    },
    {
      image: 'bellevue_weekday_early_afternoon.png',
      description: 'From Bellevue during an early afternoon weekday'
    },
    {
      image: 'houston_suburb_fri_morning.png',
      description: 'From a Houston suburb on Friday morning'
    },
    {
      image: 'munich_stadium_late_evening.png',
      description: 'From the Olympic stadium in Munich on a late evening weekday'
    },
    {
      image: 'melborne_suburbs_saturday_morning.png',
      description: 'From the suburbs of Melbourne on Saturday morning'
    }
  ]
};
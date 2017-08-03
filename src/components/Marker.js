import React from 'react';

export default function Marker(props) {
  return (
    <div className="marker" style={{ 
      left: props.lng*1000, 
      top: props.lat*1000,
      transform: `translate(${-props.origin.lng*1000}px, ${-props.origin.lat*1000}px)`
    }}>
    </div>
  )
}
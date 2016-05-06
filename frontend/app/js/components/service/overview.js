import React from 'react'

function Overview(props){
  function tag(props){
    return (
      <span className="ui label">
        {props}
      </span>
    )
  }

  return (
    <div className="ui background white central">
    <div className="ui text container">
      <h1>{props.service.name}</h1>
      {props.service.tags.map( (t) => tag(t) )}
      <div className="ui text segment">{props.service.description}</div>
      </div>
    </div>
  )
}

export default Overview

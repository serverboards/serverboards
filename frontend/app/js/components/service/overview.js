import React from 'react'
import {random_color} from '../../utils'

function Overview(props){
  function tag(tagname){
    return (
      <span key={tagname} className={`ui label ${random_color(tagname)}`}>
        {tagname}
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

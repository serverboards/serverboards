import React from 'react'
import {random_color} from 'app/utils'

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
      <h1>{props.serverboard.name}</h1>
      {props.serverboard.tags.map( (t) => tag(t) )}
      <div className="ui text segment">{props.serverboard.description}</div>
      </div>
    </div>
  )
}

export default Overview

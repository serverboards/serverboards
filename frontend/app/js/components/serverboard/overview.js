import React from 'react'
import {random_color} from 'app/utils'
import Board from 'app/containers/serverboard/board'

function Overview(props){
  function tag(tagname){
    return (
      <span key={tagname} className={`ui label ${random_color(tagname)}`}>
        {tagname}
      </span>
    )
  }

  return (
    <div className="ui central board">
      <div className="ui text container">
        <h1>{props.serverboard.name}</h1>
        {props.serverboard.tags.map( (t) => tag(t) )}
        <div className="ui text container">{props.serverboard.description}</div>
      </div>
      <div className="ui container" style={{paddingTop:30}}>
        <Board location={props.location} serverboard={props.serverboard.shortname}/>
      </div>
    </div>
  )
}

export default Overview

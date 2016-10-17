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
      <Board location={props.location} serverboard={props.serverboard.shortname}/>
    </div>
  )
}

export default Overview

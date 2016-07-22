import React from 'react'
import {Link} from 'app/router'

function ProcessesMenu(props){
  return (
    <div className="ui dropdown vertical menu" style={{position: "fixed", right: 180, top: 40}}>
      {props.running.map((p) =>
        <a href={`#/process/${p.uuid}`} className="item">
          {p.name}
        </a>
      )}
      <div className="ui divider"/>
      <a href="#/process/history" className="item">
        View process history
      </a>
    </div>
  )
}

export default ProcessesMenu

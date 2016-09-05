import React from 'react'
import {Link} from 'app/router'

function ProcessesMenu(props){
  return (
    <div className="ui dropdown">
      <div className="vertical menu" style={{position: "fixed", right: 80, top: 45}}>
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
    </div>
  )
}

export default ProcessesMenu

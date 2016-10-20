import React from 'react'
import {Link} from 'app/router'
import {is_empty} from 'app/utils'

function ProcessesMenu(props){
  return (
    <div className="ui dropdown pointing">
      <div className="menu transition visible" style={{position: "fixed", left: "calc( 100vw - 240px", width: 200, top: 45}}>
        {!is_empty(props.running) ? (
          <div>
            {props.running.map((p) =>
              <a href={`#/process/${p.uuid}`} className="item">
                {p.name}
              </a>
            )}
            <div className="ui divider"/>
          </div>
        ) : null}
        <a href="#/process/history" className="item">
          View process history
        </a>
      </div>
    </div>
  )
}

export default ProcessesMenu

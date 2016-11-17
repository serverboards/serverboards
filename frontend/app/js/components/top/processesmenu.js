import React from 'react'
import {Link} from 'app/router'
import {is_empty} from 'app/utils'

function ProcessesMenu(props){
  return (
    <div className="ui dropdown pointing" id="processes_menu">
      <div className="menu transition visible">
        {!is_empty(props.running) ? (
          <div>
            {props.running.map((p) =>
              <a href={`#/process/${p.uuid}`} className="item divider"  style={{display: "flex"}}>
                <span style={{flexGrow:1, fontWeight: "bold"}}>{p.name}</span>
                <i className="ui icon tiny right teal loading notched circle"/>
              </a>
            )}
          </div>
        ) : (
          <div>
            <div className="item centered ui grey" style={{display: "flex"}}>
              <span style={{flexGrow:1}}>No active processes</span>
            </div>
          </div>
        )}
        <a href="#/process/history" className="item inverted yellow">
          View process history
          <i className="ui caret right icon" style={{paddingLeft: 5}}/>
        </a>
      </div>
    </div>
  )
}

export default ProcessesMenu

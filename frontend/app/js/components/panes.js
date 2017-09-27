import React from 'react'

function Panes(props){
  return (
    <div className="ui expand two column grid grey background" style={{margin:0}}>
      <div className="ui column">
        <div className="ui round pane white background">
          {props.column1}
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane white background">
          {props.column2}
        </div>
      </div>
    </div>
  )
}

export default Panes

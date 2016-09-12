import React from 'react'
import HoldButton from '../holdbutton'

function ActionMenu(props){
  return (
    <div className="ui vertical menu">
      {!props.service.is_virtual ? (
        <HoldButton className="item" onHoldClick={props.handleDetach}>Hold to Detach</HoldButton>
      ) : []}
      {props.service.fields ? (
        <div className="item" onClick={props.handleOpenSettings}>Settings<i className="ui icon settings"/></div>
      ) : []}
      {props.actions ? props.actions.map( (ac) => (
        <div className="item" onClick={() => props.triggerAction(ac.id)}>{ ac.extra.icon ? (<i className={`ui ${ac.extra.icon} icon`}/>) : []} {ac.name}</div>
      )) : (
        <div className="item disabled">
          Loading
        </div>
      ) }
    </div>
  )
}

export default ActionMenu

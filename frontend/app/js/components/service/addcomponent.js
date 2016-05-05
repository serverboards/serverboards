import React from 'react'
import LogoIcon from '../logoicon'
import Modal from '../modal'

require("../../../sass/modal.sass")

function AddComponent(props){
  console.log(props)

  function addComponent(ev, id){
    ev.preventDefault()
    props.onAdd(id)
  }

  function WrappedComponent(props){
    return (
      <a key={props.id} className="column center aligned" onClick={(ev) => addComponent(ev, props.id)} href="#">
        <LogoIcon name={props.name} style={{margin: 'auto'}}/>
        {props.name}
      </a>
    )
  }

  return (
    <Modal onClose={props.onClose}>
      <div className="header">
        Select a component to add
      </div>
      <div className="content">
        <div className="ui five column grid">
          {props.components.map((c) => WrappedComponent(c))}
        </div>
      </div>
      <div className="actions">
        <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
      </div>
    </Modal>
  )
}

export default AddComponent

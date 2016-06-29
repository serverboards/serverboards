import React from 'react'

require('sass/modal.sass')

function Modal(props){
  return (
    <div className="ui modal background">
      <div className="ui modal active">
      <i className="close icon" onClick={props.onClose}></i>
      {props.children}
      </div>
    </div>
  )
}

export default Modal

import React from 'react'

require('sass/modal.sass')

function Modal(props){
  const logo=require("../../imgs/logo.svg")
  return (
    <div className="ui modal background">
      <div className="ui top menu">
        <a href="#/">
          <img className="logo" src={logo}/>
        </a>

        <a className="right aligned" onClick={props.onClose} title="Close popup"><i className="big close icon "/></a>
      </div>
      <div className="content">
        <div className="content">
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default Modal

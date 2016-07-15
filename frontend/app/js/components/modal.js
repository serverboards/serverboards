import React from 'react'
import { goBack } from 'react-router-redux'
import store from 'app/utils/store'

require('sass/modal.sass')

function Modal(props){
  const onClose = props.onClose || (() => {
    store.dispatch( goBack() )
  })

  const logo=require("../../imgs/logo.svg")
  return (
    <div className={`ui modal background ${props.className}`}>
      <div className="ui top menu">
        <a href="#/">
          <img className="logo" src={logo}/>
        </a>

        <a className="right aligned" onClick={onClose} title="Close popup"><i className="big close icon "/></a>
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

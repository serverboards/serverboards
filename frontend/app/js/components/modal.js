import React from 'react'
import { goBack } from 'react-router-redux'
import store from 'app/utils/store'
const logo=require("../../imgs/logo.svg")

require('sass/modal.sass')

const Modal=React.createClass({
  handleMaybeClose(ev){
    if (ev.keyCode==27)
      this.onClose()
  },
  componentDidMount(){
    $(window).on("keyup", this.handleMaybeClose)
  },
  componentWillUnmount(){
    $(window).off("keyup", this.handleMaybeClose)
  },
  onClose(){
    if (this.props.onClose)
      this.props.onClose()
    else
      store.dispatch( goBack() )
  },
  render(){
    const props=this.props

    return (
      <div className={`ui modal background ${props.className || ""}`} id={props.id}>
        <div className="ui top menu">
          <a href="#/" className="logo">
            <img className="logo" src={logo}/>
          </a>
          <div className="central"></div>

          <a className="right aligned" onClick={this.onClose} title="Close popup"><i className="big close icon "/></a>
        </div>
        <div className="content">
          <div className="content">
            {props.children}
          </div>
        </div>
      </div>
    )
  }
})

export default Modal

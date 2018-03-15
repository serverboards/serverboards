import React from 'react'
import { goBack } from 'react-router-redux'
import store from 'app/utils/store'
const logo=require("../../imgs/logo.svg")

require('sass/modal.sass')

class Modal extends React.Component{
  handleMaybeClose(ev){
    if (ev.keyCode==27)
      this.onClose()
  }
  componentDidMount(){
    $(window).on("keydown", this.handleMaybeClose)
  }
  componentWillUnmount(){
    $(window).off("keydown", this.handleMaybeClose)
  }
  onClose(){
    if (this.props.onClose)
      this.props.onClose()
    else
      store.dispatch( goBack() )
  }
  render(){
    const props=this.props

    const ignoreClick = (ev) => ev.stopPropagation()

    return (
      <div className={`ui modal background ${props.className || ""}`} id={props.id} onClick={this.onClose}>
        <div className="ui top menu" onClick={ignoreClick}>
          <a href="#/" className="logo">
            <img className="logo" src={logo}/>
          </a>
          <div className="central"></div>

          <a className="right aligned" onClick={this.onClose.bind(this)} title="Close popup"><i className="big close icon "/></a>
        </div>
        <div className="content" onClick={ignoreClick}>
          {props.children}
        </div>
      </div>
    )
  }
}

export default Modal

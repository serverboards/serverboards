import React from 'react'
import { goBack } from 'react-router-redux'
import store from 'app/utils/store'

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

    const logo=require("../../imgs/logo.svg")
    return (
      <div className={`ui modal background ${props.className}`}>
        <div className="ui top menu">
          <a href="#/">
            <img className="logo" src={logo}/>
          </a>

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

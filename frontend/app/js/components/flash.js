import React from 'react'
import Flash from '../flash'

var FlashMessage = function(props){
  return (
    <div className={"ui message "+props.level}>
      <i className="close icon" onClick={props.onClose}></i>
        {props.message}
    </div>
  )
}

var FlashMessageList = React.createClass({
  getInitialState : function(){
    return {
      messages: [],
      maxid: 0,
    }
  },
  componentDidMount : function(){
    this.add_message("Welcome to Serverboards.", {timeout: 10000, level: "orange"})

    Flash.log=function(message, options){ this.add_message(message, options) }.bind(this)
  },
  add_message : function(message, __options){
    var options={level:"info", timeout:100000}
    if (__options)
      Object.assign(options, __options)

    var self=this

    var msg={message, level: options.level, id: this.state.maxid}

    if (options.timeout>0){
      setTimeout(function(){
        self.remove_message(message)
      }, options.timeout)
    }

    var messages = this.state.messages.concat( msg )
    this.setState( {messages, maxid: this.state.maxid+1 } )
  },
  remove_message : function(message_to_remove){
    var messages = this.state.messages.filter( function(msg){
      return msg.message != message_to_remove
    })
    this.setState( {messages} )
  },
  render: function(){
    var self=this
    var messages=this.state.messages.map(function(msg){
      msg.remove_message = function(){
        self.remove_message(msg.message)
      }
      return (
        <FlashMessage key={msg.id} message={msg.message} level={msg.level} onClose={msg.remove_message}/>
      )
    })

    return (
      <div className="ui top messages">
          {messages}
      </div>
    )
  }
})

export default FlashMessageList

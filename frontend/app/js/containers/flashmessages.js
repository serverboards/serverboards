import React from 'react'
import Flash from '../flash'
import FlashMessageListView from '../components/flashmessages'

var FlashMessageList = React.createClass({
  getInitialState: function(){
    return {
      messages: [],
      maxid: 1
    }
  },
  componentDidMount : function(){
    Flash.log=this.add_message//.bind(this)

    Flash.log("Welcome")
  },
  add_message : function(message, __options={}){
    var options={level:"info", timeout:10000}
    if (__options)
      Object.assign(options, __options)

    var self=this

    var msg={
      message,
      level: options.level,
      id: this.state.maxid,
      onClose: function(){
        self.remove_message(message)
      }
    }

    if (options.timeout>0){
      setTimeout(msg.onClose, options.timeout)
    }

    this.setState( {
      messages: this.state.messages.concat( msg ),
      maxid: this.state.maxid+1
    } )
  },
  remove_message : function(message_to_remove){
    var messages = this.state.messages.filter( function(msg){
      return msg.message != message_to_remove
    })
    this.setState( {messages} )
  },
  render: function(){
    return (
      <FlashMessageListView messages={this.state.messages}/>
    )
  }
})

export default FlashMessageList

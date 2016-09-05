import React, { PropTypes } from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import ConnectionBanner from 'app/containers/connectionbanner'

require("sass/messages.sass")

const level_to_class = {
  error: 'negative',
  success: 'success',
  debug: 'olive'
}

var FlashMessage=React.createClass({
  render(){
    let color=level_to_class[this.props.level] || ''

    return (
      <div className={"ui message "+color}>
        <i className="close icon" onClick={() => this.props.onClose(this.props.message)}></i>
        <MarkdownPreview value={this.props.message}/>
      </div>
    )
  }
})

function FlashMessageList({messages, handleClose}){
  return (
    <div className="ui top messages">
      {messages.map(msg =>
        <FlashMessage key={msg.id} {...msg} onClose={handleClose}/>
      )}
      <ConnectionBanner status="WILL_NOT_RECONNECT"/>
    </div>
  )
}

FlashMessage.propTypes = {
  id: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
  level: PropTypes.string
}

FlashMessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    level: PropTypes.string
  }))
}

export default FlashMessageList

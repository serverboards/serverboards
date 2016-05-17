import React, { PropTypes } from 'react'

require("../../sass/messages.sass")

const level_to_class = {
  error: 'negative',
  success: 'success',
  debug: 'olive'
}

var FlashMessage=React.createClass({
  render: function(){
    let color=level_to_class[this.props.level] || ''

    return (
      <div className={"ui message "+color}>
        <i className="close icon" onClick={() => this.props.onClose(this.props.message)}></i>
        {this.props.message}
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

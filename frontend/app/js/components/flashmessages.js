import React, { PropTypes } from 'react'

var FlashMessage=React.createClass({
  render: function(){
    return (
      <div className={"ui message "+this.props.level}>
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

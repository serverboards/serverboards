import React, { PropTypes } from 'react'

function FlashMessage(props){

  var maybe_close=[]

  if (props.onClose !== undefined){
    maybe_close = <i className="close icon" onClick={props.onClose}></i>
  }

  return (
    <div className={"ui message "+props.level}>
      {maybe_close}
      {props.message}
    </div>
  )
}

function FlashMessageList({messages}){
  return (
    <div className="ui top messages">
      {messages.map(msg =>
        <FlashMessage key={msg.id} {...msg}/>
      )}
    </div>
  )
}

FlashMessage.propTypes = {
  id: PropTypes.number.isRequired,
  onClose: PropTypes.func,
  message: PropTypes.string.isRequired,
  level: PropTypes.string
}

FlashMessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    onClose: PropTypes.func,
    message: PropTypes.string.isRequired,
    level: PropTypes.string
  }))
}

export default FlashMessageList

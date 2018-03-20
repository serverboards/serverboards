import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import ConnectionBanner from 'app/containers/connectionbanner'
import {i18n, i18n_nop} from 'app/utils/i18n'
import PropTypes from 'prop-types'

require("sass/messages.sass")

const level_to_class = {
  error: 'error',
  success: 'success',
  info: 'info',
  warning: 'warning',
  debug: 'debug'
}

const level_to_title = {
    error: i18n_nop("Error"),
    info: i18n_nop("Information"),
    success: i18n_nop("Success"),
    debug: i18n_nop("Debug"),
    warning: i18n_nop("Warning")
}

function FlashMessage(props){
  const level = props.level
  let color=level_to_class[level] || ''
  let message = props.message
  if (typeof message == 'object'){
    console.log("Flash message object: %o", message)
    message=message.message || String(message)
  }

  return (
    <div className={"ui message "+color}>
      <i className={`ui label rectangular ${color}`}/>
      <div className="content">
        <h3 className="ui header">{props.title || i18n(level_to_title[level])}</h3>
        <MarkdownPreview value={message}/>
      </div>
      <i className="close icon" onClick={() => props.onClose(props.message)}></i>
    </div>
  )
}

function FlashMessageList({messages, handleClose}){
  return (
    <div className="ui messages flash">
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

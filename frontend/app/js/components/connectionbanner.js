import React from 'react'

function ConnectionBanner(props){
  switch(props.status){
    case "CONNECTED":
      return (<span/>)
    case "NOTCONNECTED":
    case "CLOSED":
      return (
        <div className="ui icon floating message">
          <i className="notched circle loading icon" style={{marginLeft: 25}}></i>
          <div className="content">
            <div className="header">
              Reconnecting...
            </div>
            <p>Snap! there was a connection problem. Trying to solve.</p>
            <div className="ui buttons">
              <a className="ui button disabled">Reconnecting...</a>
            </div>
          </div>
        </div>
      )
    case "CONNECTING":
    case "RECONNECT":
    case "RECONNECTING":
      return (
        <div className="ui icon floating message">
          <i className="notched circle loading icon" style={{marginLeft: 25}}></i>
          <div className="content">
            <div className="header">
              Reconnecting in {props.extra/1000} seconds
            </div>
            <p>Snap! there was a connection problem. Trying to solve.</p>
            <div className="ui buttons">
              <a className="ui button yellow" onClick={props.reconnect}>Reconnect now</a>
            </div>
          </div>
        </div>
      )
    case "WILL_NOT_RECONNECT":
      return (
        <div className="ui icon floating message red">
          <i className="warning sign icon" style={{marginLeft: 25}}></i>
          <div className="content">
            <div className="header">
              Too many errors reconnecting
            </div>
            <p>I will not try to reconnect automatically. You can force reconnection if you will.</p>
            <div className="ui buttons">
              <a className="ui button yellow" onClick={props.reconnect}>Reconnect now</a>
            </div>
          </div>
        </div>
      )
    default:
      console.error("Unknown status at ConnectionBanner %o", props.status)
      return (
        <div className="ui icon floating message red">
          <i className="warning sign icon" style={{marginLeft: 25}}></i>
          <div className="content">
            <div className="header">
              Unknown connection status: {props.status}
            </div>
            <p>Snap! there was a connection problem. Trying to solve.</p>
            <div className="ui buttons">
              <a className="ui button yellow" onClick={props.reconnect}>Reconnect now</a>
            </div>
          </div>
        </div>
      )
  }
}

export default ConnectionBanner

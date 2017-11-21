import React from 'react'
import i18n from 'app/utils/i18n'

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
              {i18n("Reconnecting...")}
            </div>
            <p>{i18n("Snap! there was a connection problem. Trying to solve.")}</p>
            <div className="ui buttons">
              <a className="ui button disabled">{i18n("Reconnecting...")}</a>
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
              {props.extra ? (
                {i18n("Reconnecting in {seconds} seconds", {seconds: props.extra/1000})}
              ) : (
                {i18n("Reconnecting soon...")}
              )}
            </div>
            <p>{i18n("Snap! there was a connection problem. Trying to solve.")}</p>
            <div className="ui buttons">
              <a className="ui button yellow" onClick={props.reconnect}>{i18n("Reconnect now")}</a>
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
              {i18n("Too many errors reconnecting")}
            </div>
            <p>{i18n("I will not try to reconnect automatically. You can force reconnection if you will.")}</p>
            <div className="ui buttons">
              <a className="ui button yellow" onClick={props.reconnect}>{i18n("Reconnect now")}</a>
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
              {i18n("Unknown connection status: {status}", {status: props.status})}
            </div>
            <p>{i18n("Snap! there was a connection problem. Trying to solve.")}</p>
            <div className="ui buttons">
              <a className="ui button yellow" onClick={props.reconnect}>{i18n("Reconnect now")}</a>
            </div>
          </div>
        </div>
      )
  }
}

export default ConnectionBanner

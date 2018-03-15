import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import Loading from 'app/components/loading'
import Modal from 'app/components/modal'
import rpc from 'app/rpc'
import {colorize} from 'app/utils'
import {pretty_ago} from 'app/utils'
import {i18n} from 'app/utils/i18n'

class Notification extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      notification: undefined
    }
  }
  componentDidMount(){
    this.load_notification(this.props.params.id)
  }
  load_notification(id){
    if (id == undefined)
      return
    this.setState({notification: undefined})
    rpc.call("notifications.get", [id]).then( (n) => {
      this.setState({notification: n})
      if (n.tags.indexOf("unread")>=0 || n.tags.indexOf("new")>=0){
        const tags = n.tags.filter( (t) => (t!="unread" && t!="new") )
        rpc.call("notifications.update", {id: n.id, tags})
      }
    })
  }
  render(){
    if (!this.state.notification)
      return (
        <Loading>{i18n("Notification")}</Loading>
      )

    const n=this.state.notification

    return (
      <Modal className="wide">
        <div className="ui top secondary menu">
          <h3 className="ui header">{i18n("Notifications")}</h3>
          <div className="right menu">
            <a
              className={`item ${n.last_id ? "" : "disabled"}`}
              title={i18n("Last message")}
              onClick={() => this.load_notification(n.last_id)}
              ><i className="ui icon chevron left"/></a>
            <a
              className={`item ${n.next_id ? "" : "disabled"}`}
              title={i18n("Next message")}
              onClick={() => this.load_notification(n.next_id)}
              ><i className="ui icon chevron right"/></a>
          </div>
        </div>
        <div className="ui text container">
          <div className="ui meta" title={n.inserted_at}>{pretty_ago(n.inserted_at)}</div>
          <h1 className="ui header" style={{margin: 0}}>{n.subject}</h1>
          <div className="ui labels">
            {n.tags.map( (t) => (
              <span className={`ui tiny plain basic label ${colorize(t)}`}>{i18n(t)}</span>
            ))}
          </div>
          <div className="ui body">
            <MarkdownPreview value={n.body}/>
          </div>
        </div>
      </Modal>
    )
  }
}

export default Notification

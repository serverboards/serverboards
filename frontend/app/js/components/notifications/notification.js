import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import Loading from 'app/components/loading'
import Modal from 'app/components/modal'
import rpc from 'app/rpc'
import {label_color} from './index'

const Notification=React.createClass({
  getInitialState(){
    return {
      notification: undefined
    }
  },
  componentDidMount(){
    const id = Number( this.props.params.id )
    rpc.call("notifications.details", [id]).then( (n) => {
      this.setState({notification: n})
      if (n.tags.indexOf("unread")>=0){
        const tags = n.tags.filter( (t) => (t!="unread") )
        rpc.call("notifications.update", {id: n.id, tags})
      }
    })
  },
  render(){
    if (!this.state.notification)
      return (
        <Loading>Notification</Loading>
      )

    const n=this.state.notification
    return (
      <Modal>
        <h1 className="ui header">{n.subject}</h1>
        <div className="ui meta">{n.inserted_at.replace('T',' ')}</div>
        <div className="ui labels">
          {n.tags.map( (t) => (
            <span className={`ui label ${label_color(t)}`}>{t}</span>
          ))}
        </div>
        <div className="ui body">
          <MarkdownPreview value={n.body}/>
        </div>
      </Modal>
    )
  }
})

export default Notification

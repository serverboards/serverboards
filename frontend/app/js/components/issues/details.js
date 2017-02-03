import React from 'react'
import Modal from 'app/components/modal'
import Loading from 'app/components/loading'
import {MarkdownPreview} from 'react-marked-markdown'
import Flash from 'app/flash'
import {merge, colorize, pretty_ago} from 'app/utils'
import Avatar from 'app/components/avatar'

import Filters from './filters'

function tag_color(status){
  if (status=="open")
    return "yellow"
  if (status=="closed")
    return "green"
  return "grey"
}

const EVENT_DESC = {
  alias: {
    icon: "pin",
    text: "created a new alias",
    color: "blue"
  },
  unalias: {
    icon: "pin",
    text: "removed an alias",
    color: "orange"
  },
}

function CardHeader({event, label, icon, color, text}){
  return (
    <div className="ui header normal text regular">
      {icon ? (
        <span className="ui circular"><span className={color}><i className={`ui icon ${icon}`}/></span></span>
      ) : (
        <span className="ui circular image small"><Avatar email={(event.creator || {}).email}/></span>
      )}
      <b>{(event.creator || {name:"System"}).name} </b>
      {pretty_ago(event.inserted_at)}
      <span className="ui meta"> {label}{text ? ":" : null} </span> {text}
    </div>
  )
}

function IssueEventComment({event, connected}){
  if (typeof(event.data)!="string"){
    return (
      <div className={`ui red card ${ connected ? "connected" : ""}`}>
        <CardHeader event={event} label="commented"/>
        <div className="ui red text">Invalid event data: {JSON.stringify(event.data)}</div>
      </div>
    )
  }
  return (
    <div className={`ui card ${ connected ? "connected" : ""}`}>
      <CardHeader event={event} label="commented"/>
      <MarkdownPreview value={event.data}/>
    </div>
  )
}

function IssueEventChangeStatus({event}){
  return (
    <div className="ui status change">
      <CardHeader event={event} label="changed status"/>
      <span className={`ui label tag ${tag_color(event.data)}`}>{event.data}</span>
    </div>
  )
}

function IssueEventSetLabels({event}){
  return (
    <div className="ui card connected">
      <CardHeader event={event} label="added tags"/>
      <div style={{display:"flex", flexDirection:"row"}}>
        {event.data.map( (l) => (
          <span className={`ui text green`}>{l}&nbsp; </span>
        ))}
      </div>
    </div>
  )
}
function IssueEventUnsetLabels({event}){
  return (
    <div className="ui card connected">
      <CardHeader event={event} label="removed tag"/>
      <div style={{display:"flex", flexDirection:"row"}}>
        {event.data.map( (l) => (
          <span className={`ui text red`}>{l}</span>
        ))}
      </div>
    </div>
  )
}
function IssueEventMisc({event, desc}){
  return (
    <div className="ui card connected">
      <CardHeader event={event} icon={desc.icon} label={desc.text} text={event.data} color={desc.color}/>
    </div>
  )
}

function IssueEvent(props){
  if (props.event.type=="new_issue")
    return (
      <IssueEventComment event={merge(props.event, {data: props.event.data.description})} />
    )
  if (props.event.type=="comment")
    return (
      <IssueEventComment {...props}/>
    )
  if (props.event.type=="change_status")
    return (
      <IssueEventChangeStatus {...props}/>
    )
  if (props.event.type=="set_labels")
    return (
      <IssueEventSetLabels {...props}/>
    )
  if (props.event.type=="unset_labels")
    return (
      <IssueEventUnsetLabels {...props}/>
    )
  if (EVENT_DESC[props.event.type]){
    return <IssueEventMisc desc={EVENT_DESC[props.event.type]} event={props.event}/>
  }

  return (
    <div className="ui card">
      <CardHeader event={event}/>
    </div>
  )
}

const Details = React.createClass({
  handleAddComment(){
    const comment=this.refs.new_comment.value

    let addfuture
    if (this.refs.close_issue && this.refs.close_issue.checked)
      addfuture=this.props.handleAddCommentAndClose(comment)
    else if (this.refs.reopen_issue && this.refs.reopen_issue.checked)
      addfuture=this.props.handleAddCommentAndReopen(comment)
    else{
      addfuture=this.props.addComment(comment)
        .then( () => Flash.info("Added new comment") )
    }
    addfuture
      .then( () => { this.refs.new_comment.value="" })
  },
  handleFocusComment(){
    $("#issues > .content").scrollTop($("#issues > .content").height())
    $(this.refs.new_comment).focus()
  },
  render(){
    const {props} = this
    const issue = props.issue
    if (!issue)
      return (
        <Loading>Issue #{props.params.id}</Loading>
      )

    return (
      <Modal className="wide" id="issues">
        <div className="ui top secondary menu">
          <h3 className="ui header">Issues</h3>
          <div className="right menu">
            <a className="item" onClick={this.handleFocusComment}><i className="ui icon comment"/> Add comment</a>
          </div>
        </div>
        <div className="ui issue details">
          <div className="ui header">
            <div className="">
              <span className="ui circular image small" style={{marginLeft: -20}}><Avatar email={(issue.creator || {}).email}/></span>
              <h4 className="ui big header">{issue.title}</h4>
              <span className="ui meta big text"># {issue.id}</span>
            </div>
            <div className="ui text normal regular">
              <span className={`ui tag label ${tag_color(issue.status)} big`}>{issue.status}</span>
              <span><b>{(issue.creator || {name: "System"}).name}</b> created this issue on {issue.inserted_at}</span>
            </div>
          </div>
          <div className="ui divider"></div>
          <div className="ui container">
            <div className="details">
              {issue.events.map( (ev, i) =>  (
                <IssueEvent key={i} event={ev} issue={issue} connected={i!=0}/>
              ))}
            </div>
            <div className="filters">
              <Filters issue={issue} onRemoveLabel={this.props.onRemoveLabel} onAddLabel={this.props.onAddLabel}/>
            </div>
          </div>
          <div className="ui divider"></div>
          <div className="ui form container" style={{display:"flex", flexDirection:"column"}}>
            <div className="field">
              <label>New comment</label>
              <textarea ref="new_comment" placeholder="Write your comment here..."></textarea>
            </div>
            <div className="ui inline fields form" style={{marginBottom: 30}}>
              <div className="field">
                <button className="ui button yellow" onClick={this.handleAddComment}>Add comment</button>
              </div>
              <div className="field">
                {issue.status == "open" ? (
                  <div className="ui checkbox close">
                    <input type="checkbox" ref="close_issue" id="close_issue"/>
                    <label htmlFor="close_issue" style={{cursor:"pointer"}}> Close issue</label>
                  </div>
                ) : (
                  <div className="ui checkbox reopen">
                    <input type="checkbox" ref="reopen_issue" id="reopen_issue"/>
                    <label htmlFor="reopen_issue" style={{cursor:"pointer"}}> Reopen issue</label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default Details

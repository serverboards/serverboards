import React from 'react'
import Modal from 'app/components/modal'
import Loading from 'app/components/loading'
const default_avatar=require('../../../imgs/square-favicon.svg')
import {MarkdownPreview} from 'react-marked-markdown'
import Flash from 'app/flash'
import {merge} from 'app/utils'

import Filters from './filters'

function tag_color(status){
  if (status=="open")
    return "yellow"
  if (status=="closed")
    return "green"
  return "grey"
}

function IssueEventComment({event, connected}){
  return (
    <div className={`ui card ${ connected ? "connected" : ""}`}>
      <div className="ui header normal text regular">
        <span className="ui circular image small"><img src={default_avatar}/></span>
        <span><b>{(event.creator || {name:"System"}).name}</b> on {event.inserted_at}</span>
      </div>
      <MarkdownPreview value={event.data}/>
    </div>
  )
}

function IssueEventChangeStatus({event}){
  return (
    <span className={`ui label tag ${tag_color(event.data)}`}>{event.data}</span>
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

  return (
    <div className="ui message error">
      Unknown event type: {props.event.type}
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
              <span className="ui circular image small" style={{marginLeft: -20}}><img src={default_avatar}/></span>
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
              <span className="ui label tag yellow">Opened</span>
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

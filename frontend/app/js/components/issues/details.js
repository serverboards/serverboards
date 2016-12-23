import React from 'react'
import Modal from 'app/components/modal'
import Loading from 'app/components/loading'
import rpc from 'app/rpc'
const default_avatar=require('../../../imgs/square-favicon.svg')
import {MarkdownPreview} from 'react-marked-markdown'
import Flash from 'app/flash'
import {merge} from 'app/utils'

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

function Filters(props){
  return (
    <div>
      <div>
        <h4 className="ui header">Asignees</h4>
        <a><i className="ui add yellow"/></a>
      </div>
      <div>
        <h4 className="ui header">Labels</h4>
        <a><i className="ui add yellow"/></a>
      </div>
      <div>
        <h4 className="ui header">Participants</h4>
      </div>
      <div>
        <h4 className="ui header">Files</h4>
      </div>
    </div>
  )
}

const Details = React.createClass({
  getInitialState(){
    return {issue: undefined}
  },
  componentDidMount(){
    console.log(this.props)
    rpc.call("issues.get", [this.props.params.id]).then( (issue) => {
      this.setState({issue})
    })
  },
  addComment(){
    const comment=this.refs.new_comment.value
    const title=comment.split('\n')[0].slice(0,64)
    return rpc.call("issues.update", [Number(this.props.params.id), {type: "comment", title, data: comment}])
      .then( () => this.componentDidMount() )
      .then( () => { this.refs.new_comment.value="" })
  },
  handleAddComment(){
    if (this.refs.close_issue && this.refs.close_issue.checked)
      return this.handleAddCommentAndClose()
    if (this.refs.reopen_issue && this.refs.reopen_issue.checked)
      return this.handleAddCommentAndReopen()
    this.addComment()
      .then( () => Flash.info("Added new comment") )
  },
  handleAddCommentAndClose(){
    rpc.call("issues.update", [Number(this.props.params.id), {type: "change_status", data: "closed"}])
      .then( () =>  this.addComment())
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "closed"})})
      })
  },
  handleAddCommentAndReopen(){
    rpc.call("issues.update", [Number(this.props.params.id), {type: "change_status", data: "open"}])
      .then( () =>  this.addComment())
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "open"})})
      })
  },
  handleFocusComment(){
    $("#issues > .content").scrollTop($("#issues > .content").height())
    $(this.refs.new_comment).focus()
  },
  render(){
    const {state} = this
    const issue = state.issue
    if (!issue)
      return (
        <Loading>Issue #{this.props.params.id}</Loading>
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
              {/* <Filters issue={issue}/> */}
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

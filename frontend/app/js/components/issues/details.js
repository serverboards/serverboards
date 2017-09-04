import React from 'react'
import Modal from 'app/components/modal'
import {MarkdownPreview} from 'react-marked-markdown'
import Flash from 'app/flash'
import {merge, colorize, pretty_ago} from 'app/utils'
import Avatar from 'app/containers/avatar'
import {i18n, i18n_nop} from 'app/utils/i18n'

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
    text: i18n_nop("created a new alias"),
    color: "blue"
  },
  unalias: {
    icon: "pin",
    text: i18n_nop("removed an alias"),
    color: "orange"
  },
}

function CardHeader({event, label, icon, color, text}){
  return (
    <div className="ui header normal text regular">
      {icon ? (
        <span className="ui circular side rail"><span className={color}><i className={`ui icon ${icon}`}/></span></span>
      ) : (
        <span className="ui circular image small side rail"><Avatar email={(event.creator || {}).email}/></span>
      )}
      <b>{(event.creator || {name:i18n("System")}).name} </b>
      {pretty_ago(event.inserted_at)}
      <span className="ui meta"> {label}{text ? ":" : null} </span> {text}
    </div>
  )
}

function IssueEventComment({event, connected}){
  if (typeof(event.data)!="string"){
    return (
      <div className={`ui red card with side rail ${ connected ? "connected" : ""}`}>
        <CardHeader event={event} label={i18n("commented")}/>
        <div className="ui red text">{i18n("Invalid event data: {data}", {data: JSON.stringify(event.data)})}</div>
      </div>
    )
  }
  return (
    <div className={`ui card with side rail ${ connected ? "connected" : ""}`}>
      <CardHeader event={event} label={i18n("commented")}/>
      <MarkdownPreview value={event.data}/>
    </div>
  )
}

function IssueEventChangeStatus({event}){
  return (
    <div className="ui invisible card with side rail">
      <CardHeader event={event} label={i18n("changed status")}/>
      <div>
        <span className={`ui label tag ${tag_color(event.data)}`}>{event.data}</span>
      </div>
    </div>
  )
}

function IssueEventSetLabels({event}){
  return (
    <div className="ui card with side rail connected">
      <CardHeader event={event} label={i18n("added tags")}/>
      <div style={{display:"flex", flexDirection:"row"}}>
        {event.data.map( (l) => (
          <span key={l} className={`ui text green`}>{l}&nbsp; </span>
        ))}
      </div>
    </div>
  )
}
function IssueEventUnsetLabels({event}){
  return (
    <div className="ui card connected">
      <CardHeader event={event} label={i18n("removed tag")}/>
      <div style={{display:"flex", flexDirection:"row"}}>
        {event.data.map( (l) => (
          <span key={l} className={`ui text red`}>{l}</span>
        ))}
      </div>
    </div>
  )
}
function IssueEventMisc({event, desc}){
  return (
    <div className="ui card connected">
      <CardHeader event={event} icon={desc.icon} label={i18n(desc.text)} text={i18n(event.data)} color={desc.color}/>
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

function status_color(status){
  if (status=="open")
    return "red"
  else
    return "green"
}

class Details extends React.Component{
  handleAddComment(){
    const comment=this.refs.new_comment.value

    let addfuture
    if (this.refs.close_issue && this.refs.close_issue.checked)
      addfuture=this.props.onAddCommentAndClose(comment)
    else if (this.refs.reopen_issue && this.refs.reopen_issue.checked)
      addfuture=this.props.onAddCommentAndReopen(comment)
    else{
      addfuture=this.props.onAddComment(comment)
        .then( () => Flash.info(i18n("Added new comment")) )
    }
    addfuture
      .then( () => { this.refs.new_comment.value="" })
  }
  handleFocusComment(){
    $("#issues > .content").scrollTop($("#issues > .content").height())
    $(this.refs.new_comment).focus()
  }
  componentDidMount(){
    let self = this
    $(this.refs.reopen).checkbox({
      onChecked(){
        self.props.onOpenIssue()
      },
      onUnchecked(){
        self.props.onCloseIssue()
      }
    })
  }
  render(){
    const {props} = this
    const issue = props.issue
    return (
      <div id="issues" className="ui issue details expands">
        <div className={`ui attached colored top menu ${status_color(issue.status)} background`}>
          <h3 className="ui header centered stretch white text">{issue.status == "open" ? i18n("Issue open") : i18n("Issue closed")}</h3>
          <div className="ui right checkbox toggle" ref="reopen">
            <label style={{color:"white"}}>{issue.status == "open" ? i18n("Close") : i18n("Re-open") }</label>
            <input type="checkbox" defaultChecked={issue.status=="open"}/>
          </div>
        </div>

        <div className="ui padding">
          <h4 className="ui header">
            <span className="ui meta big text"># {issue.id}</span>
            {issue.labels.map( l => (
              <span key={l.name} className={`ui text ${l.color}`} style={{paddingLeft: 5}}> {l.name} </span>
            ))}
          </h4>
          <h3 className="ui big header">
            <span className="ui content">
              {issue.title}
            </span>
          </h3>

          <div className="">
            <span className="ui circular image small"><Avatar email={(issue.creator || {}).email}/></span>
            &nbsp;
            <div style={{display: "inline-block", paddingLeft: 10}}>
              <MarkdownPreview
                value={i18n("**{name}** created this issue {date}",
                        {name: (issue.creator || {}).name || i18n("System"),
                        date: pretty_ago(issue.inserted_at)})
                      }
                />
            </div>
          </div>
        </div>
        <div className="ui divider"></div>
        <div className="ui scroll">
          <div className="ui container with padding">
            <div className="details">
              {issue.events.map( (ev, i) =>  (
                <IssueEvent key={i} event={ev} issue={issue} connected={i!=0}/>
              ))}
            </div>
          </div>
          <div className="ui divider"></div>
          <div className="ui padding">
            <div className="ui form container" style={{display:"flex", flexDirection:"column"}}>
              <div className="field">
                <label>{i18n("New comment")}</label>
                <textarea ref="new_comment" placeholder={i18n("Write your comment here...")}></textarea>
              </div>
              <div className="ui inline fields form" style={{marginBottom: 30}}>
                <div className="field">
                  <button className="ui button yellow" onClick={() => this.handleAddComment()}>{i18n("Add comment")}</button>
                </div>
                <div className="field">
                  {issue.status == "open" ? (
                    <div className="ui checkbox close">
                      <input type="checkbox" ref="close_issue" id="close_issue"/>
                      <label htmlFor="close_issue" style={{cursor:"pointer"}}> {i18n("Close issue")}</label>
                    </div>
                  ) : (
                    <div className="ui checkbox reopen">
                      <input type="checkbox" ref="reopen_issue" id="reopen_issue"/>
                      <label htmlFor="reopen_issue" style={{cursor:"pointer"}}> {i18n("Reopen issue")}</label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Details

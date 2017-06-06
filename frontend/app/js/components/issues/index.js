import React from 'react'
import Restricted from 'app/restricted'
import {goto} from 'app/utils/store'
import {pretty_ago} from 'app/utils'
import moment from 'moment'
import Loading from 'app/components/loading'
import Filters from 'app/containers/issues/index_filters'
import Avatar from 'app/containers/avatar'
import i18n from 'app/utils/i18n'
import Empty from './empty'

import 'sass/issues.sass'

const noissues = require('app/../imgs/018-img-no-issues.svg')

function tag_color(status){
  if (status=="open")
    return "yellow"
  if (status=="closed")
    return "green"
  return "grey"
}


function IssueCard(props){
  return (
    <a className="ui card" onClick={() => goto(`/issues/${props.id}`)}>
      <div className="ui oneline text">{props.title}</div>
      <div>
        <span>#{props.id}</span>
        <b className={`ui text ${tag_color(props.status)}`}> {props.status} </b>
        by {(props.creator || {name: "System"}).name}
        <span>
          { props.labels.length == 0 ? null : [" | ", props.labels.map( (t) => (
            <b className={`ui text ${t.color}`}> {t.name} </b>
          ))] }
        </span>
      </div>
    </a>
  )
}

function IssueRow(props){
  return (
    <div className="item">
      <span className="time">{moment(props.date).format("h:mm a")}</span>
      <span className="ui circular image small"><Avatar email={(props.creator || {}).email}/></span>
      <hr/>
      <IssueCard {...props}/>
      <hr className="vertical"/>
    </div>
  )
}

function IssueDay(props){
  return (
    <div className="day">
      <h3 data-tooltip={props.label}>{pretty_ago(props.label,undefined,"day")}</h3>
      <div className="data">
        {props.issues.map( (i) => (
          <IssueRow key={i.id} {...i}/>
        ))}
      </div>
    </div>
  )
}

function group_by_day(issues){
  let days=[]
  let last_date_issues=[]
  let last_date=undefined
  for(let i of issues){
    const cdate=i.date.slice(0,10)
    if (cdate != last_date){
      last_date=cdate
      last_date_issues=[]
      days.push([last_date, last_date_issues])
    }
    last_date_issues.push(i)
  }
  return days
}

const Issues= React.createClass({
  componentDidMount(){
    if (this.props.setSectionMenu)
      this.props.setSectionMenu(this.render_menu, this.props)
  },
  componentWillReceiveProps(nprops){
    if (this.props.setSectionMenuProps)
      this.props.setSectionMenuProps(nprops)
  },
  render_menu(props){
    return (
      <div className="menu">
        <div className="ui attached tabular menu" style={{paddingLeft: 0, marginLeft: "4em"}}>
          <a
            className={`item ${ props.filter.indexOf("status:open")>=0 ? "active" : ""}`}
            onClick={() => props.setFilter("status:open")}>
              {i18n("Open")}&nbsp;<span className="ui meta"> ({props.open_count})</span>
          </a>
          <a
            className={`item ${ props.filter.indexOf("status:closed")>=0 ? "active" : ""}`}
            onClick={() => props.setFilter("status:closed")}>
              {i18n("Closed")}&nbsp;<span className="ui meta"> ({props.closed_count})</span>
          </a>
          <a
            className={`item ${ props.filter.indexOf("status:*")>=0 ? "active" : ""}`}
            onClick={() => props.setFilter("status:*")}>
              {i18n("All")}&nbsp;<span className="ui meta">({props.all_count})</span>
          </a>
        </div>
      </div>
    )
  },
  render(){
    const props = this.props
    if (props.loading)
      return (
        <Loading>Issues</Loading>
      )
    const issues_by_day = group_by_day(props.issues_show)
    return (
      <div className="ui split area vertical" style={{flexDirection:"column"}} id="issues">
        {this.props.setSectionMenu ? null :  (
          <div className="ui top secondary menu" style={{paddingBottom: 0, zIndex: 9}}>
            <h3 className="ui header">{i18n("Issues")}</h3>
            {this.render_menu()}
          </div>
        )}
        <div className="ui split horizontal area expand with scroll" style={{padding:50}}>
          {(props.issues.length == 0) ? (
            <Empty/>
          ) : ( issues_by_day.length == 0 ) ? (
            <div className="ui centered text">
              <img src={noissues} alt=""/>
              <h2>{i18n("There are no issues to show.")}</h2>
              <div className="ui grey text">{i18n("Try different filters to look beyond...")}</div>
            </div>
          ) : (
            <div className="issues">
              {issues_by_day.map( ([date, issues]) => (
                <IssueDay key={date} label={date} issues={issues}/>
              ))}
            </div>
          )}
          <div className="filters">
            <Filters setFilter={props.setFilter} labels={props.labels} filter={props.filter} project={props.project}/>
          </div>
        </div>
        <Restricted perm="issues.create">
          <a onClick={() => goto("/issues/add",{project:props.project})} className="ui massive button _add icon floating yellow">
            <i className="add icon"></i>
          </a>
        </Restricted>
      </div>
    )
  }
})

export default Issues

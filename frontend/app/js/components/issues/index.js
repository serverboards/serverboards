import React from 'react'
import Restricted from 'app/restricted'
import {goto} from 'app/utils/store'
import {pretty_ago} from 'app/utils'
import moment from 'moment'
import Loading from 'app/components/loading'

import 'sass/issues.sass'

const default_avatar=require('../../../imgs/square-favicon.svg')

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
      <span className="ui circular image small"><img src={default_avatar}/></span>
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

const IssueTag = React.createClass({
  componentDidMount(){
    $(this.refs.el).checkbox({
      onChecked: this.props.onEnable,
      onUnchecked: this.props.onDisable
    })
  },
  render(){
    const props = this.props
    return (
      <div className="label">
        <span className={`ui tag label mini ${props.color}`}> </span>
        <span className="name">{props.value}</span>
        <div className="inline field">
          <div ref="el" className="ui toggle checkbox">
            <input type="checkbox" className="hidden"/>
            <label> </label>
          </div>
        </div>
      </div>
    )
  }
})

const Filters = React.createClass({
  componentDidMount(){
    $(this.refs.el).find('.search')
    $(this.refs.el).find('.dropdown').dropdown()
  },
  handleFilterChange(ev){
    const value=ev.target.value
    console.log("New filter: %o", value)
    this.props.setFilter(value)
  },
  render(){
    const props = this.props
    return (
      <div className="" ref="el">
        <div className="ui search">
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder="Search..." value={props.filter}/>
            <i className="search icon"></i>
          </div>
          <div className="results"></div>
        </div>
        <div className="ui form">
          {/*
          <div className="field" style={{marginBottom: 40}}>
            <select className="ui dropdown">
              <option value="order:-open">Show recents first</option>
              <option value="order:+open">Show older first</option>
              <option value="order:-modified">Show recentyly modified first</option>
              <option value="order:+modified">Show more time not modified first</option>
            </select>
          </div>
          */}
          <div className="field">
            <select className="ui dropdown" onChange={this.handleFilterChange} placeholder="Preset filters">
              <option value="">Preset filters</option>
              <option value="status:open">Show open</option>
              <option value="status:closed">Show closed</option>
            </select>
          </div>
          <div className="ui labels">
            <h4 className="ui header">Filter by labels</h4>
            <div className="ui divider"/>
            {props.labels.map( (t) => (
              <IssueTag key={t.name} value={t.name} color={t.color}
                onEnable={() => props.setFilter(`+tag:${t.name}`)}
                onDisable={() => props.setFilter(`-tag:${t.name}`)}
              />
            ))}
            <div className="ui divider"/>
          </div>
        </div>
      </div>
    )
  }
})

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

function Issues(props){
  if (props.loading)
    return (
      <Loading>Issues</Loading>
    )
  const issues_by_day = group_by_day(props.show_issues)
  return (
    <div className="ui central area white background" style={{flexDirection:"column"}} id="issues">
      <div className="ui top secondary menu" style={{paddingBottom: 0}}>
        <h3 className="ui header">Issues</h3>
        <div className="ui tabs secondary pointing menu" style={{paddingLeft: 0, marginLeft: "4em"}}>
          <a
            className={`item ${ props.filter.indexOf("status:open")>=0 ? "active" : ""}`}
            onClick={() => props.setFilter("status:open")}>
              Open&nbsp;<span className="ui meta"> ({props.open_count})</span>
          </a>
          <a
            className={`item ${ props.filter.indexOf("status:closed")>=0 ? "active" : ""}`}
            onClick={() => props.setFilter("status:closed")}>
              Closed&nbsp;<span className="ui meta"> ({props.closed_count})</span>
          </a>
          <a
            className={`item ${ props.filter.indexOf("status:*")>=0 ? "active" : ""}`}
            onClick={() => props.setFilter("status:*")}>
              All&nbsp;<span className="ui meta">({props.all_count})</span>
          </a>
        </div>
      </div>
      <div className="ui container">
        <div className="issues">
          {issues_by_day.map( ([date, issues]) => (
            <IssueDay key={date} label={date} issues={issues}/>
          ))}
        </div>
        <div className="filters">
          <Filters setFilter={props.setFilter} labels={props.labels} filter={props.filter}/>
        </div>
      </div>
      <Restricted perm="issues.add">
        <a onClick={() => goto("/issues/add")} className="ui massive button _add icon floating yellow">
          <i className="add icon"></i>
        </a>
      </Restricted>
    </div>
  )
}

export default Issues
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
import Tip from 'app/components/tip'
import AddIssue from 'app/containers/issues/add'
import IssueDetails from 'app/containers/issues/details'
import {SectionMenu} from 'app/components'

import 'sass/issues.sass'

const noissues = require('app/../imgs/018-img-no-issues.svg')

function tag_color(status){
  if (status=="open")
    return "yellow"
  if (status=="closed")
    return "green"
  return "grey"
}

const img1 = require('imgs/026-illustration-nocontent.svg')

function IssuesMenu(props){
  if (!props) props={}
  console.log("Issue menu", props)
  const filter = props.filter || []
  return (
    <div className="menu">
      <div className="ui attached tabular menu" style={{paddingLeft: 0, marginLeft: "4em"}}>
        <a
          className={`item ${ filter.indexOf("status:open")>=0 ? "active" : ""}`}
          onClick={() => props.updateFilter("status:open")}>
            {i18n("Open")}&nbsp;<span className="ui meta"> ({props.open_count})</span>
        </a>
        <a
          className={`item ${ filter.indexOf("status:closed")>=0 ? "active" : ""}`}
          onClick={() => props.updateFilter("status:closed")}>
            {i18n("Closed")}&nbsp;<span className="ui meta"> ({props.closed_count})</span>
        </a>
        <a
          className={`item ${ filter.indexOf("status:closed")<0 && filter.indexOf("status:open")<0 ? "active" : ""}`}
          onClick={() => props.updateFilter("-status:")}>
            {i18n("All")}&nbsp;<span className="ui meta">({props.all_count})</span>
        </a>
      </div>
      <div className="item stretch"/>
      <div className="item">
        <button className="ui button teal" onClick={() => props.setState({selected: "add"})}>
          {i18n("Add issue")}
        </button>
      </div>
    </div>
  )
}

function EmptyFilter(props){
  return (
    <div className="ui fill centered">
      <img src={img1} style={{height:"50%", width:"100%"}}/>
      <h2 className="ui header" style={{margin: 0}}>{i18n("There are no issues to show.")}</h2>
      <h3 className="ui grey text header" style={{marginTop: 0}}>
        {i18n("Try diferent filters to look beyond, or create a new issue.")}
      </h3>
    </div>
  )
}

function IssueCard(props){
  return (
    <a className={`ui card ${ props.id == props.selected ? "selected" : ""}`} onClick={() => props.onSelect(props.id)}>
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
      <span className="time">{moment.utc(props.date).local().format("h:mm a")}</span>
      <span className="ui circular image small"><Avatar email={(props.creator || {}).email}/></span>
      <hr/>
      <IssueCard {...props} onSelect={props.onSelect}/>
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
          <IssueRow key={i.id} {...i} selected={props.selected} onSelect={props.onSelect}/>
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

class Issues extends React.Component{
  constructor(props){
    super(props)

    this.state={
      selected: undefined
    }
  }
  componentDidMount(){
    if (this.props.params && this.props.params.id)
      this.setState({selected: this.props.params.id})
  }
  componentWillReceiveProps(nprops){
    if (nprops.params && nprops.params.id != this.props.params.id){
      this.setState({selected: nprops.params.id})
    }
  }
  get_current_section(selected){
    if (!selected)
      return (
        <div className="ui scroll">
          <Empty/>
        </div>
      )
    if (selected=='add')
      return (
        <AddIssue />
      )
    return (
      <IssueDetails key={selected} issue_id={selected} labels={this.props.labels}/>
    )
  }
  handleSelect(issue){
    this.setState({selected: issue})
  }
  render(){
    const props = this.props
    if (props.loading)
      return (
        <Loading>Issues</Loading>
      )
    const issues_by_day = group_by_day(props.issues_show)
    const {show_filter_options} = this.state

    const right_side = this.get_current_section(this.state.selected)

    return (
      <div className="ui split area vertical" style={{flexDirection:"column", height: "100%"}} id="issues">
        <SectionMenu menu={IssuesMenu} {...props} setState={this.setState.bind(this)}/>
        <div className="ui expand two column grid grey background" style={{margin:0, flexGrow: 1, margin: 0}}>
          <div className="ui column">
            <div className="ui round pane white background">
              <div className="ui attached top form">
                <div className="ui input seamless white">
                  <i className="icon search"/>
                  <input type="text"
                    onChange={(ev) => props.setFilter(ev.target.value)}
                    placeholder={i18n("Filter...")}
                    value={props.filter}
                    style={{maxWidth: "calc( 100% - 52px )"}}
                    />
                </div>
                <div className="ui floating right menu">
                  <a
                      className={`ui item ${show_filter_options ? "active" : null}`}
                      onClick={() => this.setState({show_filter_options: !show_filter_options})}
                      >
                    <i className="options icon"/>
                    <span className="ui small text">{i18n("Filters")}</span>
                  </a>
                </div>
              </div>
              {show_filter_options && (
                <div className="ui shadow" style={{marginBottom: 3}}>
                  <div className="ui secondary menu" style={{margin: 0}}>
                    <a onClick={() => {console.log("close"); this.setState({show_filter_options: false})}} className="right item">
                      <i className="black close icon"/>
                    </a>
                  </div>
                  <div className="ui form with padding" style={{paddingTop: 0}}>
                    <Filters
                      filter={props.filter}
                      labels={props.labels}
                      setFilter={props.setFilter}
                      updateFilter={props.updateFilter}
                      />
                  </div>
                </div>
              )}
              <div className="ui scroll extend with padding">
                {(props.issues.length == 0) ? (
                  <EmptyFilter/>
                ) : ( issues_by_day.length == 0 ) ? (
                  <div className="ui centered text">
                    <img src={noissues} alt=""/>
                    <h2>{i18n("There are no issues to show.")}</h2>
                    <div className="ui grey text">{i18n("Try different filters to look beyond...")}</div>
                  </div>
                ) : (
                  <div className="issues">
                    {issues_by_day.map( ([date, issues]) => (
                      <IssueDay
                        key={date}
                        label={date}
                        issues={issues}
                        selected={this.state.selected}
                        onSelect={this.handleSelect.bind(this)}
                        />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="ui column expand">
            <div className="ui round pane white background">
              {right_side}
            </div>
          </div>

          {/*
          <div className="filters">
            <Filters setFilter={props.setFilter} labels={props.labels} filter={props.filter} project={props.project}/>
          </div>
          */}
        </div>
      </div>
    )
  }
}

export default Issues

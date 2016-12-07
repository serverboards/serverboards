import React from 'react'
import Restricted from 'app/restricted'
import {goto} from 'app/utils/store'

import 'sass/issues.sass'

const default_avatar=require('../../../imgs/square-favicon.svg')

function IssueCard(props){
  return (
    <a className="ui card" onClick={() => goto(`/issues/${props.id}`)}>
      <div className="ui oneline text">Wrong data_ready_len value being passed to websocket callback causing segfault, Wrong data_ready_len value being passed to websocket callback causing segfault</div>
      <div>
        <span>#1</span>
        <b className="ui text yellow"> OPEN </b>
        by
        Admin
        |
        <span>
          <b className="ui text blue"> TAG 1 </b>
          <b className="ui text purple"> TAG 2 </b>
        </span>
      </div>
    </a>
  )
}

function IssueRow(props){
  return (
    <div className="item">
      <span className="time">9:32 am</span>
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
      <h3>{props.label}</h3>
      <div className="data">
        <IssueRow id="1"/>
        <IssueRow id="2"/>
        <IssueRow id="3"/>
      </div>
    </div>
  )
}

const IssueTag = React.createClass({
  componentDidMount(){
    $(this.refs.el).checkbox()
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
    $(this.refs.el).find('.search').search()
    $(this.refs.el).find('.dropdown').dropdown()
  },
  render(){
    const props = this.props
    return (
      <div className="" ref="el">
        <div className="ui search">
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder="Search..."/>
            <i className="search icon"></i>
          </div>
          <div className="results"></div>
        </div>
        <div className="ui form">
          <div className="field" style={{marginBottom: 40}}>
            <select className="ui dropdown">
              <option value="order:-open">Show recents first</option>
              <option value="order:+open">Show older first</option>
              <option value="order:-modified">Show recentyly modified first</option>
              <option value="order:+modified">Show more time not modified first</option>
            </select>
          </div>
          <div className="field">
            <select className="ui dropdown">
              <option value="status:open">Show open</option>
              <option value="status:closed">Show closed</option>
              <option value="assigned:null">Show not assigned</option>
            </select>
          </div>
          <div className="ui labels">
            <h4 className="ui header">Filter by tags</h4>
            <div className="ui divider"/>
            <IssueTag value="Tag 1" color="red"/>
            <IssueTag value="Tag 2" color="blue"/>
            <IssueTag value="Tag 3" color="orange"/>
            <IssueTag value="Tag 4" color="teal"/>
            <div className="ui divider"/>
          </div>
        </div>
      </div>
    )
  }
})

const Issues = React.createClass({
  getInitialState(){
    return {
      open_count: 0,
      closed_count: 0,
      all_count: 0
    }
  },
  render(){
    const {props, state} = this
    return (
      <div className="ui central area white background" style={{flexDirection:"column"}} id="issues">
        <div className="ui top secondary menu">
          <h3 className="ui header">Issues</h3>
          <div className="ui tabs secondary pointing menu">
            <a className="item">Open <span className="ui meta">({state.open_count})</span></a>
            <a className="item">Closed <span className="ui meta">({state.closed_count})</span></a>
            <a className="item">All <span className="ui meta">({state.all_count})</span></a>
          </div>
        </div>
        <div className="ui container">
          <div className="issues">
            <IssueDay label="Today"/>
            <IssueDay label="Yesterday"/>
            <IssueDay label="01 Dec"/>
          </div>
          <div className="filters">
            <Filters/>
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
})

export default Issues

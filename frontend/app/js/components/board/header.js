import React from 'react'
import DateRange from 'app/containers/board/daterange'
import { request_fullscreen } from 'app/utils/fullscreen'
import i18n from 'app/utils/i18n'
import moment from 'moment'
import {set_modal} from 'app/utils/store'
import utils from 'app/utils'

class HeaderMenu extends React.Component{
  constructor(props){
    super(props)
    this.state={}
  }
  componentDidMount(){
    // console.log("Set dashboard header")
    $("#maximize").on( 'click', () => {
      request_fullscreen($('#dashboard')[0])
    })
    $(this.refs.filter_selector).popup({
      popup: this.refs.filters,
      on: 'click'
    })
    $(this.refs.rt).checkbox({
      onChecked: () => this.props.setRealtime(true),
      onUnchecked: () => this.props.setRealtime(false),
    })
    if (this.props.realtime)
      $(this.refs.rt).checkbox('check')
    else
      $(this.refs.rt).checkbox('uncheck')
  }
  setFilter(filter){
    $(this.refs.filter_selector).popup('hide')

    const end = moment()
    const start = moment(end).subtract(filter, 'seconds')

    this.props.onDateRangeChange(start, end, true)
    // console.log("%o to %o", start, end)
  }
  handleDashboardChange(ds){
    this.props.onDashboardChange(ds)
  }
  handleAddDashboard(){
    set_modal('dashboard.create',{project: this.props.project})
  }
  render(){
    const props = this.props
    const filter = this.props.filter
    const current = props.dashboard_current || {}

    const filter_time = utils.pretty_time(filter*1000)

    return (
      <div className="menu">
        <div style={{width: 30}}/>
        <div className="ui attached tabular menu">
          {props.dashboard_list.map( d => (
            <a key={d.uuid} className={`item ${d.uuid == current.uuid ? "active" : ""}`} onClick={() => this.handleDashboardChange(d.uuid)}>
              {d.name}
            </a>
          ))}
          <div className="ui item separator"/>
          <a className="item" onClick={this.handleAddDashboard.bind(this)} id="add_dashboard">
            <i className="ui icon add teal"/>
          </a>
        </div>
        <div className="ui item stretch"/>

        <div className="ui item separator"/>
        <a className="item" ref="filter_selector">
          <i className="ui icon filter"/>
          <div style={{display: "inline-block"}}>
            <div className="ui small text">{props.realtime ? "RT" : null}</div>
            <div className="ui small text">{filter_time ? filter_time : null}</div>
          </div>
        </a>
        <div className="ui popup two column grid" style={{minWidth: 660}} ref="filters">
          <div className="column">
            <a className={`item ${ filter == 300 ? "active" : ""}`} onClick={() => this.setFilter(300)}>{i18n("5 minutes")}</a>
            <a className={`item ${ filter == 60*60*2 ? "active" : ""}`} onClick={() => this.setFilter(60*60*2)}>{i18n("2 hours")}</a>
            <a className={`item ${ filter == 60*60*24 ? "active" : ""}`} onClick={() => this.setFilter(60*60*24)}>{i18n("24 hours")}</a>
            <a className={`item ${ filter == 60*60*24*7 ? "active" : ""}`} onClick={() => this.setFilter(60*60*24*7)}>{i18n("1 week")}</a>
            <a className={`item ${ filter == 60*60*24*30 ? "active" : ""}`} onClick={() => this.setFilter(60*60*24*30)}>{i18n("30 days")}</a>
            <a className={`item ${ filter == 60*60*24*90 ? "active" : ""}`} onClick={() => this.setFilter(60*60*24*90)}>{i18n("3 months")}</a>
            <a className={`item ${ filter == 60*60*24*182 ? "active" : ""}`} onClick={() => this.setFilter(60*60*24*182)}>{i18n("6 months")}</a>
            <a className={`item ${ filter == 60*60*24*365 ? "active" : ""}`} onClick={() => this.setFilter(60*60*24*365)}>{i18n("1 year")}</a>

          </div>
          <div className="column">
            <div className="item">
              <div className="ui toggle checkbox" ref="rt">
                <input type="checkbox" name="realtime_update"/>
                <label>{i18n("Realtime updates")}</label>
              </div>
            </div>
            <hr className="ui divider"></hr>

            <DateRange/>
          </div>
        </div>
        <div className="ui item separator"/>
        <a className="item" onClick={() => set_modal("dashboard.settings", {dashboard: current})}>
          <i className="icon settings"/>
        </a>
        <div className="ui item separator"/>
        <a className="item" id="maximize">
          <i className="ui icon expand arrows alternate"/>
        </a>
      </div>
    )
  }
}

export default HeaderMenu

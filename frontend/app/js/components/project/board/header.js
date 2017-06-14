import React from 'react'
import DateRange from 'app/containers/project/board/daterange'
import { request_fullscreen } from 'app/utils/fullscreen'
import i18n from 'app/utils/i18n'
import moment from 'moment'

const HeaderMenu = React.createClass({
  componentDidMount(){
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
  },
  setFilter(seconds){
    $(this.refs.filter_selector).popup('hide')

    const end = moment()
    const start = moment(end).subtract(seconds, 'seconds')

    this.props.onDateRangeChange(start, end)
  },
  render(){
    return (
      <div className="menu">
        <div style={{width: 30}}/>
        <div className="ui attached tabular menu">
          <a className="active item">
            Monitoring
          </a>
          {/*
          <a className="item">
            Tools
          </a>
          <div className="ui item separator"/>
          <a className="item">
            <i className="ui icon add teal"/>
          </a>
          */}
        </div>
        <div className="ui item stretch"/>
        <div className="ui item separator"/>
        <a className="item" ref="filter_selector">
          <i className="ui icon filter"/>
        </a>
        <div className="ui popup" ref="filters">
          <div className="item">
            <div className="ui toggle checkbox" ref="rt">
              <input type="checkbox" name="realtime_update"/>
              <label>{i18n("Realtime updates")}</label>
            </div>
          </div>

          <hr className="ui divider"></hr>

          <a className="item" onClick={() => this.setFilter(300)}>{i18n("5 minutes")}</a>
          <a className="item" onClick={() => this.setFilter(60*60*2)}>{i18n("2 hours")}</a>
          <a className="item" onClick={() => this.setFilter(60*60*24)}>{i18n("24 hours")}</a>
          <a className="item" onClick={() => this.setFilter(60*60*24*7)}>{i18n("1 week")}</a>
          <a className="item" onClick={() => this.setFilter(60*60*24*30)}>{i18n("30 days")}</a>

          <hr className="ui divider"></hr>

          <DateRange/>
        </div>
        <div className="ui item separator"/>
        <a className="item" id="maximize">
          <i className="ui icon maximize"/>
        </a>
      </div>
    )
  }
})
export default HeaderMenu

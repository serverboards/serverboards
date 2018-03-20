import React from 'react'
import Calendar from 'rc-calendar';
import moment from 'moment'
import {pretty_ago} from 'app/utils'
import {i18n, i18n_c} from 'app/utils/i18n'
import PropTypes from 'prop-types'

require("sass/calendar.sass")
const DATE_FORMAT="YYYY-MM-DD hh:mm"

class TimePicker extends React.Component{
  componentDidMount(){
    let self=this
    $(this.refs.h).dropdown({
      onChange: self.handleChangeHour
    })
    $(this.refs.m).dropdown({
      onChange: self.handleChangeMinute
    })
  }
  handleChangeMinute(v){
    let val=this.props.value.minutes(v)
    this.props.onSelect(val)
  }
  handleChangeHour(v){
    let val=this.props.value.hours(v)
    this.props.onSelect(val)
  }
  range(max){
    var hh=[]
    for (var i=0;i<max;i++){
      hh.push( (""+"0"+i).slice(-2) )
    }
    return hh
  }
  render(){
    const props=this.props
    const value=props.value
    return (
      <div className="ui form time" style={{display: "flex"}}>
        <select ref="h" className="ui dropdown" defaultValue={value.format("H")}>
          {this.range(24).map( (h) =>
            <option key={h} value={h}>{h}</option>
          )}
        </select>
        <div style={{width: 10}}/>
        <select ref="m" className="ui dropdown" defaultValue={value.format("m")}>
          {this.range(60).map( (m) =>
            <option key={m} value={m}>{m}</option>
          )}
        </select>
      </div>
    )
  }
}

TimePicker.propsTypes = {
  value: PropTypes.object.isRequired
}


class DatetimePicker extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      now: moment(),
      value: this.props.value
    }
  }
  isDateDisabled(date){
    if (date)
      return date.diff(this.state.now) > (24*60*60);
  }
  handleDateSelect(value){
    this.setState({value})
  }
  handleOk(){
    this.props.onSelect(this.state.value)
    this.props.onClose()
  }
  setToday(){
    this.props.onSelect(moment())
    this.props.onClose()
  }
  render(){
    const props=this.props
    return (
      <div ref="calendar" className="ui calendar">
        <label>Date:</label>
        <Calendar
          value={this.state.value}
          onSelect={this.handleDateSelect.bind(this)}
          onChange={this.handleDateSelect.bind(this)}
          disabledDate={this.isDateDisabled}
          showToday={false}
          />
        <label>Time:</label>
        <TimePicker
          value={this.state.value}
          onSelect={this.handleDateSelect.bind(this)}
          />
        <div className="ui right" style={{marginTop: 10}}>
          <button
            className="ui button"
            onClick={this.setToday.bind(this)}
            >{i18n("Set now")}</button>
          <button
            className="ui button yellow"
            onClick={this.handleOk.bind(this)}
            >{i18n("Set selected")}</button>
        </div>
      </div>
    )
  }
}

DatetimePicker.propTypes = {
  value: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}


class DatetimeItem extends React.Component{
  render(){
    const props=this.props
    const pretty=pretty_ago(props.value, props.now, 60 * 1000)

    return (
      <div title={props.value.format("YYYY-MM-DD HH:mm")}>
        <a className={`item ui vertical split area ${this.props.className || ""}`} onClick={props.onClick}>
          <label style={{alignSelf: "flex-start", fontWeight: "bold", paddingBottom: 10}}>{props.label}</label>
          <div className="value">
            {pretty}<br/>
            <span className="meta" style={{color: "#bbb", fontWeight: "normal"}}>
              {i18n.i18n_c("date range", "at")} {props.value.format("HH:mm")}
            </span>
            </div>
        </a>
      </div>
    )
  }
}

DatetimeItem.propTypes = {
  value: PropTypes.object.isRequired,
  now: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
}


export class DateRange extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      value: null,
      onSelect: null,
      selected: null
    }
  }
  handleOpenCalendar(selected, value, onSelect){
    const handleSelect=(value) => {
      this.setState({selected:null, value: null, onSelect: null})
      onSelect(value)
    }
    this.setState({selected, value, onSelect: handleSelect})
  }
  render(){
    const props = this.props
    const state = this.state
    return (
      <div className="menu" id="daterange">
        <div className="ui horizontal split area" style={{justifyContent: "space-around", width: 280}}>
          <DatetimeItem
            label={i18n_c("date range","From")}
            value={props.start}
            now={props.now}
            onClick={() => this.handleOpenCalendar( 'start', props.start, props.onStartChange )}
            className={state.selected == 'start' ? "active" : null}
            />
          <DatetimeItem
            label={i18n_c("date range", "to")}
            value={props.end}
            now={props.now}
            onClick={() => this.handleOpenCalendar( 'end', props.end, props.onEndChange )}
            className={state.selected == 'end' ? "active" : null}
            />
        </div>
        {state.value ? (
          <DatetimePicker
            value={state.value}
            onClose={state.onToggleCalendar}
            onSelect={(value) => state.onSelect(moment(value))}
            />
        ) : null}
      </div>
    )
  }
}

export default DateRange

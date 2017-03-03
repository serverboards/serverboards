import React from 'react'
import Calendar from 'rc-calendar';
import moment from 'moment'
import {pretty_ago} from 'app/utils'
import i18n from 'app/utils/i18n'

require("sass/calendar.sass")
const DATE_FORMAT="YYYY-MM-DD hh:mm"

const TimePicker=React.createClass({
  propTypes:{
    value: React.PropTypes.object.isRequired
  },
  componentDidMount(){
    let self=this
    $(this.refs.h).dropdown({
      onChange: self.handleChangeHour
    })
    $(this.refs.m).dropdown({
      onChange: self.handleChangeMinute
    })
  },
  handleChangeMinute(v){
    let val=this.props.value.minutes(v)
    this.props.onSelect(val)
  },
  handleChangeHour(v){
    let val=this.props.value.hours(v)
    this.props.onSelect(val)
  },
  range(max){
    var hh=[]
    for (var i=0;i<max;i++){
      hh.push( (""+"0"+i).slice(-2) )
    }
    return hh
  },
  render(){
    const props=this.props
    const value=props.value
    return (
      <div className="ui form time">
        <select ref="h" className="ui dropdown" defaultValue={value.format("H")}>
          {this.range(24).map( (h) =>
            <option key={h} value={h}>{h}</option>
          )}
        </select>
        <select ref="m" className="ui dropdown" defaultValue={value.format("m")}>
          {this.range(60).map( (m) =>
            <option key={m} value={m}>{m}</option>
          )}
        </select>
      </div>
    )
  }
})


const DatetimePicker=React.createClass({
  propTypes:{
    value: React.PropTypes.object.isRequired,
    onSelect: React.PropTypes.func.isRequired,
    onClose: React.PropTypes.func.isRequired,
  },
  getInitialState(){
    return ({
      now: moment(),
      value: this.props.value
    })
  },
  componentDidMount(){
    let position=$(this.refs.el).offset()
    $(this.refs.calendar).css({
      top: position.top+5,
      left: position.left-20
    })
  },
  isDateDisabled(date){
    return date.diff(this.state.now) > (24*60*60);
  },
  handleClickBackground(ev){
    if (ev.target == this.refs.background)
      this.props.onClose()
  },
  handleDateSelect(value){
    this.setState({value})
  },
  handleOk(){
    this.props.onSelect(this.state.value)
    this.props.onClose()
  },
  setToday(){
    this.props.onSelect(moment())
    this.props.onClose()
  },
  render(){
    const props=this.props
    return (
      <span ref="el">
        <div ref="background" className="ui menu full background" onClick={this.handleClickBackground}>
          <div ref="calendar" className="ui calendar">
            <label>Date:</label>
            <Calendar
              value={this.state.value}
              onSelect={this.handleDateSelect}
              onChange={this.handleDateSelect}
              disabledDate={this.isDateDisabled}
              showToday={false}
              />
            <label>Time:</label>
            <TimePicker
              value={this.state.value}
              onSelect={this.handleDateSelect}
              />
            <div className="ui right" style={{marginTop: 10}}>
              <button
                className="ui button"
                onClick={this.setToday}
                >{i18n("Set now")}</button>
              <button
                className="ui button yellow"
                onClick={this.handleOk}
                >{i18n("Set selected")}</button>
            </div>
          </div>
        </div>
      </span>
    )
  }
})


const DatetimeItem=React.createClass({
  propTypes:{
    value: React.PropTypes.object.isRequired,
    now: React.PropTypes.object.isRequired,
    onSelect: React.PropTypes.func.isRequired,
  },
  getInitialState(){
    return {
      open_calendar: false
    }
  },
  onToggleCalendar(){
    this.setState({open_calendar: !this.state.open_calendar})
  },
  render(){
    const props=this.props
    const pretty=pretty_ago(props.value, props.now, 60 * 1000)

    return (
      <div title={props.value.format("YYYY-MM-DD HH:mm")}>
        <a className="item" onClick={this.onToggleCalendar}>
          <label>{props.label}</label>
          <div className="value">
            {pretty}<br/>
            <span className="meta" style={{color: "#bbb", fontWeight: "normal"}}>at {props.value.format("HH:mm")}</span>
            </div>
        </a>
        {this.state.open_calendar ? (
          <DatetimePicker
            value={props.value}
            onClose={this.onToggleCalendar}
            onSelect={(value) => props.onSelect(moment(value))}
            />
        ) : null }
      </div>
    )
  }
})

const DateRange=function(props){
  return (
    <div className="menu" id="daterange">
      <DatetimeItem
        label="From"
        value={props.start}
        onSelect={props.onStartChange}
        now={props.now}
        />
      <DatetimeItem
        label="to"
        value={props.end}
        onSelect={props.onEndChange}
        now={props.now}
        />
    </div>
  )
}

export default DateRange

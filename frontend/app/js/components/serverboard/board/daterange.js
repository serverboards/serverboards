import React from 'react'
import Calendar from 'rc-calendar';
import moment from 'moment'
import {pretty_ago} from 'app/utils'

require("sass/calendar.sass")
const DATE_FORMAT="YYYY-MM-DD hh:mm"


const DatetimePicker=React.createClass({
  getInitialState(){
    return ({
      now: moment()
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
  handleDateSelect(date){
    this.props.onSelect(date)
    this.props.onClose()
  },
  render(){
    const props=this.props
    return (
      <span ref="el">
        <div ref="background" className="ui menu full background" onClick={this.handleClickBackground}>
          <div ref="calendar" className="ui calendar">
            <Calendar
              onSelect={this.handleDateSelect}
              disabledDate={this.isDateDisabled}
              />
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
      <div>
        <a className="item" onClick={this.onToggleCalendar}>
          <label>{props.label}</label>
          <div className="value">
            {pretty}<br/>
            <span className="meta" style={{color: "#bbb", fontWeight: "normal"}}>at {props.value.format("hh:mm")}</span>
            </div>
        </a>
        {this.state.open_calendar ? (
          <DatetimePicker
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

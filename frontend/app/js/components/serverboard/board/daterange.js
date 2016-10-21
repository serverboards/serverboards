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
    const ddhh=pretty_ago(props.value, null, 60 * 1000)

    return (
      <div>
        <a className="item" onClick={this.onToggleCalendar}>
          <label>{props.label}</label>
          <div className="value">{ddhh}</div>
        </a>
        {this.state.open_calendar ? (
          <DatetimePicker
            onClose={this.onToggleCalendar}
            onSelect={(value) => props.onSelect(moment(value).format(DATE_FORMAT))}

            />
        ) : null }
      </div>
    )
  }
})
const DateRange=React.createClass({
  getInitialState(){
    return {
      start: moment().subtract(8,"days").format(),
      end: moment(),
    }
  },
  setEnd(value){
    if (value == moment().format(DATE_FORMAT))
      this.setState({end: "now"})
    else
      this.setState({end: value})
  },
  render(){
    return (
      <div className="menu" ref="el" id="daterange">
        <DatetimeItem
          label="Since"
          value={this.state.start}
          onSelect={(value) => this.setState({start: value})}
          />
        <DatetimeItem
          label="Until"
          value={this.state.end}
          onSelect={this.setEnd}
          />
      </div>
    )
  }
})

export default DateRange

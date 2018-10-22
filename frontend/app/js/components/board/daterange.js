import React from 'react'
import Calendar from 'app/components/calendar';
import moment from 'moment'
import {pretty_ago} from 'app/utils'
import {i18n, i18n_c} from 'app/utils/i18n'
import PropTypes from 'prop-types'


class DatePicker extends React.Component{
  constructor(props){
    super(props)
    this.state = this.getStateFromProps(props)
  }
  isDateDisabled(date){
    if (date)
      return date.diff(this.state.now) > (24*60*60);
  }
  handleDateSelect(value){
    this.setState({value})
    this.props.onSelect(value)
  }
  componentWillReceiveProps(props){
    this.setState(this.getStateFromProps(props))
  }
  getStateFromProps(props){
    let marks = {
      [moment().format('YYYY-MM-DD')]: "today"
    }
    let current = moment(props.start)
    let end = props.end

    while (current < end){
      marks[current.format('YYYY-MM-DD')] = "inrange"
      marks[current.format('YYYY-MM-DD')] = "inrange"
      current.add(1, 'days')
    }
    marks[props.start.format('YYYY-MM-DD')] = "background teal"
    marks[props.end.format('YYYY-MM-DD')] = "background teal"

    return {
      marks,
      now: moment(),
      value: props.value,
    }
  }
  render(){
    const props=this.props

    return (
      <div ref="calendar">
        <Calendar
          navigation={true}
          onClick={this.handleDateSelect.bind(this)}
          disabledDate={this.isDateDisabled.bind(this)}
          marks={this.state.marks}
          />
      </div>
    )
  }
}

DatePicker.propTypes = {
  value: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
}


class DatetimeItem extends React.Component{
  render(){
    const props=this.props
    const pretty=pretty_ago(props.value, props.now, "day")

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
  handleOpenCalendar(selected){
    console.log(selected, this.state.selected)
    if (selected == this.state.selected)
      this.setState({selected: null, value: null})
    else
      this.setState({selected, value: this.props[selected]})
  }
  handleSelectedDate(value){
    const selected = this.state.selected
    if (selected == "start"){
      this.props.onStartChange(value)
      // this.handleOpenCalendar("end")
    }
    if (selected == "end"){
      this.props.onEndChange(value)
      // this.handleHideCalendar()
    }
  }
  handleHideCalendar(){
    console.log("Hide calendar!")
    this.setState({selected:null, value: null})
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
            onClick={() => this.handleOpenCalendar( 'start' )}
            className={state.selected == 'start' ? "active" : null}
            />
          <DatetimeItem
            label={i18n_c("date range", "to")}
            value={props.end}
            now={props.now}
            onClick={() => this.handleOpenCalendar( 'end' )}
            className={state.selected == 'end' ? "active" : null}
            />
        </div>
        {state.value ? (
          <DatePicker
            key={state.selected}
            value={state.value}
            onSelect={(value) => this.handleSelectedDate(value)}
            onClose={this.handleHideCalendar.bind(this)}
            start={props.start}
            end={props.end}
            />
        ) : null}
      </div>
    )
  }
}

export default DateRange

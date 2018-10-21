import React from 'react'
import moment from 'moment'
import {i18n_c} from 'app/utils/i18n'

const WEEKSTART=1
const WEEKEND=0
const MONTHS=[
  i18n_c("calendar", "January"),
  i18n_c("calendar", "February"),
  i18n_c("calendar", "March"),
  i18n_c("calendar", "April"),
  i18n_c("calendar", "May"),
  i18n_c("calendar", "June"),
  i18n_c("calendar", "July"),
  i18n_c("calendar", "August"),
  i18n_c("calendar", "September"),
  i18n_c("calendar", "October"),
  i18n_c("calendar", "November"),
  i18n_c("calendar", "December")
]

class Calendar extends React.Component{
  constructor(props){
    super(props)

    const now = moment(props.value || moment())
    const month = (props.month != undefined) ? Number(props.month) : now.month()
    const year = (props.year != undefined) ? Number(props.year) : now.year()

    this.state = this.getStateFromProps({month, year}, props)
  }
  getStateFromProps(state, props){
    // const now = moment(props.value || moment())
    let month = state.month
    let year = state.year

    if (!month && !year){
      const now = moment(props.value || moment())
      month = (props.month != undefined) ? Number(props.month) : now.month()
      year = (props.year != undefined) ? Number(props.year) : now.year()
    }
    else if (!month){
      const now = moment(props.value || moment())
      month = (props.month != undefined) ? Number(props.month) : now.month()
    }
    else if (!year){
      const now = moment(props.value || moment())
      year = (props.year != undefined) ? Number(props.year) : now.year()
    }


    const {marks} = props

    let weeks=[]
    let curweek=[]
    let current_date
    let first_date
    // moment js months, are 0 based
    {
      current_date=moment({year, month, day: 1})
      if (!current_date.isValid())
        current_date = moment()
      while (current_date.day()!=WEEKSTART){
        current_date.subtract(1,"d")
      }
      first_date=moment(current_date)
    }
    let last_date
    {
      current_date=moment({year: year, month: month, day: 1}).endOf('month')
      if (!current_date.isValid())
        current_date = moment().endOf('month')
      while (current_date.day()!=WEEKEND){
        current_date.add(1,"d")
      }
      last_date=moment(current_date)
    }

    current_date=first_date
    while(current_date.isBefore(last_date)){
      let className=[]
      if (current_date.month() != month)
        className.push("out")
      const dayofweek=current_date.day()
      if (dayofweek==6 || dayofweek==0)
        className.push("weekend")
      const mark_color = marks && marks[current_date.format("YYYY-MM-DD")] || false
      if (mark_color){
        className.push(mark_color)
      }
      curweek.push({date: moment(current_date), className: className.join(' ')})
      if (curweek.length ==7){
        weeks.push(curweek)
        curweek=[]
      }
      // mut in place
      current_date.add(1,"d")
    }
    weeks.push(curweek)

    return {
      month,
      year,
      weeks,
    }
  }
  addMonth(n){
    let year = this.state.year
    let month = this.state.month + n
    if (month<0){
      year-=1
      month=11
    }
    if (month>11){
      year+=1
      month=0
    }
    console.log("Set state", {year, month})
    this.setState(this.getStateFromProps({year, month}, this.props))
  }
  addYear(n){
    const year = this.state.year + n
    this.setState(this.getStateFromProps({year, month: this.state.month}, this.props))
  }
  componentWillReceiveProps(newprops){
    // Allow to move around, only on month and year changes.
    let state = {year: newprops.year, month: newprops.month}
    this.setState(this.getStateFromProps(state, newprops))
  }
  render(){
    const props = this.props
    const state = this.state
    const {onClick} = props
    const {month, year, weeks} = state

    return (
      <div className="ui calendar">
        <div className="ui header">
          {props.navigation ? (
            <div className="selector">
              <div></div>
              <div>
                <a onClick={() => this.addMonth(-1)}>&lt;&lt;</a>
                <div style={{width: "6em"}}>{MONTHS[month]}</div>
                <a onClick={() => this.addMonth(1)}>&gt;&gt;</a>
              </div>
              <div></div>
              <div>
                <a onClick={() => this.addYear(-1)}>&lt;&lt;&lt;</a>
                <div>{year}</div>
                <a onClick={() => this.addYear(1)}>&gt;&gt;&gt;</a>
              </div>
              <div></div>
            </div>
          ) : null}
          <div className="ui week text bold">
            <span>{i18n_c("calendar", "mo")}</span>
            <span>{i18n_c("calendar", "tu")}</span>
            <span>{i18n_c("calendar", "we")}</span>
            <span>{i18n_c("calendar", "th")}</span>
            <span>{i18n_c("calendar", "fr")}</span>
            <span>{i18n_c("calendar", "sa")}</span>
            <span>{i18n_c("calendar", "su")}</span>
          </div>
        </div>
        {weeks.map( (w, nw) => (
          <div key={nw} className="ui week">
            {w.map( (d, nd) => (
              <a key={d.date}
                onClick={() => onClick && onClick(d.date)}
                data-date={d.date.format("YYYY-MM-DD")}
                >
                  <span
                    className={`ui day ${d.className}`}
                    >
                    {d.date.date()}
                  </span>
              </a>
            ))}
          </div>
        ))}
      </div>
    )
  }
}

export default Calendar

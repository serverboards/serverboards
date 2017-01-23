import React from 'react'
import moment from 'moment'

const WEEKSTART=1
const WEEKEND=0
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"]

const Calendar = React.createClass({
  getInitialState(){
    const now = moment()
    return {
      month: (this.props.month != undefined) ? Number(this.props.month) : now.month(),
      year: (this.props.year != undefined) ? Number(this.props.year) : now.year()
    }
  },
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
    this.setState({year, month})
  },
  addYear(n){
    this.setState({year: this.state.year + n })
  },
  render(){
    const props = this.props
    const state = this.state
    const {selected, onClick, marks} = props
    const {month, year} = state
    let weeks=[]
    let curweek=[]
    let current_date
    let first_date
    // moment js months, are 0 based
    {
      current_date=moment({year: year, month: month, day: 1})
      while (current_date.day()!=WEEKSTART){
        current_date.subtract(1,"d")
      }
      first_date=moment(current_date)
    }
    let last_date
    {
      current_date=moment({year: year, month: month, day: 1}).endOf('month')
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
      if (current_date.isSame(selected, "day"))
        className.push("selected")
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

    return (
      <div className="ui calendar">
        {props.navigation ? (
          <div className="ui week header">
            <a onClick={() => this.addMonth(-1)}>&lt;&lt;</a>
            <div>{MONTHS[month]}</div>
            <a onClick={() => this.addMonth(1)}>&gt;&gt;</a>
            <a onClick={() => this.addYear(-1)}>&lt;&lt;&lt;</a>
            <div>{year}</div>
            <a onClick={() => this.addYear(1)}>&gt;&gt;&gt;</a>
          </div>
        ) : null}
        <div className="ui week header text bold">
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
          <span>SUN</span>
        </div>
        {weeks.map( (w, nw) => (
          <div key={nw} className="ui week">
            {w.map( (d, nd) => (
              <a key={d.date}
                onClick={() => onClick && onClick(d.date)}
                className={`ui day ${d.className}`}
                data-date={d.date}
                >
                  {d.date.date()}
              </a>
            ))}
          </div>
        ))}
      </div>
    )
  }
})

export default Calendar

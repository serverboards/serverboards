import React from 'react'
import moment from 'moment'

const WEEKSTART=1
const WEEKEND=0

function Calendar({year, month, selected, onClick, marks}){
  let weeks=[]
  let curweek=[]
  let current_date
  let first_date
  // momenth js months, are 0 based
  month=Number(month)-1
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

export default Calendar

import React from 'react'
import Loading from 'app/components/loading'
import NotificationItem from './item'
import {months} from 'app/utils'
import {i18n} from 'app/utils/i18n'

require('sass/table.sass')

function List(props){
  let month=undefined
  let year=(new Date()).getFullYear()
  let lastyear=year
  function maybe_month(d){
    const dd=new Date(d)
    const dmonth=dd.getMonth()
    const dyear=dd.getFullYear()
    if (month==dmonth && dyear==lastyear)
      return []
    month=dmonth
    let txt=i18n(months[month])

    if (dyear!=year){
      txt=txt+' '+dyear
    }

    return (
      <div className="ui rail left"><span className="ui tiny header">{txt}</span></div>
    )
  }

  if (props.loading)
    return (
      <Loading>{i18n("Notifications")}</Loading>
    )
  const list = props.list

  return(
    <div className="ui central white background">
      <div className="ui text container">
        <h1 className="ui header">{i18n("All Notifications")}</h1>

        <a onClick={props.handleShowFirstPage} style={{cursor:"pointer"}}>{i18n("First page")}</a>
        |
        <a onClick={props.handleShowNextPage} style={{cursor:"pointer"}}>{i18n("Next page")}</a>

        <div className="ui relaxed divided list" id="message_list">
          {list.map( (n) => (
            <div className="item">
              {maybe_month(n['inserted_at'])}
              <NotificationItem notification={n}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default List

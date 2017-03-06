import React from 'react'
import NotificationItem from 'app/components/notifications/item'
import {i18n} from 'app/utils/i18n'

function NotificationsMenu(props){
  const unread=props.unread || []
  return (
    <div className="ui popup" id="notifications_menu">
      <div className="vertical menu">
        {(unread).slice(0,5).map((p) => (
          <NotificationItem key={p.id} notification={p} now={props.open_time}/>
        ))}
        {unread.length > 5 ? (
          <div className="item meta disabled">
          {i18n("And {n} more...", {n: unread.length - 5})}
          </div>
        ) : null}
        <a href="#/notifications/list" className="item inverted yellow" style={{flexDirection: "row"}}>
          {i18n("View all")}
          <i className="ui caret right icon" style={{paddingLeft: 5}}/>
        </a>
      </div>
    </div>
  )
}

export default NotificationsMenu

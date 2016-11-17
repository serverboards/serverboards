import React from 'react'
import NotificationItem from 'app/components/notifications/item'

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
          And {unread.length - 5} more...
          </div>
        ) : null}
        <a href="#/notifications/list" className="item inverted yellow" style={{flexDirection: "row"}}>
          View all <i className="ui caret right icon" style={{paddingLeft: 5}}/>
        </a>
      </div>
    </div>
  )
}

export default NotificationsMenu

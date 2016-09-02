import React from 'react'
import NotificationItem from 'app/components/notifications/item'

function NotificationsMenu(props){
  console.log(props.unread)
  const example={id: 10, tags:["new"], inserted_at:"2016-09-01T10:10+0200", subject:"This is a test", body: "Long body of several\nlines"}
  return (
    <div className="ui popup" id="notifications_menu">
      <div className="vertical menu">
        {(props.unread || []).map((p) => (
          <NotificationItem key={p.id} notification={p} now={props.open_time}/>
        ))}
        <a href="#/notifications/list" className="item" style={{flexDirection: "row"}}>
          View all <i className="ui chevron right icon" style={{paddingLeft: 10}}/>
        </a>
      </div>
    </div>
  )
}

export default NotificationsMenu

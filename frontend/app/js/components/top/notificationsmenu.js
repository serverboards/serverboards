import React from 'react'
import {Link} from 'app/router'
import {label_color} from 'app/components/notifications'

function NotificationsMenu(props){
  return (
    <div className="ui dropdown vertical menu" style={{position: "fixed", right: 175, top: 45, width: "auto", minWidth: 400}}>
      {(props.unread || []).map((p) =>
        <a href={`#/notifications/${p.id}`} className="item">
          <span style={{float: "right", marginTop: -8, paddingLeft: 15}}>{p.tags.map( (t) => (
            <span className={`ui tag tiny label ${label_color(t)}`}>{t}</span>
          ))}
          </span>
          <span>{p.subject}</span>
        </a>
      )}
      <div className="ui divider"/>
      <a href="#/notifications/list" className="item">
        View all
      </a>
    </div>
  )
}

export default NotificationsMenu

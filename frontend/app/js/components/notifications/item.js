import React from 'react'
import {colorize} from 'app/utils'
import {pretty_ago} from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown';

function NotificationItem(props){
  try{
  const p=props.notification
  const timespec=pretty_ago(p.inserted_at)
  let tags=p.tags
  if (tags.indexOf('new')>=0){
    tags=tags.filter((t) => t!='unread')
  }
  return (
    <a href={`#/notifications/${p.id}`} className="item">
      <div>
        <span>{tags.map( (t) => (
          <span style={{marginRight: 5}} className={`ui tiny basic plain label ${colorize(t)}`}>{t}</span>
        ))}
        </span>
        <span className="ui meta"> {timespec}</span>
      </div>
      <h5 className="ui header">{p.subject}</h5>
      <div className="ui meta"><MarkdownPreview value={p.body}/></div>
    </a>
  )
} catch(e){
  console.error(e)
  return []
}
}

export default NotificationItem

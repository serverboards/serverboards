import React from 'react'
import {colorize} from 'app/utils'
import {pretty_ago} from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown';
import {i18n, i18n_nop} from 'app/utils/i18n'
import {goto} from 'app/utils/store'

i18n_nop("unread")
i18n_nop("new")

function NotificationItem(props){
  try{
  const p=props.notification
  const timespec=pretty_ago(p.inserted_at, props.now)
  let tags=p.tags
  if (tags.indexOf('new')>=0){
    tags=tags.filter((t) => t!='unread')
  }
  return (
    <a onClick={() => goto(`/notifications/${p.id}`)} className="item">
      <div>
        <span>{tags.map( (t) => (
          <span key={t} style={{marginRight: 5}} className={`ui tiny basic plain label ${colorize(t)}`}>{i18n(t)}</span>
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

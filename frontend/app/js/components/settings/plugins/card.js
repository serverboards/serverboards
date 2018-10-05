import React from 'react'
import ImageIcon from 'app/components/imageicon'
import IconIcon from 'app/components/iconicon'
import {MarkdownPreview} from 'react-marked-markdown';
import {colorize, capitalize} from 'app/utils'
import {i18n, i18n_nop} from 'app/utils/i18n'

const icon = require("../../../../imgs/plugins.svg")

// Required for translation
i18n_nop("Disabled")
i18n_nop("Enabled")
i18n_nop("Broken")

function PluginCard(props){
  const p=props.plugin
  let author=p.author
  if (author && author.indexOf('<')>0){
    let m = author.match(/(.*)<(.*)>/)
    if (m){
      author=(
        <a href={`mailto:${m[2]}`}>{m[1]}</a>
      )
    }
  }

  const color = p.enabled ? (p.updated == false ? "orange" : "yellow") : "grey"

  return (
    <div key={p.id} className="card">
      <div className="content">
        <div className="ui split area horizontal" style={{height: "auto", marginBottom: 10}}>
          <div className="expand">
            <h2 className="ui header">{i18n(p.name)}</h2>
            <div className="ui meta bold">{i18n("by")} {author}</div>
            <div className="ui meta italic">{i18n("version")} {p.version}</div>
          </div>
          <div style={{minWidth: 48, minHeight: 48, margin: "0px 0px 10px 10px"}}>
            {p.extra.icon ? (
              <IconIcon icon={p.extra.icon} plugin={p.id}/>
            ) : (
              <ImageIcon src={icon} name={i18n(p.name)} className="mini"/>
            )}
          </div>
        </div>
        <div className="ui description"><MarkdownPreview value={i18n(p.description.split('\n\n')[0])}/></div>
      </div>
      <div className="extra content" style={{padding:0}}>
        <div className={`ui inverted ${color} menu bottom attached`}>
          {(p.updated === "updating") ? (
            <span className="ui right item"><i className="ui loading spinner icon"/>{i18n("Updating...")}</span>
          ) : (p.updated === false) ? (
            <a className="ui right item" onClick={(ev) => {ev.preventDefault(); props.onUpdate()}}>
              <i className="ui recycle icon"/>
              {i18n("Update")}
            </a>
          ) : null}
          {props.onOpenSettings ? (
            <a className="ui right item" onClick={(ev) => {ev.preventDefault(); props.onOpenSettings()}}>
              <i className="ui cogs icon"/>
              {i18n("Settings")}
            </a>
          ) : null }
          <a className="ui right item" onClick={(ev) => {ev.preventDefault(); props.onOpenDetails()}}>
            {i18n("View details")} <i className="ui angle right icon"/>
          </a>
        </div>
      </div>
    </div>
  )
}

export default PluginCard

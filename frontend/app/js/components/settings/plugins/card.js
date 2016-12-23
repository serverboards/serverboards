import React from 'react'
import ImageIcon from 'app/components/imageicon'
import {MarkdownPreview} from 'react-marked-markdown';
import {colorize} from 'app/utils'

const icon = require("../../../../imgs/plugins.svg")

// http://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


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

  return (
    <div key={p.id} className="card">
      <div>
        {p.status.map( (s) => (
          <span style={{paddingRight: 15}}><i className={`ui icon circle ${ colorize(s) }`}/> {capitalize(s)}</span>
        )) }
      </div>
      <div className="content">
        <ImageIcon src={icon} className="right floated" name={p.name}/>
        <h2 className="ui header">{p.name}</h2>
        <div className="ui meta bold">by {author}</div>
        <div className="ui meta italic">version {p.version}</div>

        <div className="ui description"><MarkdownPreview value={p.description}/></div>
      </div>
      <div className="extra content" style={{padding:0}}>
        <div className="ui inverted yellow menu bottom attached">
          <a className="ui right item" onClick={(ev) => {ev.preventDefault(); props.onOpenDetails()}}>
            View details <i className="ui angle right icon"/>
          </a>
        </div>
      </div>
    </div>
  )
}

export default PluginCard

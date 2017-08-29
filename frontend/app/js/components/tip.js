import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'

function Tip(props){
  return (
    <div className={props.className}>
      <img src={props.top_img} style={{height: 150}}/>
      <h2 className="ui header centered">{props.title}</h2>
      <img src={props.middle_img} style={{height: 80}}/>
      <div className="ui text container">
        <h3 className="ui header centered">
          {props.subtitle}
        </h3>
        <div className="ui content">
        <MarkdownPreview value={props.description}/>
        </div>
      </div>
    </div>
  )
}

export default Tip

import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'

function Tip(props){
  return (
    <div className={`ui centered fill area ${props.className}`}>
      {props.top_img && (
        <img src={props.top_img} style={{height: 150}}/>
      )}
      {props.title && (
        <h2 className="ui header centered">{props.title}</h2>
      )}
      <img src={props.middle_img || require("imgs/019-illustration-tips.svg")} style={{height: 80}}/>
      <div className="ui text container">
        <h3 className="ui header centered">
          {props.subtitle}
        </h3>
        <div className="ui content justified">
          <MarkdownPreview value={props.description}/>
        </div>
      </div>
    </div>
  )
}

export default Tip

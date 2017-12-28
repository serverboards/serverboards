import React from 'react'
import Icon from './iconicon'
import {colorize} from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown'

/// To be able to change container to <a> or whatever. Normally would be div
function Div(props){
  return (
    <div {...props}>
      {props.children}
    </div>
  )
}
function A(props){
  return (
    <a {...props}>
      {props.children}
    </a>
  )
}

function Card(props){
  let Container=Div
  switch(props.container){
    case 'a':
      Container=A
      break;
    case 'div':
      Container=Div
      break;
    default:
      console.warn("Unknown container type for card: %o", props.container)
  }

  return (
    <Container className={`ui card ${props.className || ""}`} onClick={props.onClick}>
      <div className="ui attached top">
        <Icon icon={props.icon} plugin={props.plugin}/>
        <div className="right">
        {props.tags.map( t => (
          <span className="ui text label">{t} <i className={`ui rectangular ${colorize(t)} label`}/></span>
        ))}
        </div>
      </div>
      <h3 className="ui header">{props.title}</h3>
      <div className="ui description"><MarkdownPreview value={props.description}/></div>
      {props.children}
    </Container>
  )
}

export default Card

import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import {to_list} from 'app/utils'

const icon = require("../../../../imgs/services.svg")

function ComponentDetails({component: c}){
  console.log(c)
  return (
    <div>
      <h3 className="ui small header" style={{marginBottom: 0, textTransform:"none"}}>{c.name || c.id}</h3>
      <div><label>Type:</label> <span className="ui meta">{c.type}</span></div>
      {c.description ? (
        <div><label>Description:</label> <span className="ui meta"><MarkdownPreview value={c.description}/></span></div>
      ) : [] }
    </div>
  )
}

const left_pane_style={
  borderRight: "1px solid #ddd",
  height: "calc( 100vh - 60px )",
  background: "white",
  zIndex: 1
}

function PluginDetails({plugin}){
  console.log(plugin)
  let author=plugin.author
  if (author.indexOf('<')>0){
    let m = author.match(/(.*)<(.*)>/)
    if (m){
      author=(
        <a href={`mailto:${m[2]}`}>{m[1]}</a>
      )
    }
  }

  return (
    <Modal className="wide">
      <div className="ui grid stackable">
        <div className="six wide column" style={left_pane_style}>
          <span style={{float: "right"}}><i className="ui icon circle green"/> Installed</span>
          <ImageIcon src={icon} className="left floated" name={plugin.name}/>
          <h1 className="ui small header" style={{marginBottom:0, textTransform:"none"}}>{plugin.name}</h1>
          <div className="ui meta bold">by {author}</div>
          <div className="ui fields" style={{clear:"both"}}>
            <div className="field">
              <label>Version</label>
              <div className="ui meta">{plugin.version}</div>
            </div>
            {plugin.url ? (
              <div className="field">
              <label>URL</label>
              <div className="ui meta"><a href={plugin.url} target="_blank" rel="external">{plugin.url}</a></div>
              </div>
            ) : []}
          </div>
          <div style={{paddingTop: 20, overflow: "auto", maxHeight:"calc( 100vh - 195px )"}}>
            <h2>Components</h2>
            {to_list(plugin.components).map( (nc) => (
              <ComponentDetails component={nc[1]}/>
            ))}
          </div>
        </div>
        <div className="ten wide column">
          <div className="ui top menu">
          </div>
          <div>
            <h2 className="ui medium header" style={{textTransform:"none"}}>Description</h2>
            <div className="ui description">
              <MarkdownPreview value={plugin.description}/>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PluginDetails

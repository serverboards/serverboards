import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import {to_list} from 'app/utils'
import plugin from 'app/utils/plugin'
import Flash from 'app/flash'

const icon = require("../../../../imgs/plugins.svg")

function ComponentDetails({component: c}){
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
  paddingLeft: 20,
  borderRight: "1px solid #ddd",
  height: "calc( 100vh - 60px )",
  background: "white",
  zIndex: 1
}

const PluginDetails=React.createClass({
  getInitialState(){
    return {
      is_active: this.props.plugin.is_active
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.is_active).checkbox({
      onChange(ev){
        const is_active = $(self.refs.is_active).is('.checked')
        console.log("Changed: %o", is_active)
        self.props.setActive(self.props.plugin.id, is_active)
        self.setState({is_active})
      }
    })
  },
  handleUpdate(){
    plugin.start_call_stop("serverboards.optional.update/updater","update_plugin",[this.props.plugin.id]).then( () => {
      Flash.info("Plugin updated.")
      this.props.updateAll()
    }).catch( (e) => {
      Flash.error("Error updating plugin: "+e)
    })
  },
  render(){
    const {plugin} = this.props
    let author=plugin.author
    if (author && author.indexOf('<')>0){
      let m = author.match(/(.*)<(.*)>/)
      if (m){
        author=(
          <a href={`mailto:${m[2]}`}>{m[1]}</a>
        )
      }
    }

    return (
      <Modal className="wide">
        <div className="ui top secondary menu">
          <ImageIcon src={icon} name={plugin.name}/>
          <div style={{display:"inline-block"}}>
            <h3 className="ui header" style={{marginBottom:0, textTransform:"none"}}>{plugin.name}</h3>
            <div className="ui meta bold">by {author}</div>
          </div>
          <div className="right menu">
            {!plugin.id.startsWith("serverboards.core.") ? (
              <div className="item" style={{flexDirection:"column"}}>
                <div>
                  {this.state.is_active ? (
                    <span><i className="ui icon circle green"/> Active</span>
                  ) : (
                    <span><i className="ui icon circle grey"/> Not Active</span>
                  )}
                </div>
                <div ref="is_active" className="ui toggle checkbox" style={{paddingTop: 10}}>
                  <input type="checkbox" defaultChecked={plugin.is_active}/>
                </div>
              </div>
            ) : null }
            {plugin.require_update ? (
              <button className="ui yellow button" onClick={this.handleUpdate}>Update now</button>
            ) : null }
          </div>
        </div>
        <div className="ui grid stackable" style={{margin: 0}}>
          <div className="six wide column" style={left_pane_style}>
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
              <h3>Components</h3>
              {to_list(plugin.components).map( (nc) => (
                <ComponentDetails key={nc[1].id} component={nc[1]}/>
              ))}
            </div>
          </div>
          <div className="ten wide column">
            <div>
              <h3 className="ui medium header" style={{textTransform:"none"}}>Description</h3>
              <div className="ui description">
                <MarkdownPreview value={plugin.description}/>
              </div>
            </div>
            {plugin.require_update ? (
              <div>
                <h3 className="ui medium header">Update changelog</h3>
                <ul>
                  {plugin.require_update.split('\n').map( (l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ) : null }
          </div>
        </div>
      </Modal>
    )
  }
})

export default PluginDetails

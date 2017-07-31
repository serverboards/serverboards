import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import {to_list} from 'app/utils'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import {colorize, capitalize} from 'app/utils'

const icon = require("../../../../imgs/plugins.svg")

function ComponentDetails({component: c}){
  return (
    <div>
      <h3 className="ui small header" style={{marginBottom: 0, textTransform:"none"}}>{i18n(c.name || c.id)}</h3>
      <div><label>{i18n("Type:")}</label> <span className="ui meta">{c.type}</span></div>
      {c.description ? (
        <div><label>{i18n("Description:")}</label> <span className="ui meta"><MarkdownPreview value={i18n(c.description)}/></span></div>
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
      is_active: this.props.plugin.status.includes("active"),
      is_updatable: this.props.plugin.status.includes("updatable"),
      tags: this.props.plugin.status
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.is_active).checkbox({
      onChange(ev){
        const is_active = $(self.refs.is_active).is('.checked')
        self.handleSetActive(self.props.plugin.id, is_active)
        self.setState({is_active})
      }
    })
  },
  handleSetActive(plugin_id, is_active){
    rpc
      .call("settings.update", ["plugins", plugin_id, is_active])
      .then( () => this.componentDidMount() )
  },
  handleUpdate(){
    rpc.call("action.trigger", ["serverboards.optional.update/update_plugin",  {"plugin_id": this.props.plugin.id}]).then( () => {
      Flash.info("Plugin updated.")
      this.props.updateAll()
      this.setState({is_updatable: false, tags: this.state.tags.filter( t => t!="updatable" ) })
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
          <ImageIcon src={icon} name={i18n(plugin.name)}/>
          <div style={{display:"inline-block"}}>
            <h3 className="ui header" style={{marginBottom:0, textTransform:"none"}}>{i18n(plugin.name)}</h3>
            <div className="ui meta bold">{i18n("by")} {author}</div>
          </div>
          <div className="right menu">
            {this.state.is_updatable ? (
              <div className="item">
                <button className="ui yellow button" onClick={this.handleUpdate}>{i18n("Update now")}</button>
              </div>
            ) : null }
            {!plugin.id.startsWith("serverboards.core.") ? (
              <div className="item two lines">
                <div>
                  {this.state.tags.map( (s) => (
                    <span key={s} className="ui text label"><i className={`ui rectangular ${ colorize(s) } label`}/> {i18n(capitalize(s))}</span>
                  )) }
                </div>
                <div ref="is_active" className="ui toggle checkbox">
                  <input type="checkbox" checked={this.state.is_active}/>
                </div>
              </div>
            ) : null }
          </div>
        </div>
        <div className="ui grid stackable" style={{margin: 0}}>
          <div className="six wide column" style={left_pane_style}>
            <div className="ui fields" style={{clear:"both"}}>
              <div className="field">
                <label>{i18n("Version")}</label>
                <div className="ui meta">{plugin.version}</div>
              </div>
              {plugin.url ? (
                <div className="field">
                  <label>{i18n("URL")}</label>
                  <div className="ui meta"><a href={plugin.url} target="_blank" rel="external">{plugin.url}</a></div>
                </div>
              ) : []}
            </div>
            <div style={{paddingTop: 20, overflow: "auto", maxHeight:"calc( 100vh - 195px )"}}>
              <h3>{i18n("Components")}</h3>
              {to_list(plugin.components).map( (nc) => (
                <ComponentDetails key={nc[1].id} component={nc[1]}/>
              ))}
            </div>
          </div>
          <div className="ten wide column">
            <div>
              <h3 className="ui medium header" style={{textTransform:"none"}}>{i18n("Description")}</h3>
              <div className="ui description">
                <MarkdownPreview value={i18n(plugin.description)}/>
              </div>
            </div>
            {plugin.require_update ? (
              <div>
                <h3 className="ui medium header">{i18n("Update changelog")}</h3>
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

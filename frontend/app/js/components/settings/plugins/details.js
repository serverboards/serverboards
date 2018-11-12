import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown';
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import {to_list} from 'app/utils'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import event from 'app/utils/event'
import cache from 'app/utils/cache'
import plugin from 'app/utils/plugin'
import {colorize, capitalize} from 'app/utils'
import HoldButton from 'app/components/holdbutton'
import IconIcon from 'app/components/iconicon'

const icon = require("../../../../imgs/plugins.svg")

function ComponentDetails({component: c}){
  return (
    <div>
      <hr className="ui divider"/>
      <h3 className="ui small header" style={{margin: "0 0 10px 0", textTransform:"none"}}>{i18n(c.name || c.id)}</h3>
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

class PluginDetails extends React.Component{
  constructor(props){
    super(props)

    this.state = this.getInitialState(props)
    this.checkUpdates = this.checkUpdates.bind(this)
  }
  getInitialState(props){
    return {
      enabled: props.plugin.enabled,
      updated: props.updated,
      plugin: props.plugin,
      latest: props.latest,
    }
  }
  componentDidMount(){
    let self=this
    $(this.refs.enabled).checkbox({
      onChange(ev){
        const enabled = $(self.refs.enabled).is('.checked')
        self.handleSetEnable(enabled)
        self.setState({enabled})
      }
    })
    event.on("plugins.reloaded", this.checkUpdates)
    this.checkUpdates()
  }
  componentWillUnmount(){
    event.off("plugins.reloaded", this.checkUpdates)
  }
  checkUpdates(){
    const pid = this.props.plugin.id
    const maybe_update_promise = this.state.plugin.tags.indexOf("core")<0 ?
      plugin.call("serverboards.core.update/marketplace", "check_updates", [pid]) :
      Promise.resolve([{updated: true}])

    Promise.all([
      maybe_update_promise,
      cache.plugin(pid)
    ]).then( ([update, plugin]) => {
      console.log("Update", update)
      if (update.length == 0){
        Flash.error("Error getting current update status. Maybe manually installed?")
        this.setState( this.getInitialState({plugin, updated: false}))
        return;
      }
      if (plugin.enabled)
        $(this.refs.enabled).checkbox("set checked")
      else
        $(this.refs.enabled).checkbox("set unchecked")
      this.setState( this.getInitialState({plugin, updated: update[0].updated, latest: update[0].latest}))
    }).catch(e => {
      Flash.error(e)
      this.setState({updated: "unknown"})
    })
  }
  handleSetEnable(enabled){
    rpc.call("action.trigger", ["serverboards.core.update/enable_plugin",  {"plugin_id": this.props.plugin.id, enabled}])
    this.setState({enabled})
  }
  handleUpdate(){
    this.setState({updated: "updating"})

    rpc.call("action.trigger", ["serverboards.core.update/update_plugin",  {"plugin_id": this.props.plugin.id}]).then( () => {
      Flash.info("Plugin updated.")
      // this.props.updateAll()
      this.setState({updated: undefined})
      this.checkUpdates()
    }).catch( (e) => {
      console.log(e)
      Flash.error("Error updating plugin: "+e)
    })
  }
  handleRemove(){
    rpc.call("action.trigger", ["serverboards.core.update/remove_plugin",  {"plugin_id": this.props.plugin.id}]).then( () => {
      Flash.info("Plugin removed.")
      // this.props.updateAll()
      this.props.onClose()
    }).catch( (e) => {
      console.log(e)
      Flash.error("Error removing plugin: "+e)
    })
  }
  render(){
    const {plugin} = this.state
    let author=plugin.author
    if (author && author.indexOf('<')>0){
      let m = author.match(/(.*)<(.*)>/)
      if (m){
        author=(
          <a href={`mailto:${m[2]}`}>{m[1]}</a>
        )
      }
    }
    const tags = plugin.tags
    console.log("tags", tags)

    return (
      <Modal className="wide">
        <div className="ui top secondary menu">
          <div style={{minWidth: 48, minHeight: 48, margin: "0 10px 0 10px"}}>
            {plugin.extra.icon ? (
              <IconIcon icon={plugin.extra.icon} plugin={plugin.id} style={{minWidth: 48, minHeight: 48}}/>
            ) : (
              <ImageIcon src={icon} name={i18n(plugin.name)} className="mini"/>
            )}
          </div>

          <div style={{display:"inline-block"}}>
            <h3 className="ui header" style={{marginBottom:0, textTransform:"none"}}>{i18n(plugin.name)}</h3>
            <div className="ui meta bold">{i18n("by")} {author}</div>
          </div>
          <div className="right menu">
            {tags.indexOf("core")<0 && (
              <React.Fragment>
                {this.state.updated == undefined ? (
                  <div className="item">
                    <button className="ui teal basic disabled button" onClick={this.handleUpdate.bind(this)}>
                      <i className="ui icon loading spinner"/>{i18n("Checking updates")}
                    </button>
                  </div>
                ) : this.state.updated == "installing" ? (
                  <div className="item">
                    <button className="ui teal basic disabled button" onClick={this.handleUpdate.bind(this)}>
                      <i className="ui icon loading spinner"/>{i18n("Updating...")}
                    </button>
                  </div>
                ) : this.state.updated == false ? (
                  <div className="item">
                    <button className="ui teal button" onClick={this.handleUpdate.bind(this)}>
                      {i18n("Update Now to {version}", {version: this.state.latest})}
                    </button>
                  </div>
                ) : this.state.updated == "unknown" ? (
                  <div className="item">
                    <button
                      className="ui teal button"
                      onClick={this.handleUpdate.bind(this)}
                      data-tooltip={i18n("Could not check update status. You can force update anyway.")}
                      data-position="bottom right"
                      >
                        {i18n("Force update")}
                    </button>
                  </div>
                ) : (
                  <div className="item">
                    <button
                      className="ui teal button"
                      onClick={this.handleUpdate.bind(this)}
                      data-tooltip={i18n("Altough no update has been detected for this plugin, you can force update.")}
                      data-position="bottom right"
                      >
                        {i18n("Force update")}
                    </button>
                  </div>
                ) }
                <HoldButton
                    className="ui basic red button" style={{marginTop: 4}}
                    onHoldClick={this.handleRemove.bind(this)}>
                  {i18n("Hold to remove")}
                </HoldButton>
              </React.Fragment>
            )}
            {tags.indexOf("optional")>=0 && (
              <div className="item two lines">
                <div ref="enabled" className="ui toggle checkbox">
                  <input type="checkbox" checked={this.state.enabled}/>
                </div>
              </div>
            )}
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
}

export default PluginDetails

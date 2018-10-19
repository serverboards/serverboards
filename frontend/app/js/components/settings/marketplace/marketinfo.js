import React from 'react'
import Modal from 'app/components/modal'
import i18n from 'app/utils/i18n'
import Icon from 'app/components/iconicon'
import {MarkdownPreview, Loading} from 'app/components'
import plugin from 'app/utils/plugin'
import Flash from 'app/flash'
import {map_get} from 'app/utils'


class PluginInfo extends React.Component{
  constructor(props){
    super(props)

    const plugin_id = this.props.plugin.id

    this.state = {
      loading: true,
      plugin_id
    }
  }
  componentDidMount(){
    plugin
      .call("serverboards.core.update/marketplace", "package_show", [this.props.plugin.id])
      .then((plugin) => this.setState({plugin, loading: false}))
      .catch(Flash.error)
  }
  render(){
    if (this.state.loading){
      return (
        <Modal>
          <Loading/>
        </Modal>
      )
    }

    const {plugin} = this.state
    const props = this.props
    const icon = map_get(plugin, ["assetsdata", "icon"]) || map_get(plugin, ["assets", "icon"])
    const screenshot = map_get(plugin, ["assetsdata", "screenshot"])

    const button_text = props.tag.free ? i18n("Install now for free") : i18n("Install now for {label}", props.tag)

    return (
      <Modal>
        <div className="ui top secondary menu" style={{padding: 5}}>
          <Icon className="mini" icon={icon} plugin={plugin.id}/>
          <div style={{display:"inline-block", paddingLeft: 15}}>
            <h3 className="ui header">{plugin.name}</h3>
          </div>
          <span style={{paddingLeft: 10}} className={`ui text ${props.tag.color}`}>{props.tag.label}</span>
          {!plugin.sudo && (
            <span className="ui right item">
              <button className={`ui ${props.tag.color} button`} onClick={props.onInstall}>{button_text}</button>
            </span>
          )}
        </div>

        <div className="ui scroll">
          <div className="ui text container" style={{paddingBottom: 30}}>
            <h1 className="ui slim header no margin">{plugin.name} <span className="ui normal text meta">{plugin.version}</span></h1>
            <div className="ui meta no margin">{plugin.author}</div>
            {plugin.url && (
              <a href={plugin.url}>{plugin.url}</a>
            )}
            <span className="ui meta">
              {plugin.id}
            </span>
            {screenshot && (
              <img src={screenshot} style={{maxWidth: "100%", boxShadow: "1px 1px 4px rgba(0,0,0,0.5)"}}/>
            )}
            <div className="ui normal text" style={{marginTop: 30, marginBottom: 30}}>
              <MarkdownPreview value={plugin.full_description}/>
            </div>
            {plugin.sudo ? (
              <div className="ui icon message visible">
                <i className="info blue circle icon"></i>
                <div className="content">
                  <MarkdownPreview value={i18n(`
This plugin requires to install additional software on your computer,
for example \`.deb\` packages or add some system level configuraton.

To install this plugin, write this on the server terminal:

\`\`\`shell
sudo s10s plugin install {id}
\`\`\`

`, {id: plugin.id})}/>
                </div>
              </div>
            ) : (
              <button className={`ui ${props.tag.color} button`} onClick={props.onInstall}>{button_text}</button>
            )}
          </div>
        </div>
      </Modal>
    )
  }
}

export default PluginInfo

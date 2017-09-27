import React from 'react'
import i18n from 'app/utils/i18n'
import View from 'app/components/settings/plugins/add'
import plugin from 'app/utils/plugin'
import rpc from 'app/rpc'
import Flash from 'app/flash'

class AddModel extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      plugins: undefined,
      locaing: true
    }
  }
  get_plugins(){
    return plugin
      .start_call_stop("serverboards.optional.update/updater", "plugin_catalog")
  }
  handleInstallPlugin(plugin_url){
    if (!plugin_url){
      Flash.error(i18n("Please set a valid URL"))
      return;
    }
    rpc.call("plugin.install", [plugin_url]).then( () => {
      Flash.info(i18n("Plugin from {plugin_url} installed and ready.",{plugin_url}))
    }).catch( (e) => {
      Flash.error(e)
    })
  }
  render(){
    if (this.state.loading)
      return (
        <Loading>{i18n("Widget descriptions")}</Loading>
      )
    return (
      <View
        {...this.state}
        {...this.props}
        get_items={this.get_plugins.bind(this)}
        onInstallPlugin={this.handleInstallPlugin.bind(this)}
        />
    )
  }
}

export default AddModel

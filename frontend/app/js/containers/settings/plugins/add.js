import React from 'react'
import i18n from 'app/utils/i18n'
import View from 'app/components/settings/plugins/add'
import plugin from 'app/utils/plugin'
import cache from 'app/utils/cache'
import rpc from 'app/rpc'
import Flash from 'app/flash'

class AddModel extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      plugins: undefined,
      reload_key: 1
    }
  }
  get_plugins(){
    return Promise.all([
        plugin
          .start_call_stop("serverboards.optional.update/updater", "plugin_catalog")
        , cache.plugins()
      ]).then( (cp) => {
        const catalog = cp[0]
        const plugin_list = cp[1]

        console.log("Got catalog %o // %o", catalog, plugin_list)
        return catalog.filter( c => !plugin_list[c.id] )
      })

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
      this.reload()
    }).catch( (e) => {
      Flash.error(e)
      this.reload()
    })
  }
  reload(){
    cache.invalidate_all()
    this.setState({reload_key: this.state.reload_key+1})
  }
  render(){
    if (this.state.loading)
      return (
        <Loading>{i18n("Widget descriptions")}</Loading>
      )
    return (
      <View
        key={this.state.reload_key}
        {...this.state}
        {...this.props}
        get_items={this.get_plugins.bind(this)}
        onInstallPlugin={this.handleInstallPlugin.bind(this)}
        />
    )
  }
}

export default AddModel

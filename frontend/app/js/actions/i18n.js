import {i18n, i18n_nop} from 'app/utils/i18n'
import rpc from 'app/rpc'

export function set_lang(lang){
  return function(dispatch){
    i18n.load({lang, clean: true}).then( () => {
      dispatch({type: "AUTH_SET_LANG", lang})
      dispatch(load_plugin_list_i18n(lang))
    }).catch( (e) => {
      console.warning("Using default translations.")
      i18n.update( {}, {clean: true})
      dispatch({type: "AUTH_SET_LANG", lang})
    })
  }
}


export function load_plugin_list_i18n(lang){
  return function(dispatch){
    console.log("Loading plugin list i18n")
    rpc.call("plugin.catalog",[]).then( (pluginsd) => {
      let promises = []
      for (let k in pluginsd){
        if (pluginsd[k].extra.i18n){
          let p = i18n.load({lang, plugin: k}).catch( () => {})
          promises.push(p)
        }
      }
      return Promise.all(promises)
    }).then( (p) => {
      console.log("Loaded all plugin translations", p.length)
      // Force reload because of lang change
      dispatch({type: "AUTH_SET_LANG", lang})
    })
  }
}

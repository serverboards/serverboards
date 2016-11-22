export {render_promise, render} from 'app/utils/templates'
import rpc from 'app/rpc'

export function resolve_form_vars(vars, args){
  return Promise.all( (vars || []).map( (v) => { // For each var run plugin, get value, stop plugin
    let p=new Promise((resolve, reject) => {
      rpc.call("plugin.start", [v.command])
      .then((uuid) => {
        rpc.call(`${uuid}.${v.call}`, args)
        .then((content) => resolve([v.id, content]))
        .catch((e) => reject(e))
        .then(() => rpc.call("plugin.stop", [uuid]))
        .catch((e) => true) // no prob if no stop
      })
      .catch((e) => reject(e))
    })
    return p
  })).then( (varlist) => {
    let ret={}
    varlist.map( kv => {
      ret[kv[0]]=kv[1]
    })
    return ret
  })
}

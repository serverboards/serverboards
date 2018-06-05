export {render_promise, render} from 'app/utils/templates'
import rpc from 'app/rpc'

export function resolve_form_vars(vars, args){
  // console.log("Resolve call ", vars, args)
  return Promise.all( (vars || []).map( (v) =>  // For each var run plugin, get value, stop plugin
      rpc.call("plugin.call", [v.command, v.call, args])
        .then((content) => [v.id, content])
  )).then( (varlist) => {
    let ret={}
    varlist.map( kv => {
      ret[kv[0]]=kv[1]
    })
    return ret
  })
}

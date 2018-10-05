export {render_promise, render} from 'app/utils/templates'
import rpc from 'app/rpc'
import store from 'app/utils/store'

/**
 * @short Gets a vars list as descibed at genericforms and returns the return values
 *
 * @param vars is the variable descriptions: {method, command, params}
 * @param args is the current values of the form
 */
export function resolve_form_vars(vars, args){
  // console.log("Resolve from vars ", {vars, args})
  return Promise.all( (vars || []).map( (v) => {
    return rpc.call("plugin.call", [v.command, v.call, {...args, ...(v.extra||{})}])
       .then((content) => [v.id, content])
  })).then( (varlist) => {
    let ret={}
    varlist.map( kv => {
      ret[kv[0]]=kv[1]
    })
    return ret
  })
}

/**
 * @short from some fields and some form data return only on those fields description
 *
 * If fields, return all.
 */
export function data_from_form_data( fields, form_data ){
  if (!fields) // No fields set, return all
    return form_data
  let data = {}
  Object.keys(form_data).map( (k) => {
    let ff = fields.find( f => f.name == k)
    // Only pass through the known fields
    if (ff){
      if (ff.type == "service"){
        let service_id = form_data[k]
        data[k]=store.getState().project.project.services.find( s => s.uuid == service_id )
      }
      else{
        data[k]=form_data[k]
      }
    }
  })
  return data
}

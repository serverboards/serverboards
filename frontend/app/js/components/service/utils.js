import {merge, is_empty} from 'app/utils'
import rpc from 'app/rpc'
import store from 'app/utils/store'

// Two services refer to the same, used for replacing and deleting
export function is_same_service(c1, c2){
  return (
    (c1.id && c1.id == c2.id)
    ||
    (c1.uuid == c2.uuid)
  )
}

export function get_template(service_type, service_catalog){
  if (!service_catalog)
    service_catalog = store.getState().services.catalog || {}
  return service_catalog[service_type] || "error"
}

export function setup_fields(service, template){
  let fields = (template.extra.fields || []).map( (f) => Object.assign({}, f,
      { value: service.config[f.name] || f.value }
    ) )
  return fields
}

export function get_service_data(uuid){
  if (uuid.uuid){ // Maybe asking already a service
    console.warn("Please, ask me a uuid, not a service. Returning as is.")
    return Promise.resolve(uuid)
  }
  //console.log(uuid)
  // Gets service data, maybe including sub services (via/proxy)
  return rpc.call("service.get", [uuid]).then((service) => {
    let req=service.fields.filter( (f) => f.type == 'service' && service.config[f.name] )
    if (req.length > 0){
      return Promise.all(
          req.map( (f) => get_service_data( service.config[f.name] ) ) // Recursive get data
        ).then( (subservices) => {
          subservices.map( (s, i) => {
            service.config[ req[i].name ]=s
          })
        return service
      } )
    }
    else{
      return service
    }
  })
}

export function simple_tag(tag){
  if (tag.indexOf(':')<0)
    return tag
  return tag.split(':')[1]
}

export default {
  is_same_service, setup_fields,
  get_service_data
}

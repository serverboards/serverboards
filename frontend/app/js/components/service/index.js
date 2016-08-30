

// Two services refer to the same, used for replacing and deleting
export function is_same_service(c1, c2){
  return (
    (c1.id && c1.id == c2.id)
    ||
    (c1.uuid == c2.uuid)
  )
}


export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}

export function setup_fields(service, service_catalog){
  let definition=service_definition(service.type, service_catalog)

  let fields = definition.fields.map( (f) => Object.assign({}, f,
      { value: service.config[f.name] || f.value }
    ) )
  return fields
}

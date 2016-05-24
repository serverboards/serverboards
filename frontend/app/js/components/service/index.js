

// Two services refer to the same, used for replacing and deleting
export function is_same_service(c1, c2){
  return (
    (c1.id && c1.id == c2.id)
    ||
    (c1.uuid == c2.uuid)
  )
}


export function default_service_fields(name){
  return [
    {
      label: 'Name',
      name: 'name',
      type: 'text',
      description: 'Service name as shown in UI',
      value: name,
      validation: 'empty'
    }, {
      label: 'Description',
      name: 'description',
      type: 'textarea',
      description: 'Comments about this service'
    },
  ]
}

export function setup_fields(service, service_catalog){
  let definition=service_catalog.find( (c) => c.type == service.type )

  let fields = definition.fields.map( (f) => Object.assign({}, f,
      { value: service.config[f.name] }
    ) )
  fields = default_service_fields(service.name).concat( fields )
  return fields
}

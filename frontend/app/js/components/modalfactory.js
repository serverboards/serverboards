export function get_modal(name){
  switch(name){
    case "service.settings":
      return require('app/containers/service/settings').default
    case "service.virtual":
      return require('app/components/service/virtual').default
    case "auth.group.edit_perms":
      return require('app/containers/settings/group/edit_perms').default
    case "auth.group.edit_users":
      return require('app/containers/settings/group/edit_users').default
    case "auth.group.add_group":
      return require('app/containers/settings/group/add').default
  }
}

export default get_modal

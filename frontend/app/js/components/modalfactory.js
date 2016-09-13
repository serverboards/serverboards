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
    case "auth.group.add":
      return require('app/containers/settings/group/add').default
    case "auth.user.add":
      return require('app/containers/settings/user/add').default
    case "auth.user.edit":
      return require('app/containers/settings/user/edit').default
    case "notification.send":
      return require('app/components/notifications/send').default
    case "service.action":
      return require('app/components/service/actionmodal').default
  }
}

export default get_modal
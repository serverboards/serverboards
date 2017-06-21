export function get_modal(name){
  switch(name){
    case "service.settings":
      return require('app/containers/service/settingsmodal').default
    case "service.virtual":
      return require('app/components/service/virtual').default
    case "auth.group.edit_perms":
      return require('app/containers/settings/group/edit_perms').default
    case "auth.group.edit_users":
      return require('app/containers/settings/group/edit_users').default
    case "auth.group.create":
      return require('app/containers/settings/group/add').default
    case "auth.user.add":
      return require('app/containers/settings/user/add').default
    case "auth.user.edit":
      return require('app/containers/settings/user/edit').default
    case "notification.send":
      return require('app/components/notifications/send').default
    case "service.action":
      return require('app/components/service/actionmodal').default
    case "dashboard.widget.create":
      return require('app/containers/project/board/add_widget').default
    case "dashboard.widget.edit":
      return require('app/containers/project/board/edit_widget').default
    case "plugin.screen":
      return require('app/components/plugin/modal').default
    case "service.create":
      return require('app/containers/project/addservice').default
    case "rule.create":
      return require('app/containers/rules/edit').default
    case "rule.edit":
      return require('app/containers/rules/edit').default
    case "dashboard.create":
      return require('app/components/project/board/add_dashboard').default
    case "project.add":
      return require('app/containers/project/add').default
  }
}

export default get_modal

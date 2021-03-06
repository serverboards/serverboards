import React from 'react'
import Modal from 'app/components/modal'

export function make_modal(Component){
  return function(props){
    return (
      <Modal>
        <Component {...props}/>
      </Modal>
    )
  }
}


export function get_modal(name){
  switch(name){
    case "service.add":
      return require('app/components/service/addmodal').default
    case "service.settings":
      return require('app/containers/service/settingsmodal').default
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
      return make_modal(require('app/containers/board/add_widget').default)
    case "dashboard.widget.edit":
      return require('app/containers/board/edit_widget').default
    case "dashboard.settings":
      return require('app/containers/board/settings').default
    case "plugin.screen":
      return require('app/components/plugin/modal').default
    case "plugin.show.from.marketplace":
      return require('app/components/settings/marketplace/marketinfo').default
    case "service.create":
      return require('app/containers/project/addservice').default
    case "dashboard.create":
      return require('app/components/board/add_dashboard').default
    case "project.add":
      return require('app/containers/project/add').default
    case "plugin.details":
      return require('app/components/settings/plugins/details').default
    case "plugin.settings":
      return require('app/components/settings/plugins/settings').default
    case "logs":
      return require('app/components/logs/modal').default
  }
}

export default get_modal

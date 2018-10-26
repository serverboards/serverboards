import rpc from 'app/rpc'

export function toggle_sidebar(){
  return {
    type: 'TOP_TOGGLE_SIDEBAR',
  }
}

export function toggle_project_selector(){
  return {
    type: 'TOP_TOGGLE_PROJECT_SELECTOR',
  }
}

export function toggle_menu(menu=''){
  return {
    type: "TOP_TOGGLE_MENU",
    menu: menu
  }
}

export function update_screens(){
  return rpc
    .call("plugin.component.catalog", {type: "screen"})
    .then( screens => {
      return {
        type: "TOP_UPDATE_SCREENS",
        payload: screens
      }
    })
}

export function added_more_hooks(){
  return {
    type: "ADDED_MORE_HOOKS"
  }
}

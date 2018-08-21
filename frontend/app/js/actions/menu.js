import rpc from 'app/rpc'

export function toggle_sidebar(){
  return {
    type: 'TOP_TOGGLE_SIDEBAR',
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
      console.log(screens)
      return {
        type: "TOP_UPDATE_SCREENS",
        payload: screens
      }
    })
}

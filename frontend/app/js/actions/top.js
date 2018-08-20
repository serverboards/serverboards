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

import React from 'react'

export let menu = {
  menu: null,
  props: null,
  real: null,
}

export function set_menu(new_menu, new_props){
  menu.menu = new_menu
  menu.props = new_props
  menu.real && menu.real.setState({timeid: menu.real.state.timeid + 1})
}

export function set_props(new_props){
  menu.props = new_props
  menu.real && menu.real.setState({timeid: menu.real.state.timeid + 1})
}

/**
 * Wrapper that can be sued to set up a menu inside a render component.
 *
 * The menu will be shown at the main chrome.
 */
export class SectionMenu extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      inline: false,
    }
  }
  componentDidMount(){
    // console.log("set menu", {...this.props})
    if (menu.menu)
      this.setState({inline: true})
    else
      set_menu( this.props.menu, this.props )
  }
  componentWillUnmount(){
    // console.log("unset menu")
    if (!this.state.inline)
      set_menu( null )
  }
  UNSAFE_componentWillReceiveProps(nextprops){
    set_props(nextprops)
  }
  render(){
    if (this.state.inline){
      return (
        <div className="ui horizontal secondary menu">
          {this.props.menu(this.props)}
        </div>
      )
    }
    return null
  }
}


SectionMenu.set_menu = set_menu
SectionMenu.set_props = set_props
SectionMenu.menu = menu

export default SectionMenu

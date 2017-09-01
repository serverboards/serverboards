import React from 'react'

function Item({s}){
  return (
    <a
      key={s.id}
      className={`item ${s.active ? "active" : ""}`}
      onClick={s.onClick}
      title={s.description}
      >
        {s.label}
        {s.icon ? (
          <i className={`ui icon ${s.icon}`}/>
        ) : null}
    </a>
  )
}

class TabBar extends React.Component{
  constructor(props){
    super(props)

    this.state={
      visible_items: this.props.tabs.length,
      show_menu: false
    }
  }
  componentDidMount(){
    $(window).on( "resize.tabbar", () => {
      this.setState({visible_items: this.props.tabs.length})
      setTimeout(
        () => this.reflow(this.props.tabs.length),
        300
      )
    } )
    this.reflow()
  }
  componentWillUnmount(){
    $(window).off('.tabbar')
  }
  reflow(){
    const tabbar = this.refs.tabbar
    this.refs.parent.style.overflow='hidden'
    let myw = 0
    const maxwidth = tabbar.clientWidth
    let visible_items = 0
    for (const ch of tabbar.children){
      myw += ch.clientWidth
      if (myw > maxwidth){
        if (visible_items>0){
          this.setState({visible_items})
        }
        this.refs.parent.style.overflow="visible"
        return
      }
      visible_items += 1
    }
  }
  render(){
    const {tabs} = this.props
    const {visible_items, show_menu} = this.state
    return (
      <div ref="parent" className="ui top secondary pointing menu">
        <div ref="tabbar" className="ui top secondary pointing menu" style={{paddingBottom: 0, overflow: "hidden", maxWidth: "100%"}}>
          {tabs.slice(0, visible_items).map( (s) => (
            <Item key={s.name} s={s}/>
          ) ) }
        </div>
        { (visible_items != tabs.length)  && (
          <div className={`ui dropdown icon item ${ show_menu ? "active visible" : ""}`} onClick={() => this.setState({ show_menu: !show_menu }) }>
            <i className="ui vertical ellipsis icon"/>
            { show_menu &&(
              <div className="ui menu transition visible" style={{left: -100, width: 150}}>
                {tabs.slice(visible_items).map( (s) => (
                  <Item key={s.name} s={s}/>
                ) ) }
              </div>
            )}
          </div>
        ) }
      </div>
    )
  }
}

export default TabBar

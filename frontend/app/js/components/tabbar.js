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
      this.reflow(this.props.tabs.length)
    } )
    this.reflow()
  }
  componentWillUnmount(){
    $(window).off('.tabbar')
  }
  reflow(n){
    console.log("reflow")
    const tabbar = this.refs.tabbar
    if (tabbar.clientWidth < tabbar.scrollWidth){
      const visible_items = (n || (this.state.visible_items-1))
      if (visible_items>0){
        console.log("New visible items: %o", visible_items)
        this.setState({visible_items})
        setTimeout(() => this.reflow(), 300)
      }
    }
  }
  render(){
    const {tabs} = this.props
    const {visible_items, show_menu} = this.state
    return (
      <div className="ui top secondary pointing menu">
        <div ref="tabbar" className="ui top secondary pointing menu" style={{paddingBottom: 0, overflow: "hidden", maxWidth: "100%"}}>
          {tabs.slice(0, visible_items).map( (s) => (
            <Item key={s.name} s={s}/>
          ) ) }
        </div>
        { (visible_items != tabs.length)  && (
          <div className={`ui dropdown icon item ${ show_menu ? "active visible" : ""}`} onClick={() => this.setState({ show_menu: !show_menu }) }>
            <i className="ui vertical ellipsis icon"/>
            { show_menu &&(
              <div className="ui menu transition visible" style={{left: -100}}>
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

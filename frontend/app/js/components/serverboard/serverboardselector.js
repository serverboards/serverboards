import React from 'react'
import LogoIcon from '../logoicon'

function filter_serverboard(s, search){
  let valid = true
  for (let q of search){
    if (! (
        s.name.toLowerCase().includes(q) ||
        s.shortname.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
      ) )
        valid=false
  }
  return valid
}

function sorted_by_name(serverboards){
  return serverboards.concat().sort( function(a,b){ return a.name.localeCompare(b.name) })
}

const Selector=React.createClass({
  getInitialState(){
    let serverboards = this.props.serverboards
    return {
      search: undefined,
      selected: 0,
      serverboards: sorted_by_name(serverboards)
    }
  },
  setSearch(search){
    let serverboards = this.props.serverboards
    if (search){
      search = search.toLowerCase().split(" ")
      serverboards = serverboards.filter( (s) => filter_serverboard(s, search) )
    }
    serverboards = sorted_by_name(serverboards)
    this.setState({
      selected: 0,
      search,
      serverboards
    })
  },
  componentDidMount(){
    $(this.refs.search)
      .focus()
      .on('keyup', (ev) => {
        console.log(ev.keyCode)
        switch(ev.keyCode){
          case 27:
            console.log("Close!")
            ev.preventDefault()
            ev.stopPropagation()
            this.props.onClose && this.props.onClose()
            break;
          case 13:
            console.log(this.state)
            this.handleSelectServerboard(this.state.serverboards[this.state.selected].shortname)
            break;
          case 40:
            this.setState({selected: Math.min(this.state.selected+1, this.state.serverboards.length-1)})
            break;
          case 38:
            this.setState({selected: Math.max(this.state.selected-1, 0)})
            break;
        }
      })
  },
  componentWillReceiveProps(newprops){
    this.setState({serverboards: sorted_by_name(newprops.serverboards)})
  },
  componentDidUpdate(){
    $(this.refs.el).find('.menu').animate({
      scrollTop: Math.max(0, (this.state.selected * 59) - 200)
    },100)
  },
  handleSelectServerboard(serverboard){
    this.props.onServiceSelect(serverboard)
    this.props.onClose && this.props.onClose()
  },
  render(){
    const props=this.props
    const state=this.state
    const current=props.current
    const selected=state.selected
    const serverboards = state.serverboards
    return (
      <div>
        <div style={{position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", background: "none"}} onClick={() => props.onClose && props.onClose()}/>
        <div ref="el" className={`ui vertical menu serverboard selector ${props.className}`}>
          <div className="ui search">
            <div className="ui icon input">
              <input ref="search" className="prompt" type="text" placeholder="Search by name" onChange={(ev) => this.setSearch(ev.target.value)}/>
              <i className="search icon"/>
            </div>
          </div>
          <div className="menu">
            {serverboards.map( (s, i) => (
              <a className={`item ${ s.shortname == current ? "active" : ""} ${ i == selected ? "hover" : ""}`} onClick={() => this.handleSelectServerboard(s.shortname)}>
                <div style={{paddingRight: 10}}>
                  <LogoIcon className="small" name={s.shortname}/>
                </div>
                <div>{s.name}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }
})

export default Selector

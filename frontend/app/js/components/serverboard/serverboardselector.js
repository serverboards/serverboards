import React from 'react'
import LogoIcon from '../logoicon'

const Selector=React.createClass({
  getInitialState(){
    return {
      search: undefined
    }
  },
  setSearch(search){
    this.setState({search})
  },
  componentDidMount(){
    $(this.refs.search)
      .focus()
      .on('keyup', (ev) => {
        console.log(ev)
        if (ev.keyCode==27){
          ev.preventDefault()
          ev.stopPropagation()
          this.props.onClose()
        }
      })
  },
  render(){
    const props=this.props
    const selected=props.current
    let serverboards = props.serverboards
    if (this.state.search){
      const search = this.state.search.toLowerCase().split(" ")
      serverboards = props.serverboards.filter( (s) => {
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
      })
    }
    serverboards = serverboards.concat().sort( function(a,b){ return a.name.localeCompare(b.name) })

    return (
      <div style={{position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", background: "none"}} onClick={() => props.onClose()}>
        <div className="ui vertical menu serverboard selector">
          <div className="ui search">
            <div className="ui icon input">
              <input ref="search" className="prompt" type="text" placeholder="Search by name" onChange={(ev) => this.setSearch(ev.target.value)}/>
              <i className="search icon"/>
            </div>
          </div>
          <div className="menu">
            {serverboards.map( (s) => (
              <a className={`item ${ s.shortname == selected ? "active" : ""}`} onClick={() => {props.onServiceSelect(s.shortname); props.onClose()}}>
                <div style={{display:"inline-block", paddingRight: 10}}>
                  <LogoIcon name={s.shortname}/>
                </div>
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }
})

export default Selector

import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'

class Service extends React.Component{
  constructor(props){
    super(props)
    this.state={
      tab: "cloud",
      services: [],
      filter: ""
    }
    this.setTab = (tab) => this.setState({tab})
    this.onFilter = (filter) => {
      this.setState({filter})
      if (filter!=""){
        this.setState({tab:"filter"})
      }
      else{
        this.setState({tab:"cloud"})
      }
    }
  }
  componentDidMount(){
    cache.service_catalog().then( catalog => {
      catalog=catalog.slice().sort( (a,b) => a.name.localeCompare(b.name) )
      console.log(catalog)
      this.setState({services: catalog})
    } )
  }
  render(){
    const props = this.props
    const tab = this.state.tab
    let filtered

    switch(tab){
      case "other":
        filtered = this.state.services.filter( s => s.traits.indexOf("server")==-1 && s.traits.indexOf("cloud")==-1 )
        break;
      case "filter":
        let filter = this.state.filter
        filtered = this.state.services.filter( s => (
          (s.name || "").toLocaleLowerCase().includes(filter.toLocaleLowerCase()) ||
          (s.description || "").toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ) )
        break;
      default:
        filtered = this.state.services.filter( s => s.traits.indexOf(tab)>0 )
        break;
    }
    if (tab!="other"){
    }
    else{
    }

    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input type="text" onChange={(ev) => this.onFilter(ev.target.value)} placeholder={i18n("Filter service...")}/>
          </div>
        </div>
        <h2 className="ui centered header">
          <i className="icon cloud"/>
          {i18n("Select Service Type")}
        </h2>

        <div className="ui padding extend" ref="tabs">
          { tab == "filter" ? null : (
            <div className="ui pointing secondary menu">
              <a className={`item ${tab=="cloud" ? "active" : ""}`} onClick={() => this.setTab("cloud")}>Cloud</a>
              <a className={`item ${tab=="server" ? "active" : ""}`} onClick={() => this.setTab("server")}>Server</a>
              <a className={`item ${tab=="other" ? "active" : ""}`} onClick={() => this.setTab("other")}>Other</a>
            </div>
          )}

          <div className="ui with scroll and padding">
            {filtered.map( (s) => (
              <a className="ui card">
                <h3 className="ui header">{s.name}</h3>
                <div className="description">{s.description}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }
}

export default Service

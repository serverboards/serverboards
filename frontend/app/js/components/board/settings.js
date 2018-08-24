import React from 'react'
import i18n from 'app/utils/i18n'
import Modal from 'app/components/modal'
import HoldButton from 'app/components/holdbutton'
import {map_get} from 'app/utils'
import QueryServiceSelect from 'app/containers/board/queryserviceselect'

function get_name(name=""){
  console.log("Name is ", name)
  let s = name.split('|')
  if (s.length>1)
    return s[1]
  return name
}


class Settings extends React.Component{
  constructor(props){
    super(props)
    const {dashboard} = props

    this.state = {
      name: dashboard.name,
      config: dashboard.config,
    }
  }
  componentDidMount(){
    $(this.refs.theme).dropdown({
      onChange: (val) => this.setConfig("theme", val)
    })
  }
  handleBoardUpdate(){
    console.log("Save state:", this.state)
    const {name, config} = this.state
    const {uuid, order} = this.props.dashboard

    this.props.onBoardUpdate({uuid, name, config, order})
    this.props.onClose()
  }
  handleBoardRemove(){
    this.props.onBoardRemove()
    this.props.onClose()
  }
  setConfig(key, value){
    const config =  {...this.state.config, [key]: value}
    console.log("Update config", config)
    this.setState({config})
  }
  render(){
    const {onBoardRemove, dashboard} = this.props
    return (
      <Modal>
        <div className="ui top serverboards secondary menu">
          <h3 className="ui header">{i18n("{name} dashboard settings", {name: get_name(dashboard.name)})}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.handleBoardRemove.bind(this)}>
              {i18n("Remove dashboard")}
            </HoldButton>
          </div>
        </div>
        <div className="ui text container with padding">
          <div className="ui form">
            <div className="ui field">
              <label>{i18n("Dashboard name")}</label>
              <input type="text" defaultValue={dashboard.name} onChange={(ev) => this.setState({name: ev.target.value})}/>
            </div>
            <div className="ui field">
              <label>{i18n("Style theme")}</label>
              <div className="ui selection dropdown" ref="theme">
                <input type="hidden" name="theme" onChange={(ev) => this.setConfig("theme", ev.target.value)}/>
                <i className="dropdown icon"/>
                <div className="default text">{map_get(this.state, ["config", "theme"], "Light")}</div>
                <div className="menu">
                  <div className="item" data-value="light">Light</div>
                  <div className="item" data-value="dark">Dark</div>
                </div>
              </div>
            </div>
            <QueryServiceSelect
              extractors={map_get(this.state, ["config", "extractors"])}
              onSetExtractors={(extractors) => this.setConfig("extractors", extractors)}
              />
            <div className="ui field">
              <button className="ui teal button" onClick={this.handleBoardUpdate.bind(this)}>
                {i18n("Accept changes")}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

export default Settings

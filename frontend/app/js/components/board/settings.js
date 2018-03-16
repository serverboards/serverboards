import React from 'react'
import i18n from 'app/utils/i18n'
import Modal from 'app/components/modal'
import HoldButton from 'app/components/holdbutton'

class Settings extends React.Component{
  constructor(props){
    super(props)
    const {dashboard} = props

    this.state = {
      name: dashboard.name,
      config: dashboard.config,
    }
  }
  handleBoardUpdate(){
    console.log("Save state:", this.state)
    const {name, config} = this.state
    const {uuid, order} = this.props.dashboard

    this.props.onBoardUpdate({uuid, name, config, order})
    this.props.onClose()
  }
  render(){
    const {onBoardRemove, dashboard} = this.props
    return (
      <Modal>
        <div className="ui top serverboards secondary menu">
          <h3 className="ui header">{i18n("{name} dashboard settings", dashboard)}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={onBoardRemove}>
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

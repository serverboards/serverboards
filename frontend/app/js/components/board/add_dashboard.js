import React from 'react'
import Modal from 'app/components/modal'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import rpc from 'app/rpc'

class CreateDashboard extends React.Component{
  handleCreateDashboard(){
    const props = this.props
    let name = this.refs.name.value
    rpc.call("dashboard.create", {
      project: props.project,
      name: name
    }).then( () => props.onClose() )
    .catch( e => {
      console.error(e)
      Flash.error("Could not create the dashboard. Check the logs.")
    })
  }
  render(){
    const props = this.props
    return (
      <Modal>
        <div className="ui top secondary serverboards menu">
          <h3 className="ui header">Create new dashboard</h3>
        </div>

        <div className="ui text container with padding">
          <div className="ui form">
            <div className="ui field">
              <label>{i18n("Dashboard name")}</label>
              <input type="text" className="input" ref="name" placeholder={i18n("Monitoring, tools...")}/>
            </div>
            <button className="ui button yellow" onClick={this.handleCreateDashboard.bind(this)}>
              {i18n("Create dashboard")}
            </button>
          </div>
        </div>

      </Modal>
    )
  }
}

export default CreateDashboard

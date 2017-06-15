import React from 'react'
import Modal from 'app/components/modal'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import rpc from 'app/rpc'

const CreateDashboard = React.createClass({
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
  },
  render(){
    const props = this.props
    return (
      <Modal>
        <div className="ui secondary top header">
          <h3>Create new dashboard</h3>
        </div>

        <div className="ui form">
          <div className="ui field">
            <label>{i18n("Dashboard name")}</label>
            <input type="text" className="input" ref="name" placeholder={i18n("Monitoring, tools...")}/>
          </div>
          <button className="ui button yellow" onClick={this.handleCreateDashboard}>
            {i18n("Create dashboard")}
          </button>
        </div>

      </Modal>
    )
  }
})

export default CreateDashboard

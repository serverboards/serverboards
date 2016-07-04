import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import rpc from 'app/rpc'

const ActionModal = React.createClass({
  contextTypes: {
    router: React.PropTypes.object
  },
  getInitialState(){
    return {}
  },
  triggerAction(){
    console.log(this.state)
    const action_id=this.props.action.id
    const params=$.extend({}, this.props.params, this.state)
    console.log(params)
    rpc.call("action.trigger",
      [action_id, params]).then((uuid) => {
        this.context.router.push({
          pathname: `/process/${uuid}`
        })
      })
  },
  setMissingParams(params){
    this.setState(params)
  },
  render(){
    const props=this.props
    console.log(props)

    return (
      <Modal>
        <h2 className="ui header">{props.action.name}</h2>
        <div className="ui meta">{props.action.description}</div>
        <GenericForm fields={props.missing_params} updateForm={this.setMissingParams}/>
        <div className="actions">
          <button className="ui green button" onClick={this.triggerAction}>Trigger action</button>
        </div>
      </Modal>
    )
  }
})

export default ActionModal

import event from 'app/utils/event'
import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import ProcessView from 'app/components/processes/process'

const Process = React.createClass({
  getInitialState(){
    return {
      process: undefined
    }
  },
  componentDidMount(){
    rpc.call("action.history", [this.props.params.uuid]).then( (process) => {
      this.setState({process})
    }).catch( (e) => {
      Flash.error("Could not get information of the process")
    })
  },
  render(){
    return (
      <ProcessView {...this.state} {...this.props}/>
    )
  }
})

export default Process

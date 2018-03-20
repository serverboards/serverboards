import event from 'app/utils/event'
import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import ProcessView from 'app/components/processes/process'

class Process extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      process: undefined
    }
  }
  componentDidMount(){
    rpc.call("action.get", [this.props.params.uuid]).then( (process) => {
      this.setState({process})
    }).catch( (e) => {
      Flash.error("Could not get information of the process")
    })
  }
  render(){
    return (
      <ProcessView {...this.state} {...this.props}/>
    )
  }
}

export default Process

import event from 'app/utils/event'
import ProcessesView from 'app/components/processes'
import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'

class Processes extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      processes: [],
      loading: true,
      start: null,
      startn: 0,
      count: 0
    }
  }
  componentDidMount(){
    this.update_processes(this.state.start)
  }
  update_processes(start){
    this.setState({loading: true, start})
    rpc.call("action.list", {start: start}).then( ({count,list}) => {
      this.setState({processes: list, count: count, loading: false})
    }).catch( (e) => {
      Flash.error("Error loading action history: "+e)
    })
  }
  handleNextPage(){
    let last_id=this.state.processes[this.state.processes.length-1].uuid
    this.setState({startn:this.state.startn+this.state.processes.length})
    this.update_processes(last_id)
  }
  handleFirstPage(){
    this.setState({startn:0})
    this.update_processes(null)
  }
  render(){
    return (
      <ProcessesView {...this.state} {...this.props}
        handleNextPage={this.handleNextPage.bind(this)}
        handleFirstPage={this.handleFirstPage.bind(this)}/>
    )
  }
}

export default Processes

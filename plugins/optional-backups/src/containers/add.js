const {i18n, rpc, React} = Serverboards
const {Loading} = Serverboards.Components

import View from '../components/add'

class AddBackup extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      sources: undefined,
      destinations: undefined
    }
  }
  componentDidMount(){
    rpc
      .call("plugin.component.catalog", {type: "backup source"})
      .then( sources => this.setState({sources}))
    rpc
      .call("plugin.component.catalog", {type: "backup destination"})
      .then( destinations => this.setState({destinations}))
  }
  render(){
    if (!this.state.sources || !this.state.destinations)
      return(
        <Loading>{i18n("Available destinations and sources")}</Loading>
      )
    return (
      <View {...this.props} {...this.state}/>
    )
  }
}

export default AddBackup

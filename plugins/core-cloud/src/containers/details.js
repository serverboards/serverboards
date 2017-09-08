const {rpc, plugin, React} = Serverboards
import View from '../components/details'

class Details extends React.Component{
  constructor(props){
    super(props)

    this.state={
      vmc: this.props.vmc
    }
  }
  componentDidMount(){
    const vmc = this.props.vmc
    const parent = vmc.parent
    const id = vmc.id
    plugin
      .start_call_stop("serverboards.core.cloud/daemon","details", [parent, id])
      .then( vmc => {
        console.log("Got more info: ", vmc)
        this.setState({vmc})
      })
  }
  componentShouldUpdate(nextprops){
    return true
  }
  render(){
    const vmc = this.state.vmc
    return (
      <View {...this.props} {...this.state}/>
    )
  }
}

export default Details

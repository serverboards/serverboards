const {rpc, plugin, React} = Serverboards
import View from '../components/details'

class Details extends React.Component{
  constructor(props){
    super(props)

    this.state={
      vmc: this.props.vmc
    }
  }
  updateInfo(){
    const vmc = this.props.vmc
    const parent = vmc.parent
    const id = vmc.id
    plugin
      .start_call_stop("serverboards.core.cloud/daemon","details", [parent, id])
      .then( vmc => {
        this.setState({vmc})
      })
  }
  componentDidMount(){
    this.updateInfo()
    const updateTimer = setInterval(() => this.updateInfo(), 5000)
    this.setState({updateTimer})
  }
  componentWillUnmount(){
    if (this.state.updateTimer)
      clearTimeout(this.state.updateTimer)
  }
  render(){
    const vmc = this.state.vmc
    return (
      <View {...this.props} {...this.state}/>
    )
  }
}

export default Details

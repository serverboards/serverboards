const {rpc, plugin, cache, Flash, i18n, React} = Serverboards
import View from '../components/detailstab'

class DetailsTab extends React.Component{
  constructor(props){
    super(props)

    this.state={
      vmc: this.props.vmc,
      parent: null,
      template: null,
    }
  }
  call_and_reload(calln){
    const node = this.props.vmc
    return plugin.start_call_stop("serverboards.core.cloud/daemon", calln, [node.parent, node.id])
      .then( () => this.props.reloadAll() )
      .catch( error => Flash.error(i18n("Could not perform action. Check logs.\n{error}", {error})))
  }
  onStart(){
    this.call_and_reload("start").then( () => {
      Flash.success(i18n("Started *{name}*", {name: this.props.vmc.name}))
    })
  }
  onPause(){
    this.call_and_reload("pause").then( () => {
      Flash.success(i18n("Paused *{name}*", {name: this.props.vmc.name}))
    })
  }
  onStop(){
    this.call_and_reload("stop").then( () => {
      Flash.success(i18n("Stopped *{name}*", {name: this.props.vmc.name}))
    })
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

    cache
      .service_type(this.props.vmc.type)
      .then( (template) => this.setState({template}) )
    cache
      .service( this.props.vmc.parent )
      .then( (parent) => this.setState({parent}))
  }
  componentWillUnmount(){
    if (this.state.updateTimer)
      clearTimeout(this.state.updateTimer)
  }
  render(){
    const vmc = this.state.vmc
    return (
      <View {...this.props} {...this.state}
        onStart={this.onStart.bind(this)}
        onStop={this.onStop.bind(this)}
        />
    )
  }
}

export default DetailsTab

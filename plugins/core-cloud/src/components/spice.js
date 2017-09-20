const {i18n, cache, React} = Serverboards
const {PluginScreen, Loading} = Serverboards.Components

class Spice extends React.Component{
  constructor(props){
    super(props)

    this.state = {
    }
  }
  render(){
    const config = {
      service : {
        name: this.props.vmc.name,
        config: {
          via: this.props.parent.config.server,
          port: this.props.vmc.props.spice_port
        }
      }
    }
    return (
      <PluginScreen
        plugin="serverboards.spice"
        component="screen"
        data={config}
        />
    )
  }
}

export default Spice

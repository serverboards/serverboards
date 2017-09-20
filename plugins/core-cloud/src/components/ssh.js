const {i18n, cache, plugin, React} = Serverboards
const {PluginScreen, Loading} = Serverboards.Components

class SSH extends React.Component{
  constructor(props){
    super(props)

    let ip = (
      (props.public_ips && props.public_ips[0]) ||
      (props.private_ips && props.private_ips[0])
    )


    this.state ={
      loading: true,
      proxy: null,
      ip,
      username: null,
      options: "",
      ssh_key_pub: null,
    }
  }
  componentDidMount(){
    const props = this.props.vmc.props
    const parent = this.props.parent

    let ip = (props.public_ips && props.public_ips[0])
    if (!ip){
      ip = (props.private_ips && props.private_ips[0])
      if (parent.config.server){
        cache
          .service(parent.config.server)
          .then( ssh => {
            const proxy = ssh.config.url
            let options = proxy && `# Connect through "${ssh.name}"\nProxyCommand ssh ${proxy} -q -W %h:%p\n`

            this.setState({ip, proxy, options, loading: false})
          })
      }
      else{
        this.setState({ip, loading: false, proxy: undefined})
      }
    }
    else{
      // Public IP, no proxy
      this.setState({ip, loading: false, proxy: undefined})
    }
    plugin
      .start_call_stop("serverboards.core.ssh/mgmt", "ssh_public_key", [])
      .then( ssh_key_pub => this.setState({ssh_key_pub}))
  }
  handleConnect(){
    const refs = this.refs
    this.setState({
      username: refs.username.value || "root",
      port: refs.port.value || "22",
      options: refs.options.value,
      ip: refs.ip.value
    })
  }
  render(){
      const {vmc} = this.props
      const {username, ip, proxy, loading} = this.state
      if (loading)
        return (
          <Loading>{i18n("SSH Connection data")}</Loading>
        )
      if (!username){
        return (
          <div className="ui expand centered form with padding">
            <h2 className="ui header centered">
              {i18n("Connect via SSH")}
            </h2>
            <div className="field">
              <label>{i18n("Username")}</label>
              <input type="text" placeholder={i18n("root")} ref="username"/>
            </div>
            <div className="field">
              <label>{i18n("Address")}</label>
              <input type="text" defaultValue={this.state.ip} ref="ip"/>
            </div>
            <div className="field">
              <label>{i18n("Port")}</label>
              <input type="number" placeholder={i18n("22")} ref="port"/>
            </div>
            <div className="field">
              <label>{i18n("Options")}</label>
              <textarea defaultValue={this.state.options} ref="options"/>
            </div>
            <div className="field">
              {i18n("Remember to add this public SSH key to the remote server")}
              <pre>
                {this.state.ssh_key_pub}
              </pre>
            </div>
            <div className="inline field">
              <div className="ui buttons">
                <a className="ui button teal" onClick={() => this.handleConnect()}>
                  {i18n("Connect")}
                </a>
              </div>
            </div>
          </div>
        )
      }

      const state = this.state
      const data = {
        service: {
          name: vmc.name,
          config: {
            url: `${state.username}@${state.ip}:${state.port}`,
            options: state.options
          }
        }
      }
      console.log("SSH virtual conn data", data)

      return (
        <PluginScreen
          plugin="serverboards.core.ssh"
          component="terminal"
          data={data}
          />
      )
  }
}

export default SSH

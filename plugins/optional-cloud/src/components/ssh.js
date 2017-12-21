const {i18n, cache, plugin, Flash, React} = Serverboards
const {PluginScreen, Loading} = Serverboards.Components

function maybe_ip6(ip){
  if (ip && ip.includes(":"))
    return `[${ip}]`
  return ip
}

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
      ip: maybe_ip6(ip),
      username: null,
      options: "",
      ssh_key_pub: null,
      fingerprint: i18n("Loading..."),
      fingerprint_enabled: undefined,
      finterprint_orig: null
    }
  }
  componentDidMount(){
    const props = this.props.vmc.props
    const parent = this.props.parent

    let ip = maybe_ip6(props.public_ips && props.public_ips[0])
    if (!ip){
      ip = maybe_ip6(props.private_ips && props.private_ips[0])
      if (parent.config.server){
        cache
          .service(parent.config.server)
          .then( ssh => {
            const proxy = ssh.config.url
            let options = proxy && `# Connect through "${ssh.name}"\nProxyCommand ssh ${proxy} -q -W %h:%p\n`

            this.setState({ip, proxy, options, loading: false})
            this.updateFingerprint(ip, options)
          })
      }
      else{
        this.setState({ip, loading: false, proxy: undefined})
        this.updateFingerprint(ip, "")
      }
    }
    else{
      // Public IP, no proxy
      this.setState({ip, loading: false, proxy: undefined})
      this.updateFingerprint(ip, "")
    }
    plugin
      .start_call_stop("serverboards.core.ssh/mgmt", "ssh_public_key", [])
      .then( ssh_key_pub => this.setState({ssh_key_pub}))
  }
  updateFingerprint(url, options){
    if (!url){
      if (!this.refs.ip)
        return
      url = this.refs.ip.value
      options = this.refs.options.value
    }

    this.setState({fingerprint: i18n("Loading...")})
    console.log(url, options)
    plugin
      .start_call_stop("serverboards.core.ssh/mgmt", "remote_fingerprint", {url, options})
      .then( fingerprint => this.setState({
        fingerprint: fingerprint.fingerprint,
        fingerprint_enabled: fingerprint.enabled,
        fingerprint_orig: fingerprint.fingerprint_orig
      }) )
      .catch(e => this.setState({fingerprint: i18n("Error: {e}", {e})}))
  }
  connect(){
    const refs = this.refs
    this.setState({
      username: refs.username.value || "root",
      port: refs.port.value || "22",
      options: refs.options.value,
      ip: refs.ip.value
    })
  }
  handleConnect(){
    if (!this.state.fingerprint_enabled){
      plugin
        .start_call_stop(
            "serverboards.core.ssh/mgmt",
            "toggle_remote_fingerprint",
            {
              status: {
                fingerprint_orig: this.state.fingerprint_orig,
              },
              url: this.refs.ip.value,
              options: this.refs.options.value
            })
        .then(() => this.connect() )
        .catch( e => Flash.error(e) )
    }
    else {
      this.connect()
    }
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
            <div className="ui expand with scroll">
              <div className="field">
                <label>{i18n("Username")}</label>
                <input type="text" placeholder={i18n("root")} ref="username"/>
              </div>
              <div className="field">
                <label>{i18n("Address")}</label>
                <input type="text" defaultValue={this.state.ip} ref="ip" onChange={() => this.updateFingerprint()}/>
              </div>
              <div className="field">
                <label>{i18n("Port")}</label>
                <input type="number" placeholder={i18n("22")} ref="port" onChange={() => this.updateFingerprint()}/>
              </div>
              <div className="field">
                <label>{i18n("Options")}</label>
                <textarea defaultValue={this.state.options} ref="options" onChange={() => this.updateFingerprint()}/>
              </div>
              <div className="field">
                {i18n("Remember to add this public SSH key to the remote server")}
                <pre>
                  {this.state.ssh_key_pub}
                </pre>
              </div>
              <div className="field">
                {i18n("The remote fingerprint is")}
                <pre>
                  {this.state.fingerprint}
                </pre>
                {this.state.fingerprint_enabled != undefined ? !this.state.fingerprint_enabled ? (
                  <div className="ui yellow text">{i18n("You have never connected to this SSH server")}</div>
                ) : (
                  <div className="ui green text">{i18n("You have already connected to this SSH server")}</div>
                ) : null }
              </div>
              <div className="inline field">
                <div className="ui buttons">
                  <a className="ui button teal" onClick={() => this.handleConnect()}>
                    {i18n("Connect")}
                  </a>
                </div>
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

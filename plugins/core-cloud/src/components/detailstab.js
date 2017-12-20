const {i18n, React} = Serverboards
import Details from './details'
import SSH from './ssh'
import Spice from './spice'

class DetailsTab extends React.Component{
  constructor(props){
    super(props)

    this.state={
      tab: "details"
    }
  }
  render(){
    let Section = () => null
    const section = this.state.tab

    switch(section){
      case "details":
        Section=Details
        break;
      case "ssh":
        Section=SSH
        break;
      case "spice":
        Section=Spice
        break;
    }
    console.log(this.props)
    const extra = this.props.vmc.props || {}

    const has_ssh = Boolean((extra.private_ips || extra.public_ips || []).length>0)
    const has_spice = Boolean(extra.spice_port)

    return (
      <div className="ui expand with right side menu">
        <Section {...this.props}/>

        <div className="ui side menu">
          <a className={`item ${section == "details" ? "active" : ""}`}
             data-tooltip={i18n("Details")}
             data-position="left center"
             onClick={() => this.setState({tab:"details"})}
             >
            <i className="file text outline icon"></i>
          </a>
          {has_ssh && (
            <a className={`item ${section == "ssh" ? "active" : ""}`}
               data-tooltip={i18n("SSH Remote Terminal")}
               data-position="left center"
               onClick={() => this.setState({tab:"ssh"})}
               >
              <i className="code icon"></i>
            </a>
          )}
          {has_spice && (
            <a className={`item ${section == "spice" ? "active" : ""}`}
               data-tooltip={i18n("Remote Desktop")}
               data-position="left center"
               onClick={() => this.setState({tab:"spice"})}
               >
              <i className="desktop icon"></i>
            </a>
          )}
        </div>
      </div>
    )
  }
}

export default DetailsTab

const {React, i18n, cache, Components} = Serverboards
const colorize = Serverboards.utils.colorize
const {Loading} = Components

class CloudCard extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      template: undefined,
    }
  }
  componentDidMount(){
    cache
      .service_type(this.props.item.type)
      .then( (template) => this.setState({template}) )
  }
  render(){
    if (!this.state.template){
      return (
        <div className="ui narrow card">
          <Loading>{i18n("Node information...")}</Loading>
        </div>
      )
    }
    const {item} = this.props
    const {template} = this.state
    return (
      <div className="ui narrow card">
        <div className="header">
          {template.name}
          <div className="right">
            <span className="ui text label">
              {item.state}&nbsp;
              <i className={`ui rectangular label ${colorize(item.state)}`}/>
            </span>
          </div>
        </div>
        <div className="ui padding">
          <h3 className="ui header">{item.name}</h3>
          <div className="ui meta">{item.description}</div>
        </div>
      </div>
    )
  }
}


export default CloudCard

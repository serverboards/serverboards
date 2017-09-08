const {React, i18n, cache, store, Components} = Serverboards
const colorize = Serverboards.utils.colorize
const {Loading} = Components

class CloudCard extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      template: undefined,
      parent: undefined,
    }
  }
  componentDidMount(){
    cache
      .service_type(this.props.item.type)
      .then( (template) => this.setState({template}) )
    cache
      .service( this.props.item.parent )
      .then( (parent) => this.setState({parent}))
  }
  render(){
    const {template, parent} = this.state
    if (!template || !parent){
      return (
        <div className="ui narrow card">
          <Loading>{i18n("Node information...")}</Loading>
        </div>
      )
    }
    const props = this.props
    const {item} = props
    return (
      <div className="ui narrow card">
        <div className="header">
          {template.name} | <a onClick={() => store.goto(`/services/${parent.uuid}/`)}>{parent.name}</a>
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
        <div className="ui bottom buttons">
          <a className="ui teal button" onClick={props.onStart}><i className="ui icon play"/></a>
          <a className="ui button" onClick={props.onPause}><i className="ui icon pause"/></a>
          <a className="ui button" onClick={props.onStop}><i className="ui icon stop"/></a>
        </div>
      </div>
    )
  }
}


export default CloudCard

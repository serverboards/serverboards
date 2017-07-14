import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import store from 'app/utils/store'
import Loading from 'app/components/loading'
import Icon from '../../iconicon'
import Card from 'app/components/card'
import {MarkdownPreview} from 'react-marked-markdown'

class ServiceSelector extends React.Component{
  constructor(props){
    super(constructor)
    this.state={
      filter: "",
      type: undefined,
      services: []
    }
  }
  componentDidMount(){
    const current_project = store.getState().project.current
    cache.service_type(this.props.type).then( type => this.setState({type}) )
    cache.services().then( services => {
      services = services.filter( s=> this.props.type == s.type && s.projects.includes(current_project) )
      this.setState({services})
    })
  }
  render(){
    const {type} = this.state
    if (!type)
      return (
        <Loading>{i18n("Services")}</Loading>
      )
    const plugin_id = type.type.split('/')[0]
    console.log("Type is %o", type)
    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input type="text" onChange={(ev) => this.onFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
          </div>
        </div>
        <h2 className="ui centered header">
          <Icon icon={type.icon || "server"} plugin={plugin_id}/>
          <span>{i18n(`Select a ${type.name} or create one`)}</span>
        </h2>
        <div className="ui padding">
          <MarkdownPreview value={type.description}/>
        </div>

        <div className="ui cards v2 with scroll and padding">
          {this.state.services.map(s => (
            <Card
              container="a"
              key={s.uuid}
              icon={type.icon}
              tags={s.tags}
              plugin={plugin_id}
              title={s.name}
              description={s.description}
              />
          )) }
        </div>
        <div className="right aligned">
          <span className="ui buttons">
            <button className="ui button basic" onClick={this.props.onPrevious}>{i18n("Previous step")}</button>
            <button className="ui button teal">{i18n("Create new {type} connection", {type: type.name})}</button>
          </span>
        </div>
      </div>
    )
  }
}

export default ServiceSelector

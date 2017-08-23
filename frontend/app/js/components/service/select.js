import React from 'react'

import Card from './card_v2'
import Loading from 'app/components/loading'
import cache from 'app/utils/cache'
import i18n from 'app/utils/i18n'

class ServiceSelect extends React.Component{
  constructor(props){
    super(props)
    this.state={
      services: undefined
    }
  }
  componentDidMount(){
    const type=this.props.type
    const filter=this.props.filter || ((s) => true)

    cache
      .services()
      .then(ss => ss.filter( filter ) )
      .then(services => this.setState({services}))
  }
  render(){
    const services = this.state.services
    if (!services){
      return <Loading>Services</Loading>
    }
    console.log("services", services)
    if(services.length==0){
      return <div className="ui meta">{i18n("There are no services of this type")}</div>
    }
    return (
      <div className="ui service cards">
        {services.map( s => (
          <Card
            service={s}
            onClick={() => this.props.onSelect(s)}
            bottomElement={this.props.bottomElement}
            />

        ))}
      </div>
    )
  }
}

export default ServiceSelect

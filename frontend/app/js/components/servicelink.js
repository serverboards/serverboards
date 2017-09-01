import React from 'react'
import cache from 'app/utils/cache'
import {goto} from 'app/utils/store'

class ServiceLink extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      name: undefined
    }
  }
  componentDidMount(){
    cache
      .service(this.props.service)
      .then( s => this.setState({name: s.name}))
  }
  render(){
    return (
      <a onClick={() => goto(`/services/${this.props.service}/`)} style={{cursor:"pointer"}}>
        {this.state.name || this.props.service}
      </a>
    )
  }
}

export default ServiceLink

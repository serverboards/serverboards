import React from 'react'
import { unwrap } from 'app/utils'

const Subscribed = React.createClass({
  componentDidMount(){
    event.subscribe( unwrap(options.subscriptions, this.props) )
  },
  componentWillUnmount(){
    event.unsubscribe( unwrap(options.subscriptions, this.props) )
  },
  render(){
    return <L2 {...this.props} subscriptions={undefined}/>
  }
})

export default Subscribed

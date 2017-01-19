import React from 'react'
import { unwrap } from 'app/utils'
import event from 'app/utils/event'

const Subscribed = React.createClass({
  componentDidMount(){
    const subscriptions = unwrap(this.props.subscriptions, this.props)
    for (let k in subscriptions)
      event.on(k, (d) => {
        console.log("Got event %o/%o", k, d)
        const updates = subscriptions[k](d)
        this.setState(updates)
      })
  },
  componentWillUnmount(){
    const subscriptions = unwrap(this.props.subscriptions, this.props)
    for (let k in subscriptions)
      event.off(k, subscriptions[k])
  },
  render(){
    const L2=this.props.component
    return <L2 {...this.props} component={undefined} subscriptions={undefined}/>
  }
})

export default Subscribed

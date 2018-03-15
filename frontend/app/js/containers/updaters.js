import React from 'react'
import { unwrap } from 'app/utils'

class Updaters extends React.createClass{
  componentDidMount(){
    const updates = unwrap(this.props.store_enter, this.context.store.getState(), this.props)
    updates.map( (u) => this.context.store.dispatch(u()) )
  }
  componentWillUnmount(){
    const store_clean = unwrap(this.props.store_exit, this.context.store.getState(), this.props)
    store_clean.map( (u) => this.context.store.dispatch(u()) )
  }
  render(){
    const View = this.props.component
    return <View {...this.props}/>
  }
}

Updaters.contextTypes = {
  store: React.PropTypes.object
}

export default Updaters

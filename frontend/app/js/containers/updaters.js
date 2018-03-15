import React from 'react'
import { unwrap } from 'app/utils'
import PropTypes from 'prop-types'

class Updaters extends React.Component{
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
  store: PropTypes.object
}

export default Updaters

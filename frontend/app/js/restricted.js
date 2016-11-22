import React from 'react'
import {has_perm, perms} from 'app/utils/perms'

const Restricted = React.createClass({
  getInitialState(){
    const allowed = has_perm(this.props.perm)
    return {allowed}
  },
  render(){
    if (this.state.allowed)
      return this.props.children
    return null
  }
})

export {has_perm, perms, Restricted}
export default Restricted

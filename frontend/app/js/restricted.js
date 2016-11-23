import React from 'react'
import {has_perm, perms} from 'app/utils/perms'

const Restricted = React.createClass({
  propTypes:{
    perm: React.PropTypes.string.isRequired
  },
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

function has_perm_guard(perm, F){
  return function(props){
    return (
      <Restricted perm={perm}>
        <F {...props}/>
      </Restricted>
    )
  }
}


export {has_perm, perms, has_perm_guard, Restricted}
export default Restricted

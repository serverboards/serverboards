import React from 'react'
import {has_perm, perms} from 'app/utils/perms'

class Restricted extends React.createClass{
  constructor(props){
    super(props)
    const allowed = has_perm(this.props.perm)
    this.state = {allowed}
  }
  render(){
    if (this.state.allowed)
      return this.props.children
    return null
  }
}

Restricted.propTypes = {
  perm: React.PropTypes.string.isRequired
}

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

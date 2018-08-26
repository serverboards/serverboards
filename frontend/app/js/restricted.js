import React from 'react'
import {has_perm, perms} from 'app/utils/perms'
import PropTypes from 'prop-types'

class Restricted extends React.Component{
  constructor(props){
    super(props)
    const allowed = !this.props.perm || has_perm(this.props.perm)
    this.state = {allowed}
  }
  render(){
    if (this.state.allowed)
      return this.props.children
    return null
  }
}

Restricted.propTypes = {
  perm: PropTypes.string
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

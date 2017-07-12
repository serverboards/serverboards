import React from 'react'

function Error(props){
  return (
    <div className="ui centered fill error padding">
      <div>
        <i className="ui huge warning sign red icon"></i>
      </div>
      <div className="ui text red bold">{props.children}</div>
    </div>
  )
}


export default Error

import React from 'react'

function Profile(props){
  return (
    <div className="ui central area white background">
      <div className="ui text container" style={{"padding-top": "30px"}}>
        <span className="ui header">
          {props.user.email}
          </span>
        <dl>
          <dt>First name:</dt>
          <dd>{props.user.first_name}</dd>
          <dt>Last name:</dt>
          <dd>{props.user.last_name}</dd>
        </dl>
      </div>
    </div>
  )
}

export default Profile

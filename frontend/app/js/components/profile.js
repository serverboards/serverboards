import React from 'react'

function Profile(props){
  console.log("Render with props %o", props)
  return (
    <div className="ui main area white background">
      <div className="ui text container">
        <span className="ui header">Profile of: {props.user.email}</span>
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

import React from 'react'

function Logs(props){
  return (
    <div className="ui text container">
      <h1>No logs yet for {props.service.name}</h1>
    </div>
  )
}

export default Logs

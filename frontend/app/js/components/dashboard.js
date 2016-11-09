import React from 'react'
import ServerboardSelector from 'app/containers/serverboard/serverboardselector'
function DashBoard(props){
  return (
    <div className="ui serverboards diagonal background" style={{width: "100%", height: "calc( 100vh - 45px )"}}>
      <ServerboardSelector/>
      <a href="#/serverboard/add" className="ui massive button _add icon floating violet">
        <i className="add icon"></i>
      </a>
    </div>
  )
}

export default DashBoard

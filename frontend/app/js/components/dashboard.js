import React from 'react'
import Restricted from 'app/restricted'

function DashBoard(props){
  return (
    <div className="ui serverboards diagonal background" style={{width: "100%", height: "calc( 100vh - 45px )"}}>
      <Restricted perm="project.create">
        <a href="#/project/add" className="ui massive button _add icon floating yellow">
          <i className="add icon"></i>
        </a>
      </Restricted>
    </div>
  )
}

export default DashBoard

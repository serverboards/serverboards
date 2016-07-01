import React from 'react'
import Sidebar from 'app/containers/sidebar'

function DashBoard(props){
  return (
    <div>
      <Sidebar/>
      <a href="#/serverboard/add" className="ui massive button _add icon floating violet">
        <i className="add icon"></i>
      </a>
    </div>
  )
}

export default DashBoard

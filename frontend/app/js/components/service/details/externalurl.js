import React from 'react'

function ExternalUrl({url}){
  return (
    <iframe src={url} className="ui full height"></iframe>
  )
}

export default ExternalUrl

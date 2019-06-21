import React from 'react'
import { connect } from 'react-redux'

const sanitize=[
  [/^(.*project\/)[^/]*(.*)$/, "$1*$2"],
  [/^(.*notifications\/)[0-9]*$/, "$1*"]
  ]

function PiwikView(props){
  if (!props.tracking)
    return null
  let sane_url=props.url
  for (let r of sanitize){
    sane_url=sane_url.replace(r[0], r[1])
  }
  console.log(sane_url)

  const options = {
    url: sane_url,
    idsite: 2,
    rec: 1,
    _random: Math.ceil(Math.random()*1000000)
  }
  const params = $.param(options)
  return (
    <img src={`https://piwik.serverboards.io/piwik.php?${params}`} style={{position:"absolute", top:0, left:0, maxWidth: 0, maxHeight: 0}}/>
  )
}

const Piwik = connect(
  (state) => ({
    tracking: state.auth.tracking,
    url: `${window.location.protocol}//${window.location.host}${state.router.location.pathname && state.router.location.pathname.pathname}`
  }),
  (dispatch) => ({})
)(PiwikView)

export default Piwik

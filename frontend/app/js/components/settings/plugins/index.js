import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import {MarkdownPreview} from 'react-marked-markdown';
import ImageIcon from 'app/components/imageicon'

const icon = require("../../../../imgs/rules.svg")
require('sass/cards.sass')

function PluginCard(props){
  const p=props.plugin
  let author=p.author
  if (author.indexOf('<')>0){
    let m = author.match(/(.*)<(.*)>/)
    if (m){
      author=(
        <a href={`mailto:${m[2]}`}>{m[1]}</a>
      )
    }
  }

  return (
    <div key={p.id} className="card">
      <div>
        <i className="ui icon circle green"/> Installed
      </div>
      <div className="content">
        <ImageIcon src={icon} className="right floated" name={p.name}/>
        <h2 className="ui header">{p.name}</h2>
        <div className="ui meta bold">by {author}</div>
        <div className="ui meta italic">version {p.version}</div>

        <div className="ui description"><MarkdownPreview value={p.description}/></div>
      </div>
      <div className="extra content" style={{padding:0}}>
        <div className="ui inverted yellow menu bottom attached">
          <a className="ui right item">View details <i className="ui angle right icon"/></a>
        </div>
      </div>
    </div>
  )
}


const Plugins=React.createClass({
  getInitialState(){
    return { plugins: [] }
  },
  componentDidMount(){
    rpc.call("plugin.list",[]).then((pluginsd)=>{
      let plugins=[]
      for (let k in pluginsd){
        plugins.push(pluginsd[k])
      }
      this.setState({plugins})
    }).catch((e) => {
      Flash.error(`Could not load plugin list.\n ${e}`)
    })
  },
  render(){
    const plugins=this.state.plugins

    return (
      <div className="ui container">
        <h1 className="ui header">Plugins</h1>

        <div className="ui cards">
          {plugins.map((p) => (
            <PluginCard plugin={p}/>
          ))}
        </div>
      </div>
    )
  }
})

export default Plugins

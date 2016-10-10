import React from 'react'
import plugin from 'app/utils/plugin'
import {object_is_equal} from 'app/utils'
import {merge} from 'app/utils'

const Widget = React.createClass({
  umount: undefined,
  decorate_config(config){
    return merge(config, {serverboard: this.props.serverboard})
  },
  do_widget(props){
    return plugin.do_widget(
      props.widget,
      this.refs.el,
      this.decorate_config(props.config)
    ).then( (umount) => {
      this.umount=umount
    } )
  },
  componentDidMount(){
    plugin.load(`${this.props.widget}.js`).then(
      () => this.do_widget(this.props)
    ).catch( (e) => {
      console.error(e)
      $(this.refs.el).html(`<div class="ui negative message">Error loading widget ${this.props.widget}: ${String(e)}</div>`)
    } )
  },
  componentWillUnmount(){
    this.umount && this.umount()
  },
  componentWillReceiveProps(nextprops){
    if (!object_is_equal(nextprops.config, this.props.config)){
      this.umount && this.umount()
      $(this.refs.el).html('')
      this.do_widget(nextprops)
    }
  },
  render(){
    const config = this.props.config
    return (
      <div className="card">
        <div className="ui top mini menu">
          <span className="ui header oneline">
            {this.props.widget}
          </span>
          <a className="item right" onClick={this.props.onEdit}>
            <i className="icon configure"/>
          </a>
          <a className="item right" onClick={this.props.onEdit}>
            <i className="icon move"/>
          </a>
        </div>
        <div style={{flexGrow:1}} ref="el"/>
      </div>
    )
  }
})

export default Widget

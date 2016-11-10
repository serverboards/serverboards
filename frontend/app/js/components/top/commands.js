import React from 'react'
import Command from 'app/utils/command'
import store from 'app/utils/store'
import { push } from 'react-router-redux'

const skip_nodes={
  INPUT: true,
  TEXTAREA: true,
  BUTTON: true
}

const CommandSearch = React.createClass({
  getInitialState(){
    return {
      is_open: false,
    }
  },
  getContext(){
    const state = store.getState()
    return {
      path: state.routing.locationBeforeTransitions.pathname,
      state: state,
      goto: (path) => store.dispatch(push(path))
    }
  },
  componentDidMount(){
    let $search=$(this.refs.search)
    let self=this
    $(window).on('keyup', function(ev){
      if (ev.keyCode==27)
        self.handleToggleOpen()
      if (!self.state.is_open)
        return
      if (skip_nodes[ev.target.nodeName])
        return
      $search.find('input').focus()
    })
    $search.search({
      cache: false,
      apiSettings : {
        responseAsync(settings, callback){
          let Q = $search.search('get value').toLowerCase().split(" ")
          const context = self.getContext()

          let results = Command.search(Q, context).then((results) => {
            // Refilter
            results = results.map( (r) => {
              r.search_text =`${r.description} ${r.title}`.toLowerCase()
              return r
            })
            //console.log(settings)
            for (let q of Q){
              results = results.filter( (r) => r.search_text.indexOf(q)>=0 )
            }

            callback({results, success: true})
          })
        }
      },
      onSelect(result, response){
        if (result.run)
          result.run()
        if (result.path){
          const state = store.getState()
          store.dispatch(push(result.path))
        }

        $search
          .search("set value", "")
          .search("hide results")
        return false
      }
    })
  },
  handleToggleOpen(set_open){
    if (set_open == undefined)
      set_open=!this.state.is_open
    if (set_open){
      setTimeout(() =>
        $(this.refs.search).find('input').focus().select()
        , 20
      )
    }
    this.setState({is_open: set_open})
  },
  render(){
    const is_open=this.state.is_open
    return (
      <div className="menu">
        <div ref="search" className={`ui search ${ is_open ? "" : "hidden"}`}>
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder="Search and execute commands..."/>
            <i className="terminal icon" onClick={() => this.handleToggleOpen(false)}></i>
          </div>
          <div className="results">
          </div>
        </div>
        <a className={`item right aligned ${is_open ? "hidden" : ""}`} onClick={() => this.handleToggleOpen()}>
          <i className="ui icon terminal"/>
        </a>
      </div>
    )
  }
})

export default CommandSearch

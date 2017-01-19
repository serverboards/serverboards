import React from 'react'
import {unwrap, object_is_equal} from 'app/utils'
import event from 'app/utils/event'
import { connect } from 'react-redux'

/**
 * Expanded version of redux.connect
 *
 * I allow to do the same, but also some other
 * required funcionality, as request state, use promises for state, improved
 * propery change detection.
 *
 * To use it as a replacement, use state and handlers options.
 *
 * All options can be a list/map or a function(props, state). If its a function
 * it will be reexcuted for every state or props change (see watch), and the
 * result used.
 *
 * It creates a layered system where:
 *  1. Call the updaters
 *  2. Do subscriptions
 *  3. Get state using react redux
 *
 * options:
 *   state(state, props)
 *            same as redux first parameter.
 *            if the original props or state changes (from redux), its reexecuted
 *            see `watch` to limit this reexcution.
 *   handlers(dispatch, props)
 *            functions to be executed as handlers.
 *   subscriptions(props)
 *            Subscribes to serverboards events. At umount desubscribes. On event
 *            refreshes. Its a list of events to subscribe.
 *   store_enter(props)
 *            Functions to call for redux to update the state, for example load
 *            current service
 *   store_exit(props)
 *            Functions to call for redux to clean the state when leaving, for
 *            example unload current service.
 *   watch
 *            State elements to watch, if any changes, update the component.
 *
 * Use as redux connect: serverboards_connect(options)(View)
 */
export function serverboards_connect(options){
  return function(Component){
    let SubscribedConnect = React.createClass({
      contextTypes: {
        store: React.PropTypes.object
      },
      _componentDidMount(props){ // Wrapper to allow call with specific props
        const subscriptions = unwrap(options.subscriptions, this.props)
        event.subscribe(subscriptions)

        const updates = unwrap(options.store_enter, this.context.store.getState(), this.props)
        updates.map( (u) => this.context.store.dispatch(u()) )
      },
      _componentWillUnmount(props){ // Wrapper to allow call with specific props
        const subscriptions = unwrap(options.subscriptions, this.props)
        event.unsubscribe(subscriptions)

        const store_clean = unwrap(options.store_exit, this.context.store.getState(), this.props)
        store_clean.map( (u) => this.context.store.dispatch(u()) )
      },
      componentDidMount(){
        this._componentDidMount(this.props)
      },
      componentWillUnmount(){
        this._componentWillUnmount(this.props)
      },
      componentWillReceiveProps(newprops){
        if (!options.watch)
          return;
        let update=false
        options.watch.map( (p) => {
          if (!object_is_equal(this.props[p], newprops[p]))
            update=true
        })
        if (update){
          this._componentWillUnmount(this.props)
          this._componentDidMount(newprops)
        }
      },
      render(){
        return (
          <Component {...this.props}/>
        )
      }
    })
    return connect(options.state, options.handlers)(SubscribedConnect)
  }
}


export default serverboards_connect

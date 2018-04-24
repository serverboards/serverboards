import store from './store'
import event from './event'
import rpc from 'app/rpc'

let cache_data = {}
let wait_list = {}

/**
 * @short Uses the store for caching some data.
 *
 * When some user needs some data can call the cache.whatever and it will check
 * if it has it present, and if not, asks the server. This data is set also into
 * the store, so listeners as react-redux will have the data ready too.
 *
 * As data is store in the store it may be updated async by the proper
 * listeners.
 *
 * All the methods return a promise.
 */
const cache={
  services: cache_builder({
    store_get: () => store.getState().services.services,
    store_update: require('app/actions/service').services_update_all(),
    subscriptions: ["service.updated"]
  }),
  service_catalog: cache_builder({
    store_get: () => store.getState().services.catalog,
    store_update: require('app/actions/service').services_update_catalog()
  }),
  widget_catalog: cache_builder({
    store_get: () => store.getState().project.widget_catalog,
    store_update: require('app/actions/project').project_update_widget_catalog()
  }),
  action_catalog: cache_builder({
      store_get: () => {
        const catalog = store.getState().action.catalog
        if (catalog.length==0)
          return undefined
        return catalog
      },
      store_update: require('app/actions/action').action_catalog()
  }),
  trigger_catalog: cache_builder({
      store_get: () => store.getState().rules_v2.trigger_catalog,
      store_update: require('app/actions/rules_v2').update_trigger_catalog()
  }),
  service(service_id){
    let services = store.getState().services.services
    if (!services){
      return cache.services().then( services => services.find( s => s.uuid == service_id ) )
    }
    return Promise.resolve( services.find( s => s.uuid == service_id ) )
  },
  trigger(trigger_id){
    return cache.trigger_catalog().then( tc => tc.find( t => t.id == trigger_id ) )
  },
  service_type(type){
    return cache.service_catalog().then( sc => sc.find( s => s.type == type ) )
  },
  action(action_id){
    return cache.action_catalog().then( ac => ac.find( a => a.id == action_id ))
  },
  projects: cache_builder({
    store_get: () => store.getState().project.projects,
    store_update: require('app/actions/project').project_update_all(),
    subscriptions: ["project.updated"]
  }),
  project(shortname){
    return cache.projects().then( projects => projects.find( p => p.shortname==shortname) )
  },
  plugins(){
    var data = cache_data["plugins"]
    if (!data){
      const waiting = wait_list["plugins"]
      if (!waiting){
        wait_list["plugins"] = []
        return rpc
          .call("plugin.catalog",[])
          .then( data => {
            cache_data["plugins"] = data
            for (const  accept of wait_list["plugins"]){
              accept(data)
            }
            delete wait_list["plugins"]
            return data
          })
      }
      const  p = new Promise( (accept, reject) => {
        wait_list["plugins"] = waiting.concat(accept)
      })
      return p
    }
    return Promise.resolve(data)
  },
  plugin_component({type, id}){
    const cache_key = `plugin_component+${type}`
    var data = cache_data[cache_key]
    let ret
    if (!data){
      ret = rpc
        .call("plugin.component.catalog", {type})
        .then( data => {
          cache_data[cache_key] = data
          return data
        })
    }
    else
      ret = Promise.resolve(data)

    // Can look for a specific id
    if (id)
      ret = ret.then( items => items.find( i => i.id == id ) )

    return ret
  },
  invalidate_all(){
    store.dispatch({type: "CACHE_CLEAN_ALL"})
    cache_data={}
  },
  invalidate(name){
    if (name in cache_data)
      delete cache_data[name]
  }
}

event.on("plugins.reloaded", () => {
  console.log("Invalidate all plugins data.")
  delete cache_data["plugins"]
  for (let k of Object.keys(cache)){
    if (k.startsWith("plugin_component_")){
      delete cache[k]
    }
  }
})


// Generic cache get builder from redux actions and using the store
// Returns the function to be called to update the cache and get the promise
function cache_builder(props){
  const {store_get, store_update, subscriptions} = props
  let pending=undefined
  return function(){
    let promise=new Promise((accept, reject) => {
      const data = store_get()
      if (data){
        accept(data)
      }
      else{
        if (pending)
          pending.push({accept, reject})
        else{
          pending=[{accept, reject}]
          try{
            store_update( data => {
              try{
                if (subscriptions)
                  event.subscribe(subscriptions)
                store.dispatch(data)
                for (let {accept} of pending)
                  accept(store_get())
                pending=undefined
              } catch(e){
                if (pending)
                  for (let {reject} of pending)
                    reject(e)
                pending=undefined
              }
            })
          } catch(e) {
            for (let {reject} of pending)
              reject(e)
            pending=undefined
          }
        }
      }
    })
    return promise
  }
}

export default cache

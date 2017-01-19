import store from './store'
import event from './event'

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
      store_get: () => store.getState().rules.trigger_catalog,
      store_update: require('app/actions/rules').update_trigger_catalog()
  }),
}


// Generic cache get builder from redux actions and using the store
// Returns the function to be called to update the cache and get the promise
function cache_builder(props){
  const {store_get, store_update, subscriptions} = props
  return function(){
    let promise=new Promise((accept, reject) => {
      const data = store_get()
      if (data){
        accept(data)
      }
      else{
        try{
          store_update( data => {
            try{
              if (subscriptions)
                event.subscribe(subscriptions)
              store.dispatch(data)
              accept(store_get())
            } catch(e){
              reject(e)
            }
          })
        } catch(e) {
          reject(e)
        }
      }
    })
    return promise
  }
}

export default cache

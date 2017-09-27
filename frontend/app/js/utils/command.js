import {merge} from './index'
import cache from 'app/utils/cache'

let command_searchs = {}

/**
 * @short Adds a command search by name, function and score
 *
 * The function must return a list of {title, description, url, score} or a
 * promise of the list.
 *
 * f(Q, context)
 *
 * f may return non filtered results; will be re filtered again later.
 *
 * Then name can be used to remove the sarch later, to have context sensitive
 * searches
 */
export function add_command_search(name, f, score=0){
  command_searchs[name]={ fn: f, score: score }
}

export function remove_command_search(name){
  delete command_searchs[name]
}

/**
 * @short Performs the search over all the registered searches.
 *
 * When data is ready resolves with the search results.
 */
export function search(Q, context, set_search_results){
  let promises = Object.keys(command_searchs).map( (k) => {
    let v = command_searchs[k]
    return Promise.resolve(v.fn(Q, context)).catch( (e) => {
      console.error("%s: %o at %o", k, e, v)
      return []
    }).then( (results) => results.map( r => merge(r, {score: (r.order  || 0 ) + v.score*100} ) ) )
  } )
  let pall = Promise.all(promises).then( (results) => {
    let allr=[]
    results.map( (r) => r.map( (r) => allr.push(r) ) )
    return allr
  }).catch( (e) => {
    console.error("Aggregating the search results: %o", e)
  })
  return pall
}

add_command_search('projects', function(Q, context){
  const state = context.state
  let results = [
    {id: 'home', title: "Home project", description: "Initial home screen", path: "/"},
  ]
  if (context.path.startsWith("/")){
    results.push(
      {id: 'sbds-add', title: "Add project", description: "Add a new project", path: "/project/wizard", data: {step: 1}}
    )
  }
  if (context.path.startsWith("/project/")){
    const shortname=state.project.current
    const project=state.project.projects.find( (s) => (s.shortname == shortname) )
    if (project){
      const name=project.name
      results = results.concat( [
        {id: 'overview', title: "Overview", description: `Go to overview`, run: () => context.goto(`/project/${shortname}/overview`), score: 1},
        {id: 'services', title: "Services", description: `Go to services`, run: () => context.goto(`/project/${shortname}/services`), score: 1},
        {id: 'permissions', title: "Permissions", description: `Go to permissions`, run: () => context.goto(`/project/${shortname}/permissions`), score: 1},
        {id: 'rules', title: "Rules", description: `Go to rules`, run: () => context.goto(`/project/${shortname}/rules`), score: 1},
        {id: 'logs', title: "Logs", description: `Go to logs`, run: () => context.goto(`/project/${shortname}/logs`), score: 1},
        {id: 'settings', title: "Settings", description: `Go to settings`, run: () => context.goto(`/project/${shortname}/settings`), score: 1},
      ] )
    }
  }
  results = results.concat( state.project.projects.map( (sbds) => ( {
      id: `SBDS-${sbds.shortname}`,
      title: sbds.shortname,
      description: `Go to project ${sbds.name}`,
      path: `/project/${sbds.shortname}/`
    } ) ) )
  return results
})

add_command_search('profile', function(Q, context){
  let results = [
    { id: "profile", title: "User's profile", description: "User personal data and settings", path: "/user/profile/" },
    { id: "system-settings", title: "System settings", description: "Change system settings", path: "/settings/" },
    { id: "logs", title: "Logs", description: "System logs and errors", path: "/logs/" },
  ]

  if (context.path.startsWith("/settings/")){
    results = results.concat([
      { id: "sysset-overview", title: "Overview", description: "System settings overview", path: "/settings/" },
      { id: "sysset-users", title: "Users", description: "Manage users on the system", path: "/settings/users/" },
      { id: "sysset-groups", title: "Groups", description: "Manage of groups and permissions", path: "/settings/groups/" },
      { id: "sysset-plugins", title: "Plugins", description: "List of installed plugins", path: "/settings/plugins/" },
      { id: "sysset-system", title: "System settings", description: "System settings: email, telegram...", path: "/settings/system/" },
    ])
  }

  return results
})

add_command_search('notifications-processes', function(Q, context){
  return [
    { id: 'notifications', title: 'Notifications', description: 'Alerts, notifications and messages', path: '/notifications/list' },
    { id: 'processes', title: 'Processes', description: 'View running and stopped processes history', path: '/process/history' }
  ]
})

add_command_search('all-services', function(Q, context){
  return cache
    .services()
    .then( (services) =>{
      console.log("Get services: ", services.map( s => s.name ))
      return services.map( (s) => ({
        id: s.uuid,
        title: `${s.name}`,
        description: s.description || `Service at ${s.projects.join(', ') || "no"} project`,
        path: `/services/${s.uuid}`
      }))
    });
})

export default { search, add_command_search, remove_command_search }

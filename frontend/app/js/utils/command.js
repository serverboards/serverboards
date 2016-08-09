import {merge} from './index'

let command_searchs = {}

export function add_command_search(name, f, score=0){
  command_searchs[name]={ fn: f, score: score }
}

export function remove_command_search(name){
  delete command_searchs[name]
}

export function search(Q, context){
  //console.log("Search for %o", Q)
  return new Promise(function(resolve, reject){
    let results = []

    for(let section in command_searchs){
      let s = command_searchs[section]
      try{
        results = results.concat(s.fn(Q, context).map(
          (item) => merge(item, {score: (item.score || 0) + s.score})
        ))
      } catch(e) {
        console.error("%s: %o at %o", section, e, f)
      }
    }

    results.sort( (a,b) => b.score - a.score )

    resolve(results)
  })
}

add_command_search('serverboards', function(Q, context){
  const state = context.state
  let results = [
    {id: 'home', title: "Home serverboard", description: "Initial home screen", path: "/"},
  ]
  if (context.path.startsWith("/")){
    results.push(
      {id: 'sbds-add', title: "Add serverboard", description: "Add a new serverboard", path: "/serverboard/add"}
    )
  }
  if (context.path.startsWith("/serverboard/")){
    const shortname=state.serverboard.current
    const serverboard=state.serverboard.serverboards.find( (s) => (s.shortname == shortname) )
    if (serverboard){
      const name=serverboard.name
      results = results.concat( [
        {id: 'overview', title: "Overview", description: `Go to overview`, run: () => context.goto(`/serverboard/${shortname}/overview`), score: 1},
        {id: 'services', title: "Services", description: `Go to services`, run: () => context.goto(`/serverboard/${shortname}/services`), score: 1},
        {id: 'permissions', title: "Permissions", description: `Go to permissions`, run: () => context.goto(`/serverboard/${shortname}/permissions`), score: 1},
        {id: 'rules', title: "Rules", description: `Go to rules`, run: () => context.goto(`/serverboard/${shortname}/rules`), score: 1},
        {id: 'logs', title: "Logs", description: `Go to logs`, run: () => context.goto(`/serverboard/${shortname}/logs`), score: 1},
        {id: 'settings', title: "Settings", description: `Go to settings`, run: () => context.goto(`/serverboard/${shortname}/settings`), score: 1},
      ] )
    }
  }
  results = results.concat( state.serverboard.serverboards.map( (sbds) => ( {
      id: `SBDS-${sbds.shortname}`,
      title: sbds.shortname,
      description: `Go to serverboard ${sbds.name}`,
      path: `/serverboard/${sbds.shortname}/`
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

export default { search, add_command_search, remove_command_search }

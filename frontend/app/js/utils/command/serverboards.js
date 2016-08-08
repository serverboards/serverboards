export function search(Q, context){
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
    const name=serverboard.name
    results = results.concat( [
      {id: 'overview', title: "Overview", description: `Go to overview`, run: () => context.goto(`/serverboard/${shortname}/overview`)},
      {id: 'services', title: "Services", description: `Go to services`, run: () => context.goto(`/serverboard/${shortname}/services`)},
      {id: 'permissions', title: "Permissions", description: `Go to permissions`, run: () => context.goto(`/serverboard/${shortname}/permissions`)},
      {id: 'rules', title: "Rules", description: `Go to rules`, run: () => context.goto(`/serverboard/${shortname}/rules`)},
      {id: 'logs', title: "Logs", description: `Go to logs`, run: () => context.goto(`/serverboard/${shortname}/logs`)},
      {id: 'settings', title: "Settings", description: `Go to settings`, run: () => context.goto(`/serverboard/${shortname}/settings`)},
    ] )
  }
  results = results.concat( state.serverboard.serverboards.map( (sbds) => ( {
      id: `SBDS-${sbds.shortname}`,
      title: sbds.shortname,
      description: `Go to serverboard ${sbds.name}`,
      path: `/serverboard/${sbds.shortname}/`
    } ) ) )
  return results
}

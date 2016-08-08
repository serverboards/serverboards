export function search(Q, context){
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
}

# Permissions

Any app (frontend/backend/plugin) may create new permissions, but here is a list
of buldin ones. If possible use this ones, or if necesary, and may be useful to
be used by other users, add it here.

All permissions should be read as "I can XXX", for example "I can modify my own
user".

## Auth

auth.modify_self -- Modify my own user
auth.modify_any  -- Modify any user
auth.create_user -- Create user
auth.create_token -- Creates an auth token

## Plugins

plugin -- Can start, stop and make calls into plugins


## Services

service.add -- Add new services
service.update -- Modify service
service.delete -- Deletes service
service.info -- Gets all info from service

service.component.add -- Add new components
service.component.attach -- Attach/detach a component to an existing service
service.component.update -- Modifies component configuration
service.component.delete -- Deletes components

## Other

debug -- Debug when in debug mode

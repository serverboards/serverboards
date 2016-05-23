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
auth.info_any_user -- Can get info on any user

auth.modify_groups -- Creates/update/remove groups
auth.manage_groups -- Adds/removes users/permissions from groups

## Plugins

plugin -- Can start, stop and make calls into plugins


## Serverboards

serverboard.add -- Add/remove serverboards
serverboard.update -- Modify serverboard
serverboard.delete -- Deletes serverboard
serverboard.info -- Gets all info from serverboard

## Services

service.add -- Add/remove services
service.attach -- Attach/detach a service to an existing serverboard
service.update -- Modifies service configuration
service.delete -- Deletes services

## Event

event.emit -- Allow to emit events

## Other

debug -- Debug when in debug mode

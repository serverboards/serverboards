import rpc from 'app/rpc'
import slash from 'app/utils/slash'

const slashf=slash.factory({
  tag: (tags, context) => {context.tags=(context.tags || []).concat(tags)},
  tags: (tags, context) => {context.tags=(context.tags || []).concat(tags)},
  close: (tags, context) => {context.close=true},
  closed: (tags, context) => {context.close=true},
  open: (tags, context) => {context.open=true},
  reopen: (tags, context) => {context.open=true},
})

// Adds a comment, parses slash commands
export function parse_comment(comment_raw){
  let context = {}
  const comment = slash.parse( comment_raw, slashf, context)
  let updates=[{ type: "comment", data: comment }]

  if (context.tags){
    updates.push({ type: "set_tags", data: context.tags})
  }
  if (context.open){
    updates.push({ type: "change_status", data: "open"})
  }
  if (context.close){
    updates.push({ type: "change_status", data: "closed"})
  }
  return updates
}

export function update_issue(issue_id, update){
  return rpc.call("issues.update", [Number(issue_id), update])
}

export function update_issue_multi(issue_id, updates){
  return rpc.call("issues.update", [Number(issue_id), updates])
}

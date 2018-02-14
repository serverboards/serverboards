# `localStorage` tweaks

There are some options some of which do not have a public UI change access, and
that depend on the session. For reference they are explained here:

* dashboard_rt_period -- Period of Reat Time updates. By default update every 30 seconds.
* dashboard_end -- Datetime when the selected period ends
* dashboard_start -- Datetime when the selected period start
* dashboard_range -- Dashboard time range in seconds
* dashboard_realtime -- Dashboard is on RT mode
* servername -- By default same as connected, can be redirected for example for debugging. Only in DEV.
* issues_* -- Datetime marks of latest update seen
* last_project -- Last seen project for next visit. Else first project.
* reconnect_token -- Token that can be used to reconnect for a short period of time.
* service_view_mode -- View services as cards or list
* show_sidebar -- Sidebar is open or not.

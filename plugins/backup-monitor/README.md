# Backup Manager

Development sponsored by Tuxum Secure Systems SL.

Keeps track of remote backups.

## The trigger

It has a trigger that watches over a file everyday at the same time.

On each successful check it saves the result into a `plugin.config_set` with the
key `last-[SAH256(filename+'-'+service_uuid)]`, and value a dict with:

* `filename` -- The found file name
* `size` -- Size of the backup in MB
* `datetime` -- the ISO datetime.
* `disk_free` -- How many MB are free

## The widget

The widget at startup gets all the triggers in the current serverboard and
checks last times. Depending on this last time shows a circle with color:

* grey -- Data unknown
* green -- Done in the last 24h
* red -- Failed in the last 24h

Also shows an indication of the real filename and last time. If clicked on the
filename it opens a URL with that file in it. If on any other opens the rule.

## The manager (**TODO**)

If rules or widget are detected a new section called the manager appears that
allows easier creation of this rules, setting just the required fields:
`filepattern`, `when` and `service`.

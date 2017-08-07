# Serverboards Templates

This are plugin templates to use copying the data an replacing all data into
square brackets.


Use `serverboards-template.py [templatename] [destdir]` to create a new plugin
using a given template.

Internally serverboards template will gather all data into brackets (plugin-id,
plugin-name and so on), and ask the user for the values to fill in.

It will install everything in the given installation dir.

# I18N

Use `serverboards i18n update` and `serverboards i18n compile` to update and
compile strings. from .js, .py and manifest.yaml. With `serverboards i1n compile`
a json file is compiled that is loaded using the `i18n` component.

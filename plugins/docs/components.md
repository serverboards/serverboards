# Components

The component definitions are templates to be used at Serverboards
to define the data a component has. It does not require any functionality
and if it has is in another plugin component.

## fields

Each component can have a list of fields that are configured. Each field has
this required keys:

* id: Some unique id in this component

And this optional ones:

* name: human name of the field
* type: text|textarea|password
* validation: as defined in type at http://semantic-ui.com/behaviors/form.html#/examples
* placeholder: Text at the placeholder
* description: Long description of the field. May be used at the placeholder or
  at some tooltip.
* traits: will be matched with plugin components to allow then to access to this
  component

## Use of traits

When a service component lists some traits, and a plugin component lists any
matching trait, then the service component can access the configuration of such
component and use it. This way a service component with trait `ip` can be used
in any plugin component that requires a trait `ip`, for example to check
connectivity.

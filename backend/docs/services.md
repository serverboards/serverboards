# Serverboards services and components

Serverboards is based in services and components. A component is a specific basic
functionality provided by a single component, as an Apache web server, a Postgres
database, a Mailchimp account, or AWS account... A service as defined into
Serverboards is a set of components that provide some functionality together.

# Components

Each component define a type, traits and a provider. The type sets the generic
use of this component, as Web server, a provider what is the specific brand
and API to use to use such component, and traits indicate extra functionalities
that this component have.

Normally all data is prefilled as you select to add a "Wordpress" or an "Apache",
but internally all this data is required and used.

## Type

The type to allow an interface quering and modification. For example a single web
server may provide one URI. A SSH access may provide an IP address or DN, and
some means to exchange the Serverboards SSH public key to ease access.

Each component type provide different API methods, common to that component type.

## Traits

Each type may also provide traits that complement the type adding some features
only available sometimes. For example a web server may have the extra trait
"webdav" that indicates that the webserver also provides webdav access, and
may require extra configuration.


## Provider

Each plugin must be provided by a provider. For example for the component
Virtual Machine, an AWS provider indicates that this is a AWS VM, and that
AWS must be used when doing the generic API functions. An extra trait of AWS
may provide extra functionalities unique to AWS.


# Services

## Single Component Services

The most basic type of service is one composed of a single component. It does
not use all the features Serverboads provides, but allows basic monitoring and
management.

## Services as component sets

A service is normally composed of several components, for example a blog can be:

1. one apache server
2. one wordpress installation
3. one mysql database
4. one Debian Linux server

Also it has relation, to

5. a droplet in digital ocean
6. an account on digital ocean
7. a DNS record at GoDaddy
8. a mail account at gmail
9. an account on gmail

Not all components have to be defined, only as needed. If there is no need to
monitor specifically the database, the apache server, or the Linux server,
there is no need to specify it. But if there is some rule that requires it,
it's recommended.

## Components can be provided by services

Any component can be provided by a defined service. This allows to have a high
level interface to manage the component, but low level access to its own
components. For example a Web Server component has to be backed up by a real
server, on a real hardware. This is not needed when you use the web server to
set up a blog, but it might be necessary to properly update the real server,
or notify there are hard drive failures.

## Services as a mix of components and services

The final option is to have a mix of services and components to define your
service.

This might be to ease a hierarchization of the services or reuse of services.

# Example of definition of service

This is a flow example of use of Serverboards to define services and components.

1. Add a Blog component. When creating it jsut search for Wordpress, and
   everything is prefilled.
2. Add a social media component. Same as above, just searching for Twitter
3. Create a rule that on each new post, twits it.
4. Add a performance monitoring component. Add a pingdom.
5. Set up an alarm in serverboards that if the laency increases over 1s, sends
   you a serverboards notification.

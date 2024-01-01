# Overview

The rqst app provides new structure and visibility to Splunk project
teams, admins, and users. It takes the place of the "tracker"
spreadsheet and streamlines data source-specific collaboration. It
provides a customizable form inside of Splunk for end-users to submit
and monitor requests for data ingest. From an admin standpoint, Splunk
engineers can easily filter, view, and interact with these requests, to
include adding private notes, tags, and other information. Managers can
better understand user needs, resource requirements, and the budgetary
impact of individual requests or requests from specific parts of the
organization.

This document provides information relating to the installation and
configuration of the rqst Splunk app.

## Installation Quick Start

As a user with admin rights, perform the following on your search head:

-   Install rqst through *Apps &gt; Install app from file* or manually
    extract app tarball in your $SPLUNK\_HOME/etc/apps directory. Do not
    restart when prompted.

-   Import the initial app options file into the rqst\_options KV store
    collection. (See *KV Store Interaction* below for a recommendation
    on working with KV store collections.) The initial options file is
    found here:  
      
    $SPLUNK\_HOME/etc/apps/rqst/appserver/static/setup/rqst\_options\_initial.csv

-   Update the kvkit\_server value to point to your kvkit instance.

-   Add Splunk Admin Team user information to rqst\_team KV Store
    collection. These are the admin users that will interact with user
    requests. Be sure to flag those with approval authority with
    admin\_approver = true.

-   Adjust the *Populate Groups Collection* and *Populate Splunk Users
    Collection* reports and run them. The groups collection allows for a
    friendlier mapping of your org to Splunk role and the users
    collection exposes a list of users to non-admins.

-   Schedule the *Populate Splunk Users Collection* and the *Update
    Groups Collection* report to keep the user and group information
    current.

-   Configure and share a form for the rqst\_data collection in the
    kvkit application. The request form can be accessed by clicking on
    the new request icon in the lower right of each dashboard in the
    rqst app.

## kvkit Request Form Configuration

The kvkit application provides a tremendous amount of control over the
request form configuration and layout. The options that follow are the
recommended baseline for the request form, which is associated with the
rqst app’s rqst\_data collection (rqst &gt; rqst\_data &gt; Config).
Update the sort order, display, and descriptions as needed.

When a user opens the request form via the dashboard widget, information
about the user are passed as tokens to the kvkit form. Thus submitted
data will contain the requestor’s information even though it is not
collected by the form.

### Field-Specific Config

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 12%" />
<col style="width: 12%" />
<col style="width: 57%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Field Name</strong></th>
<th><strong>Recommended Attributes</strong></th>
<th><strong>Recommended Field Type</strong></th>
<th><strong>Recommended Field Value</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>admin_index</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="even">
<td>admin_sourcetype</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="odd">
<td>admin_user</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="even">
<td><p>custom_field</p>
<p><sub>This field can be used to collect any data. This example is for
Business Justification.</sub></p></td>
<td>Display: Business Justification</td>
<td>Dropdown</td>
<td>search: | inputlookup rqst_kv_options | makemv delim=","
custom_field_values | mvexpand custom_field_values | table
custom_field_values</td>
</tr>
<tr class="odd">
<td>data_description</td>
<td>Display: Data Short Description<br />
Required</td>
<td>Input</td>
<td></td>
</tr>
<tr class="even">
<td>data_group_access</td>
<td>Display: Stakeholder Access</td>
<td>Multiselect</td>
<td>search: | inputlookup rqst_kv_groups | table splunk_role</td>
</tr>
<tr class="odd">
<td>data_hostnames</td>
<td>Display: System Inventory</td>
<td>File</td>
<td>.csv,.xlsx,.txt</td>
</tr>
<tr class="even">
<td>data_id</td>
<td>Hidden</td>
<td>Input</td>
<td>search: | makeresults | eval empty_id=0 | appendcols [| inputlookup
rqst_kv_data | stats max(data_id) AS last_id | eval last_id=last_id + 1
| table last_id] | fillnull value=0 last_id | eval data_id=if(empty_id
!= last_id, last_id, 1) | table data_id</td>
</tr>
<tr class="odd">
<td>data_sample</td>
<td>Display: Data Sample</td>
<td>File</td>
<td>.txt,.csv,.json,.log</td>
</tr>
<tr class="even">
<td>data_tags</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="odd">
<td>data_transport</td>
<td>Display: Data Transport</td>
<td>Dropdown</td>
<td>search: | inputlookup rqst_kv_options | makemv delim=","
data_transport | mvexpand data_transport | table data_transport</td>
</tr>
<tr class="even">
<td>data_volume</td>
<td>Display: Estimated Data Volume</td>
<td>Input</td>
<td></td>
</tr>
<tr class="odd">
<td>due_date</td>
<td>Display: Date Needed</td>
<td>Date</td>
<td></td>
</tr>
<tr class="even">
<td>notes</td>
<td>Display: Notes</td>
<td>Textarea</td>
<td></td>
</tr>
<tr class="odd">
<td>origin</td>
<td>Hidden</td>
<td>Input</td>
<td>kvkit</td>
</tr>
<tr class="even">
<td>priority</td>
<td>Priority</td>
<td>Dropdown</td>
<td>Low|Medium|High</td>
</tr>
<tr class="odd">
<td>requestor_email</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="even">
<td>requestor_realname</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="odd">
<td>requestor_user</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="even">
<td>status</td>
<td>Hidden</td>
<td>Input</td>
<td></td>
</tr>
<tr class="odd">
<td>timestamp</td>
<td>Hidden</td>
<td>Input</td>
<td>search: | makeresults | eval timestamp = strftime(now(),"%Y-%m-%d
%H:%M:%S") | table timestamp</td>
</tr>
<tr class="even">
<td>use_case</td>
<td>Display: Use Case</td>
<td>Dropdown</td>
<td>search: | inputlookup rqst_kv_options | rex mode=sed field=use_case
"s/\s//g" | makemv delim="," use_case | mvexpand use_case | table
use_case</td>
</tr>
</tbody>
</table>

#### Sharing
Set the form sharing to **Open**.

#### Public Template
Set the public template to *rqst*. This template controls the look and
feel of the request form. Add your logo, update text, or completely
change styling by editing &lt;KVKIT\_HOME&gt;/views/custom/rqst.

#### Confirmation Page
Set the confirmation page to *rqst-confirmation.*

#### Post-Process Search
The following post-process search will log the request submission to the
rqst\_audit collection:

| inputlookup rqst\_kv\_data | search data\_id=!{data\_id} | eval
action\_detail="Created request", action\_type="create", timestamp=now()
| rename requestor\_user AS user | table action\_detail action\_type
data\_id timestamp user | outputlookup append=true rqst\_kv\_audit

### Alternate Request Form (without kvkit)

If you do not plan to use kvkit to serve the request form and would
rather use the request form inside of Splunk, proceed with configuration
as outlined under your preferred authentication option below.

## Authentication Option 1: Hard-Coded
-   Create a new role *rqst\_rest* with Splunk default *admin* role
    inheritance and the following capabilities: *rest\_\*.* Remove
    selected indexes from *Indexes searched by default* and *Selected
    search indexes*.

-   Create a new user *rqst\_rest* with the role of *rqst\_rest*.

-   Add the rqst\_rest password to bin/create\_request.py

## Authentication Option 2: passwords.conf**
-   Create a new role *rqst\_rest* with Splunk default *admin* role
    inheritance and the following capabilities:
    *list\_storage\_passwords, rest\_\*.* Remove selected indexes from
    *Indexes searched by default* and *Selected search indexes*.

-   Create a new user *rqst\_rest* with the role of *rqst\_rest*.

-   Create a new role *rqst\_requestor* without role inheritance and add
    only the *list\_storage\_passwords* capability or add the
    *list\_storage\_passwords* capability to existing user roles. Users
    that do not have this capability will be unable to submit requests.

-   Rename bin/create\_request.py

-   Rename bin/create\_request\_alt.py to bin/create\_request.py

Set the *rqst\_rest* user password in passwords.conf at the command line
with:

curl -k -u &lt;your\_admin\_user&gt;:&lt;your\_admin\_password&gt;
https://&lt;your\_search\_head&gt;:8089/servicesNS/nobody/rqst/storage/passwords
-d name=rqst\_rest -d password=&lt;the rqst\_rest password you set&gt;

This will look something like this:

curl -k -u admin:changeme
https://localhost:8089/servicesNS/nobody/rqst/storage/passwords -d
name=rqst\_rest -d password=restchangeme

Next, run the following:

curl -k -u &lt;your\_admin\_user&gt;:&lt;your\_admin\_password&gt;
https://&lt;your\_search\_head&gt;:8089/servicesNS/nobody/rqst/storage/passwords/\_acl
-d perms.read=\* -d sharing=global

Using the same values as our other curl example, this will look
something like this:

curl -k -u admin:changeme
https://localhost:8089/servicesNS/nobody/rqst/storage/passwords/\_acl -d
perms.read=\* -d sharing=global

### Dashboard Changes
To make use of the Splunk-native (non-kvkit) request form in the rqst
app do the following:

-   Update the rqst app navigation to point to user\_workspace\_alt
    instead of user\_workspace.

-   Edit the source of each Simple XML dashboard and remove the
    script="js/request\_popper.js" from the opening form tag. The form
    tag will look like this once removed: &lt;form theme="dark"&gt;

## Customization & Configuration Options

Certain aspects of rqst are driven by configurable options. The options
shown below are set in the rqst\_options collection.

The email notification and approval process related options are not used
by the kvkit application, as kvkit exposes and provides this
functionality by way of form configuration.

**approval\_process**

Enable or disable the approval process. If set to "false", new requests
will be set to a status of "New" and be immediately available to the
admin team. If set to "true", new requests will be set to "Approval"
status and require approval by a team member with approval authority
before being available to the admin team.

Example value: true

**priority**  

List of options for the priority field on rqst dashboards.

Example values: low, medium, high

**status**  

List of options for the status field on rqst dashboards.

Required values: New, Approval, Hold, Rejected, Working, Complete

**use\_case**  

List of options for the use case field on rqst dashboards.

Example values: security, it ops, server, mission, voice

**data\_transport**

List of options for the Data Transport field on rqst dashboards.

Example values: Universal Forwarder, Heavy Forwarder, Syslog, API

****indexer\_daily\_ingest\_target**  

Your target daily index volume in GB per indexer based on your Splunk
environment (hardware, I/O, etc.) and application mix.

Example value: 300

**cost\_per\_license\_gb**

The cost of license (GB) to be used in dashboard calculations.

Example value: 5.50

**cost\_per\_indexer**

The cost of indexer resources to be used in dashboard calculations.
Indexer resources, or Indexer Load (IDXL), is determined by requested
license / indexer\_daily\_index\_target.

Example value: 15.25

**cost\_per\_tb\_storage**

The cost of storage (TB) to be used in dashboard calculations.

Example value: 2.50

**help\_url**

The web address that the *Help* button links to in User Workspace.
Consider setting this to an internal knowledgebase or intranet site
containing information about your Splunk admin team and operations.

Example value:
https://sharepoint.yourcompany.com/something/here/splunk-admin-team

**email\_notifications**

Enable or disable email notifications. If set to "true", email
notifications will be sent to the admin team and users on request
creation and update. If set to "false", email notifications will not be
sent.

Example value: false

**email\_server**

Email server used for sending emails when requests are created/updated

Example value: smtp.gmail.com:587

**email\_new\_request\_user**

Body of the email sent to the requestor upon request submission.

Example value: Hey there user, thanks for your request. We’re on it!

**email\_new\_request\_approver**

If the approval process is enabled, the contents of the email sent to
team members with approval authority for new requests.

Example value: Hi approvers! Please do your thing.

**email\_new\_request\_admin**

If approval process is disabled, the contents of the email sent to
admins once a request is created

Example value: Hey admins! You’ve got more work to do.

**email\_updated\_request\_user**

Body of the email sent to a user when their request has been updated

Example value: Dearest user, your request has been updated! Woo!

**kvkit\_server**

The address of your kvkit instance.

Example value: https://kvkit.yourcompany.xyz:8008

## KV Store Collections

The rqst app leverages KV Store collections for all request operations.
The table below lists the collections and their role:

<table>
<colgroup>
<col style="width: 16%" />
<col style="width: 83%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Collection Name</strong></th>
<th><strong>Description</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>rqst_data</td>
<td>Contains main request information.</td>
</tr>
<tr class="even">
<td>rqst_audit</td>
<td>Contains log of activity on each request.</td>
</tr>
<tr class="odd">
<td>rqst_journal</td>
<td>Contains admin notes made on requests.</td>
</tr>
<tr class="even">
<td>rqst_groups</td>
<td>Contains mapping of Splunk role to groups, which is used to provide
organizational context.</td>
</tr>
<tr class="odd">
<td>rqst_users</td>
<td>Contains Splunk users and email addresses used to populate the
request form.</td>
</tr>
<tr class="even">
<td>rqst_team</td>
<td>Contains Splunk admin team members.</td>
</tr>
<tr class="odd">
<td>rqst_options</td>
<td>Contains options for the rqst app.</td>
</tr>
</tbody>
</table>

## KV Store Backup

Since all app data is stored in KV store collections and collections are
susceptible to accidental deletion or overwrite (e.g., unintentional
outputlookup by an admin), it’s very important that you frequently
backup all rqst collections to prevent data loss.

If you would like to learn more on this topic, see [<u>Backup and
Restore the KV
store</u>](https://docs.splunk.com/Documentation/Splunk/7.2.3/Admin/BackupKVstore)
in the Splunk docs.

## Appendix A – Open Source Software

The rqst app leverages the software identified in the table below.

<table>
<colgroup>
<col style="width: 16%" />
<col style="width: 52%" />
<col style="width: 30%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Name</strong></th>
<th><strong>URL</strong></th>
<th><strong>License Type &amp; Link</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>jQuery</td>
<td>https://jquery.com</td>
<td><a href="https://jquery.org/license/"><u>MIT</u></a></td>
</tr>
<tr class="even">
<td>Bootstrap</td>
<td><a href="https://getbootstrap.com">https://getbootstrap.com</a></td>
<td><a
href="https://getbootstrap.com/docs/4.1/about/license/"><u>MIT</u></a></td>
</tr>
<tr class="odd">
<td>Chosen.js</td>
<td>https://harvesthq.github.io/chosen/</td>
<td><a
href="https://getbootstrap.com/docs/4.1/about/license/"><u>MIT</u></a></td>
</tr>
<tr class="even">
<td>DOMPurify</td>
<td>https://github.com/cure53/DOMPurify</td>
<td><a
href="https://github.com/cure53/DOMPurify/blob/master/LICENSE"><u>MPL
v2</u></a></td>
</tr>
</tbody>
</table>

'''
KV PROXY UPDATE USING STORED CREDENTIALS (PASSWORDS.CONF)
'''

# Define REST account username

USER = "rqst_rest"

import sys, json, re, urllib.request, urllib.error, urllib.parse, time, os, datetime, calendar
import splunk.rest as rest
from splunk.appserver.mrsparkle.lib.decorators import expose_page
from splunk.appserver.mrsparkle.lib.routes import route
import splunklib.client as client
import splunk.entity as entity
import splunk.search

class authRestUser(rest.BaseRestHandler):

    def handle_POST(self):
        sessionKey = self.sessionKey
        m = re.search('(?P<host>.*)\:(?P<port>\d*)', self.request["headers"]["host"])
        HOST = m.group("host")
        PORT = m.group("port")
        
        def getCredentials(sessionKey):
            try:
                entities = entity.getEntities(['admin', 'passwords'], namespace='rqst',
                owner='nobody', sessionKey=sessionKey)
            except Exception as e:
                return str(e)
            
            credentials = {}

            for i, c in list(entities.items()):
                credentials[c["username"]] = c["clear_password"]
            return credentials

        try:
            credentials = getCredentials(sessionKey)
            service = client.connect(
                host=HOST,
                port=PORT,
                username=USER,
                password=credentials[USER],
                app = "rqst",
                owner = "nobody")

            payload = self.request['payload']

            record = {}
            old_record = {}
            for el in payload.split('&'): 
                key, value = el.split('=')

                if key.startswith("new_"):
                    record[key[4:]] = urllib.parse.unquote(value)
                elif key.startswith("old_"):
                    old_record[key[4:]] = urllib.parse.unquote(value)
                else:
                    record[key] = urllib.parse.unquote(value)

            key = record["_key"]
            if record["current_user"]:
                current_user = record["current_user"]
                record["current_user"] = ""

            update_audit_body = "Set "
            for key in old_record:
                if key in record and record[key] != old_record[key] :
                    update_audit_body += "" + key + "='" + record[key].strip() + "' "


            if record["admin_notes"]:
                journal_body = {
                    "admin_user": current_user,
                    "entry": record["admin_notes"],
                    "data_id": record["data_id"],
                    "timestamp": int(round(time.time()))
                }
                record["admin_notes"] = ""

                service.request(
                    "storage/collections/data/rqst_journal",
                    method="post",
                    headers=[("content-type", "application/json")],
                    body=urllib.parse.unquote(json.dumps(journal_body)),
                    owner='nobody',
                    app='rqst'
                )

            service.request(
                "storage/collections/data/rqst_data/"+record["_key"],
                method="post",
                headers=[('content-type', 'application/json')],
                body=urllib.parse.unquote(json.dumps(record)),
                owner='nobody',
                app='rqst'
            )

            audit_body = {
                "action_detail": update_audit_body,
                "action_type": "update",
                "data_id": str(record["data_id"]),
                "timestamp": int(round(time.time())),
                "user": current_user
            }
            if update_audit_body != "Set ":

                service.request(
                    "storage/collections/data/rqst_audit",
                    method='post',
                    headers=[('content-type', 'application/json')],
                    body=urllib.parse.unquote(json.dumps(audit_body)),
                    owner='nobody',
                    app='rqst'
                )

            if "status" in record:
                if record["status"] == "Complete":
                    update_audit_body = "Request marked as complete."
                    audit_body["action_detail"] = update_audit_body

                    service.request(
                        "storage/collections/data/rqst_audit",
                        method='post',
                        headers=[('content-type', 'application/json')],
                        body=urllib.parse.unquote(json.dumps(audit_body)),
                        owner='nobody',
                        app='rqst'
                    )   
            
        except Exception as e:
            self.response.write(str(e))

    handle_GET = handle_POST

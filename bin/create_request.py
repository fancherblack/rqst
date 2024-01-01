'''
KV PROXY CREATE REQUEST WITH HARDCODED CREDENTIALS
Preferred methodology when 1) rqst is not deployed on a dedicated search head and 2) when multiple stored
credentials are in place. The stored credentials methodology using passwords.conf (provided by 
the default create_request.py) necessitates the list_storage_passwords capability which allows the display of 
/all/ cleartext passwords via | rest search - not just credentials associated with the specific app 
context.

File permissions restrict read to splunk user at the CLI and script contents are not accessible in browser. 
In the unlikely event of script compromise, the rqst_rest account only has access to the rqst KV Store 
collections.
'''

# Define REST account username

USER = "rqst_rest"
PASS = ""

import sys, json, re, urllib.request, urllib.error, urllib.parse, datetime, os, time, calendar
import configparser
from collections import OrderedDict
import splunk.rest as rest
from splunk.appserver.mrsparkle.lib.decorators import expose_page
from splunk.appserver.mrsparkle.lib.routes import route
import splunklib.client as client
import splunklib.results as results
import splunk.entity as entity
import splunk.search

config = configparser.ConfigParser()

class authRestUser(rest.BaseRestHandler):

    def handle_POST(self):
        sessionKey = self.sessionKey
        m = re.search('(?P<host>.*)\:(?P<port>\d*)', self.request["headers"]["host"])
        HOST = m.group("host")
        PORT = m.group("port")

        try:
            service = client.connect(
                host=HOST,
                port=PORT,
                username=USER,
                password=PASS,
                app = "rqst",
                owner = "nobody")

            payload = self.request['payload']
            record = {}
            for el in payload.split('&'):
                key, value = el.split('=')

                record[key] = urllib.parse.unquote(value)

            service.request(
                "storage/collections/data/rqst_data",
                method='post',
                headers=[('content-type', 'application/json')],
                body=urllib.parse.unquote(json.dumps(record)),
                owner='nobody',
                app='rqst'
            )

            pattern = '%Y-%m-%d %H:%M:%S'
            epoch = int(time.mktime(time.strptime(urllib.parse.unquote(record['timestamp']), pattern)))

            audit_body = {
                "action_detail": "Created request",
                "action_type": "create",
                "data_id": str(record["data_id"]),
                "timestamp": int(round(time.time())),
                "user": record["requestor_user"]
            }

            service.request(
                "storage/collections/data/rqst_audit",
                method='post',
                headers=[('content-type', 'application/json')],
                body=urllib.parse.unquote(json.dumps(audit_body)),
                owner='nobody',
                app='rqst'
            )
                  
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            self.response.write(str(exc_obj))

    handle_GET = handle_POST

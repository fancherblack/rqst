'''
KV PROXY CREATE REQUEST USING STORED CREDENTIALS (PASSWORDS.CONF)
The stored credentials methodology using passwords.conf requires the list_storage_passwords capability 
which allows the display of /all/ cleartext passwords via | rest search - not just credentials 
associated with the specific app context. This is a Splunk limitation.  

If 1) rqst is not deployed on a dedicated search head and 2) multiple stored credentials are in place, 
the hardcoded credentials methodology (provided by create_request_hardcoded.py) is the recommended approach.

Please contact Support or see the Admin Guide for more information on implementing the hardcoded methodology. 
'''

# Define REST account username

USER = "rqst_rest"

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

        def getCredentials(sessionKey):

            try:
                entities = entity.getEntities(['admin', 'passwords'], namespace='rqst',
                owner='nobody', sessionKey=sessionKey)
            except Exception as e:
                return str(e)
            
            credentials = []
            for i, c in list(entities.items()):
                credentials.append((c['username'], c['clear_password']))
            return credentials

        try:
            service = client.connect(token=sessionKey)

            searchquery_normal = "| rest /servicesNS/nobody/rqst/storage/passwords | where username=\"" + USER + "\" | table clear_password"

            job = service.jobs.create(searchquery_normal)

            while True:
                while not job.is_ready():
                    pass
                stats = {"isDone": job["isDone"],
                        "doneProgress": float(job["doneProgress"])*100,
                        "scanCount": int(job["scanCount"]),
                        "eventCount": int(job["eventCount"]),
                        "resultCount": int(job["resultCount"])}

                status = ("\r%(doneProgress)03.1f%%   %(scanCount)d scanned   "
                        "%(eventCount)d matched   %(resultCount)d results") % stats

                sys.stdout.write(status)
                sys.stdout.flush()
                if stats["isDone"] == "1":
                    sys.stdout.write("\n\nDone!\n\n")
                    break
                time.sleep(2)

            for result in results.ResultsReader(job.results()):
    	        res = result

            passw = res["clear_password"]

            service = client.connect(
                host=HOST,
                port=PORT,
                username=USER,
                password=passw,
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

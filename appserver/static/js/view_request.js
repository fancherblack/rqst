// <![CDATA[
// <![CDATA[
//
// LIBRARY REQUIREMENTS
//
// In the require function, we include the necessary libraries and modules for
// the HTML dashboard. Then, we pass variable names for these libraries and
// modules as function parameters, in order.
//
// When you add libraries or modules, remember to retain this mapping order
// between the library or module and its function parameter. You can do this by
// adding to the end of these lists, as shown in the commented examples below.

require([
    "splunkjs/mvc",
    "splunkjs/mvc/utils",
    "splunkjs/mvc/tokenutils",
    "underscore",
    "jquery",
    "splunkjs/mvc/simplexml",
    "splunkjs/mvc/layoutview",
    "splunkjs/mvc/simplexml/dashboardview",
    "splunkjs/mvc/simplexml/dashboard/panelref",
    "splunkjs/mvc/simplexml/element/chart",
    "splunkjs/mvc/simplexml/element/event",
    "splunkjs/mvc/simplexml/element/html",
    "splunkjs/mvc/simplexml/element/list",
    "splunkjs/mvc/simplexml/element/map",
    "splunkjs/mvc/simplexml/element/single",
    "splunkjs/mvc/simplexml/element/table",
    "splunkjs/mvc/simplexml/element/visualization",
    "splunkjs/mvc/simpleform/formutils",
    "splunkjs/mvc/simplexml/eventhandler",
    "splunkjs/mvc/simplexml/searcheventhandler",
    "splunkjs/mvc/simpleform/input/dropdown",
    "splunkjs/mvc/simpleform/input/radiogroup",
    "splunkjs/mvc/simpleform/input/linklist",
    "splunkjs/mvc/simpleform/input/multiselect",
    "splunkjs/mvc/simpleform/input/checkboxgroup",
    "splunkjs/mvc/simpleform/input/text",
    "splunkjs/mvc/simpleform/input/timerange",
    "splunkjs/mvc/simpleform/input/submit",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/savedsearchmanager",
    "splunkjs/mvc/postprocessmanager",
    "splunkjs/mvc/simplexml/urltokenmodel",
    "splunkjs/mvc/dropdownview"
    // Add comma-separated libraries and modules manually here, for example:
    // ..."splunkjs/mvc/simplexml/urltokenmodel",
    // "splunkjs/mvc/tokenforwarder"
    ],
    function(
        mvc,
        utils,
        TokenUtils,
        _,
        $,
        DashboardController,
        LayoutView,
        Dashboard,
        PanelRef,
        ChartElement,
        EventElement,
        HtmlElement,
        ListElement,
        MapElement,
        SingleElement,
        TableElement,
        VisualizationElement,
        FormUtils,
        EventHandler,
        SearchEventHandler,
        DropdownInput,
        RadioGroupInput,
        LinkListInput,
        MultiSelectInput,
        CheckboxGroupInput,
        TextInput,
        TimeRangeInput,
        SubmitButton,
        SearchManager,
        SavedSearchManager,
        PostProcessManager,
        UrlTokenModel

        // Add comma-separated parameter names here, for example:
        // ...UrlTokenModel,
        // TokenForwarder
        ) {

        var pageLoading = true;

        var DropdownView = require("splunkjs/mvc/dropdownview");

        //
        // SEARCH MANAGERS
        //

        // Get current record info
        var request_search = new SearchManager({
            "id": "request_search",
            "status_buckets": 0,
            "sample_ratio": null,
            "earliest_time": "0",
            "search": "| inputlookup rqst_kv_data | search data_id=\"$data_id$\" | table *",
            "latest_time": "$latest$",
            "cancelOnUnload": true,
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        // Send email on request cancellation
        var email_search = new SearchManager({
            id: "email_search",
            search: " | sendemail to=\"$requestor_email$\" subject=\"Splunk data request status updated\" message=\"Request Canceled\" "
        }, {tokens: true, tokenNamespace:"submitted"});

        var notification_search = new SearchManager({
            id: "notification_search",
            search: "| inputlookup rqst_kv_options | table email_notifications"
        });

        // 
        // FORM LOGIC
        // 

        document.title = "View Request";

        var body;
        var old_body;
        var email_notifs;
        var email_bodies = {};
        var tokens = mvc.Components.get('submitted');
        var service = mvc.createService();
        var curr_record = request_search.data("results", {count:0});

        // TODO: update this for clarity
        // Posts data to custom endpoint that runs create_request.py
        function UpdateRequest(data, old_data) {

            data["current_user"] = tokens.get("env:user");
            data["status"]= "Canceled";
            data["admin_notes"] = "";

            var data_dict = {};
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    data_dict["new_"+key] = data[key];
                }
            }

            for (var key in old_data) {
                if (old_data.hasOwnProperty(key)) {
                    data_dict["old_"+key] = old_data[key];
                }
            }
            service.post('/services/update_request', data_dict, function(err, response){});
        }

        // On search finish
        curr_record.on("data", function() {

            // Dictionary of key:value pairs for the current record
            body = curr_record.collection()["models"][0]["attributes"];
            old_body = curr_record.collection()["models"][0]["attributes"];

            var notifications = splunkjs.mvc.Components.getInstance("notification_search");
            var notifications_results = notifications.data("results");
            notifications_results.on("data", function(){
                var rows = notifications_results.data().rows;
                email_notifs = rows[0][0];
            });
        });

        // Pulls current user info
        service.currentUser(function(err, user){
            var requestor_email = user.properties().email;
            tokens.set("requestor_email", requestor_email);
        })

        var searchQuery = "| inputlookup rqst_kv_options | search option=email*";
        service.oneshotSearch(searchQuery, "", function(err, results){
            var fields = results.fields;
            var rows = results.rows;

            for( var i = 0; i < rows.length; i++) {
                var values = rows[i];
                email_bodies[values[0]] = values[1];
            }
        });
        
        // On submit..
        $(document).on('click', '#submit_button', function(e){
            e.preventDefault();

            body["status"] = "Canceled";

            UpdateRequest(body, old_body);
            
            // Checks for changed status
            if (body["status"] == "Canceled") {
                if ( email_notifs == "true") {
                    
                    tokens.set("email_body", email_bodies["email_updated_request_user"]);
                    searchQuery = " | sendemail to=\""+tokens.get("requestor_email")+"\" subject=\"Your request has been updated.\" message=\""+tokens.get("email_body")+"\"";
                    service.oneshotSearch(searchQuery, "", function(err, results){});
                }

            }
            setTimeout(function(){
                window.location.href = "/app/rqst/user_workspace?success=true";
            }, 3000)
        });

        
        //
        // DASHBOARD READY
        // 

        DashboardController.ready();
        pageLoading = false;

    }
);
// ]]>
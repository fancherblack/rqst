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

require.config({
    paths: {
        rqst_helpers: "../app/rqst/js/lib/rqst_helpers"
    }
});

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
    "splunkjs/ready!",
    "splunkjs/mvc/dropdownview",
    "splunkjs/mvc/multiselectview",
    "rqst_helpers",
    "DOMPurify"
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
    ) {

        let pageLoading = true;
        let RQST_helpers = require("rqst_helpers");
        let DOMPurify = require("DOMPurify");

        //
        // TOKENS
        //

        let urlTokenModel = new UrlTokenModel();
        mvc.Components.registerInstance('url', urlTokenModel);
        let defaultTokenModel = mvc.Components.getInstance('default', {create: true});
        let submittedTokenModel = mvc.Components.getInstance('submitted', {create: true});

        urlTokenModel.on('url:navigate', function() {
            defaultTokenModel.set(urlTokenModel.toJSON());
            if (!_.isEmpty(urlTokenModel.toJSON()) && !_.all(urlTokenModel.toJSON(), _.isUndefined)) {
                submitTokens();
            } else {
                submittedTokenModel.clear();
            }
        });

        defaultTokenModel.set(urlTokenModel.toJSON());

        function submitTokens() {
            FormUtils.submitForm({ replaceState: pageLoading });
        }

        function setToken(name, value) {
            defaultTokenModel.set(name, value);
            submittedTokenModel.set(name, value);
        }

        function unsetToken(name) {
            defaultTokenModel.unset(name);
            submittedTokenModel.unset(name);
        }

        var tokens = mvc.Components.get('default');

        //
        // SEARCH MANAGERS
        //

        let request_information = new SearchManager({
            "id": "request_information",
            "latest_time": "now",
            "status_buckets": 0,
            "cancelOnUnload": true,
            "earliest_time": "0",
            "sample_ratio": null,
            "search":"| inputlookup rqst_kv_data | search data_id = $data_id$ | lookup rqst_kv_team admin_user output admin_realname admin_email admin_phone | eval admin_realname=if(isnull(admin_realname),\" \",admin_realname),  admin_email=if(isnull(admin_email),\" \",admin_email), admin_index=if(isnull(admin_index),\" \",admin_index), admin_sourcetype=if(isnull(admin_sourcetype),\" \",admin_sourcetype), admin_notes=if(isnull(admin_notes),\" \",admin_email), eval data_tags=if(isnull(data_tags),\" \",data_tags), data_supporting_materials=if(isnull(data_supporting_materials),\" \",data_supporting_materials), notes=if(isnull(notes),\" \",notes) | rex field=data_sample \"/rqst/rqst_data/upload/\\w{9}-(?<data_sample_filename>.+)\" | rex field=data_hostnames \"/rqst/rqst_data/upload/\\w{9}-(?<data_hostnames_filename>.+)\" | fillnull value=\"\" data_hostnames_filename data_sample_filename",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        new SearchEventHandler({
            managerid: "request_information",
            event: "finalized",
            conditions: [
                {
                    attr: "match",
                    value: "'job.resultCount' != 0",
                    actions: [
                        {"type": "set", "token": "timestamp", "value": "$result.timestamp$"},
                        {"type": "set", "token": "admin_index", "value": "$result.admin_index$"},
                        {"type": "set", "token": "admin_email", "value": "$result.admin_email$"},
                        {"type": "set", "token": "admin_notes", "value": "$result.admin_notes$"},
                        {"type": "set", "token": "admin_phone", "value": "$result.admin_phone$"},
                        {"type": "set", "token": "admin_realname", "value": "$result.admin_realname$"},
                        {"type": "set", "token": "admin_sourcetype", "value": "$result.admin_sourcetype$"},
                        {"type": "set", "token": "use_case", "value": "$result.use_case$"},
                        {"type": "set", "token": "data_description", "value": "$result.data_description$"},
                        {"type": "set", "token": "data_hostnames", "value": "$result.data_hostnames$"},
                        {"type": "set", "token": "data_hostnames_filename", "value": "$result.data_hostnames_filename$"},
                        {"type": "set", "token": "data_tags", "value": "$result.data_tags$"},
                        {"type": "set", "token": "data_transport", "value": "$result.data_transport$"},
                        {"type": "set", "token": "data_volume", "value": "$result.data_volume$"},
                        {"type": "set", "token": "due_date", "value": "$result.due_date$"},
                        {"type": "set", "token": "priority", "value": "$result.priority$"},
                        {"type": "set", "token": "requestor_email", "value": "$result.requestor_email$"},
                        {"type": "set", "token": "requestor_realname", "value": "$result.requestor_realname$"},
                        {"type": "set", "token": "requestor_user", "value": "$result.requestor_user$"},
                        {"type": "set", "token": "data_group_access", "value": "$result.data_group_access$"},
                        {"type": "set", "token": "data_sample", "value": "$result.data_sample$"},
                        {"type": "set", "token": "data_sample_filename", "value": "$result.data_sample_filename$"},
                        {"type": "set", "token": "notes", "value": "$result.notes$"},
                        {"type": "set", "token": "status", "value": "$result.status$"},
                        {"type": "set", "token": "cost_center", "value": "$result.cost_center$"},
                        {"type": "set", "token": "custom_field", "value": "$result.custom_field$"}
                    ]
                },
                {
                    attr: "any",
                    value: "*",
                    actions: [
                        {"type": "set", "token": "request_information_badness", "value": "1"}
                    ]
                }
            ]
        });

        let user_role_rights = new SearchManager({
            "id": "user_role_rights",
            "latest_time": "now",
            "status_buckets": 0,
            "cancelOnUnload": true,
            "earliest_time": "0",
            "sample_ratio": null,
            "search": "| rest /services/authentication/users | search title=\"$requestor_user$\" | mvexpand roles | dedup title roles | rename title AS username roles AS role | fields realname username role | makemv role | join type=outer role [ rest /services/authorization/roles | rename title AS role | eval indexes=mvjoin(srchIndexesAllowed,\", \") | fields role indexes] | makemv delim=\", \" indexes | stats list(role) as role list(indexes) as indexes delim=\",\" | eval role = mvjoin(role,\", \") | mvexpand indexes | dedup indexes | mvcombine indexes delim=\",\" | eval indexes = mvjoin(indexes,\", \")",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        new SearchEventHandler({
            managerid: "user_role_rights",
            event: "finalized",
            conditions: [
                {
                    attr: "match",
                    value: "'job.resultCount' != 0",
                    actions: [
                        {"type": "set", "token": "requestor_role_actual", "value": "$result.role$"},
                        {"type": "set", "token": "requestor_indexes_actual", "value": "$result.indexes$"}
                    ]
                },
                {
                    attr: "any",
                    value: "*",
                    actions: [
                        {"type": "set", "token": "user_role_rights_badness", "value": "1"}
                    ]
                }
            ]
        });

        let option_search = new SearchManager({
            "id": "option_search",
            "search": "| inputlookup rqst_kv_options | rex mode=sed field=status \"s/,\\s/,/g\""
        });

        new SearchEventHandler({
            managerid: "option_search",
            event: "finalized",
            conditions: [
                {
                    attr: "any",
                    value: "*",
                    actions: [
                        {"type": "set", "token": "approval_process", "value": "$result.approval_process$"},
                        {"type": "set", "token": "status_opts", "value": "$result.status$"},
                        {"type": "set", "token": "email_notifications", "value": "$result.email_notifications$"},
                        {"type": "set", "token": "email_new_request_user", "value": "$result.email_new_request_user$"},
                        {"type": "set", "token": "email_new_request_approver", "value": "$result.email_new_request_approver$"},
                        {"type": "set", "token": "email_new_request_admin", "value": "$result.email_new_request_admin$"},
                        {"type": "set", "token": "email_updated_request_user", "value": "$result.email_updated_request_user$"},
                        {"type": "set", "token": "show_custom_field", "value": "$result.show_custom_field$"},
                        {"type": "set", "token": "custom_field_label", "value": "$result.custom_field_label$"},
                        {"type": "set", "token": "kvkit_server", "value": "$result.kvkit_server$"}
                    ]
                }
            ]
        });

        let search1 = new SearchManager({
            "id": "search1",
            "latest_time": "$latest$",
            "status_buckets": 0,
            "cancelOnUnload": true,
            "earliest_time": "0",
            "sample_ratio": 1,
            "search": "| inputlookup rqst_kv_audit  | eval timestamp = strftime(timestamp,\"%Y-%m-%d %H:%M:%S\") | search data_id=$data_id$ | fields timestamp user action_type action_detail | rename timestamp AS Timestamp user AS User action_type as \"Action Type\" action_detail AS \"Action Detail\"",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});
        
        let search2 = new SearchManager({
            "id": "search2",
            "latest_time": "$latest$",
            "status_buckets": 0,
            "cancelOnUnload": true,
            "earliest_time": "-24h@h",
            "sample_ratio": null,
            "search": "| inputlookup rqst_kv_data  | eval request_merged = \"(ID: \" . data_id . \") \" . timestamp  . \" \" . requestor_realname | table data_id request_merged | sort - data_id",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true});

        let search3 = new SearchManager({
            "id": "search3",
            "latest_time": "$latest$",
            "status_buckets": 0,
            "cancelOnUnload": true,
            "earliest_time": "$earliest$",
            "sample_ratio": 1,
            "search": "| inputlookup rqst_kv_journal  | eval timestamp = strftime(timestamp,\"%Y-%m-%d %H:%M:%S\") | search data_id=$data_id$ | fields timestamp admin_user entry | rename timestamp AS Timestamp admin_user AS Admin entry AS Entry | sort - Timestamp",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        let request_search = new SearchManager({
            "id": "request_search",
            "status_buckets": 0,
            "sample_ratio": null,
            "earliest_time": "$earliest$",
            "search": "| inputlookup rqst_kv_data | search data_id=\"$data_id$\" | table *",
            "latest_time": "$latest$",
            "cancelOnUnload": true,
            "auto_cancel": 90,
            "preview": false,
            "exec_mode": "blocking",
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": false
        }, {tokens: true, tokenNamespace: "submitted"});

        let sourcetype_search = new SearchManager({
            "id": "sourcetype_search",
            "status_buckets": 0,
            "sample_ratio": null,
            "earliest_time": "$earliest$",
            "search": "| metadata type=sourcetypes index=* OR index=_* | fields sourcetype"
        }, {tokens: true, tokenNamespace: "submitted"});

        new SearchEventHandler({
            managerid: "sourcetype_search",
            event: "finalized",
            conditions: [
                {
                    attr: "match",
                    value: "'job.resultCount' != 0",
                    actions: [
                        {"type": "set", "token": "admin_sourcetypes", "value": "$result.sourcetype$"},
                    ]
                }
            ]
        });

        let index_search = new SearchManager({
            "id": "index_search",
            "search": "| eventcount summarize=false index=* | dedup index | fields index",
            "preview": "false"
        }, {tokens: true, tokenNamespace: "submitted"});

        new SearchEventHandler({
            managerid: "sourcetype_search",
            event: "finalized",
            conditions: [
                {
                    attr: "match",
                    value: "'job.resultCount' != 0",
                    actions: [
                        {"type": "set", "token": "admin_indexes", "value": "$result.index$"},
                    ]
                }
            ]
        });

        let tag_search = new SearchManager({
            id: "tag_search",
            preview: false,
            cache: false,
            search: "| inputlookup rqst_kv_data | makemv data_tags delim=\",\" | mvexpand data_tags |  eval data_tags=trim(lower(data_tags)) | dedup data_tags | eval data_tags=if(isnull(data_tags),\" \",data_tags) | table data_tags | sort data_tags"
        });

        let admin_search = new SearchManager({
            id: "admin_search",
            preview: false,
            cache: false,
            search: "| inputlookup rqst_kv_team | fields admin_user admin_realname"
        });

        let team_search = new SearchManager({
            id: "team_search",
            preview: false,
            cache: false,
            search: "| inputlookup rqst_kv_team | fields admin_approver"
        });
        
        //
        // SPLUNK LAYOUT
        //

        $('header').remove();
        new LayoutView({"hideAppBar": false, "hideChrome": false, "hideSplunkBar": false})
            .render()
            .getContainerElement()
            .appendChild($('.dashboard-body')[0]);
        
        //
        // DASHBOARD EDITOR
        //

        new Dashboard({
            id: 'dashboard',
            el: $('.dashboard-body'),
            showTitle: true,
            editable: true
        }, {tokens: true}).render();

        //
        // VIEWS: VISUALIZATION ELEMENTS
        //

        let element1 = new HtmlElement({
            "id": "element1",
            "useTokens": true,
            "el": $('#element1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element1.contentLoaded());
        
        let element2 = new HtmlElement({
            "id": "element2",
            "useTokens": true,
            "el": $('#element2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element2.contentLoaded());
        
        let element3 = new HtmlElement({
            "id": "element3",
            "useTokens": true,
            "el": $('#element3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element3.contentLoaded());
        
        let element4 = new HtmlElement({
            "id": "element4",
            "useTokens": true,
            "el": $('#element4')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element4.contentLoaded());
        
        let element5 = new HtmlElement({
            "id": "element5",
            "useTokens": true,
            "el": $('#element5')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element5.contentLoaded());
        
        let element8 = new HtmlElement({
            "id": "element8",
            "useTokens": true,
            "el": $("#element8")
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        let element6 = new TableElement({
            "id": "element6",
            "count": 50,
            "dataOverlayMode": "none",
            "drilldown": "none",
            "percentagesRow": "false",
            "refresh.display": "none",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search1",
            "el": $('#element6')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        let element7 = new TableElement({
            "id": "element7",
            "count": 50,
            "dataOverlayMode": "none",
            "drilldown": "none",
            "percentagesRow": "false",
            "refresh.display": "none",
            "rowNumbers": "false",
            "totalsRow": "false",
            "wrap": "true",
            "managerid": "search3",
            "el": $('#element7')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        //
        // VIEWS: FORM INPUTS
        //

        let input1 = new DropdownInput({
            "id": "input1",
            "choices": [],
            "selectFirstChoice": false,
            "showClearButton": true,
            "labelField": "request_merged",
            "valueField": "data_id",
            "searchWhenChanged": true,
            "value": "$form.data_id$",
            "managerid": "search2",
            "el": $('#input1')
        }, {tokens: true}).render();

        input1.on("change", function(newValue) {
            FormUtils.handleValueChange(input1);
        });
        
        DashboardController.onReady(function() {
            if (!submittedTokenModel.has('earliest') && !submittedTokenModel.has('latest')) {
                submittedTokenModel.set({ earliest: '0', latest: '' });
            }
        });
        
        // Initialize time tokens to default
        if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
            defaultTokenModel.set({ earliest: '0', latest: '' });
        }
        
        if (!_.isEmpty(urlTokenModel.toJSON())){
            submitTokens();
        }
        
        // 
        // FORM LOGIC
        // 

        $(document).ready(function() {
            
            document.title = "Admin View Request";
            var curr_record = splunkjs.mvc.Components.getInstance("request_search");
            var curr_results = curr_record.data("results");
            var service = mvc.createService();
            var email_bodies = {};

            var old_body;
            var body;
            var email_notifs;
            var admin_user;
            var approval_process;
            var is_approval;
            
            if(tokens.get("data_sample") === undefined){
                $("#data_sample").hide();
            }
            var opt_search = splunkjs.mvc.Components.getInstance("option_search");
            var opt_results = opt_search.data("preview");
            opt_results.on("data", function(){
                var keys = opt_results.data().fields;
                var values = opt_results.data().rows;
                var result = {};
                keys.forEach((key, i) => result[key] = values[0][i]);
                setTimeout(function(){
                    if(result["show_custom_field"] == "true"){
                        document.getElementById("custom_field").style.display = "block";
                    }
                    populate_dropdown("status", "status_opts", tokens, curr_results);
                    email_notifs = tokens.get("email_notifications");
                    if(body["status"] == "Approval"){  
	                    // Sets the status options for requests needing approval
        	            setTimeout(function(){
                        	$("#status").empty();
                        	var opts = ["Approve","Reject","Hold"];
                        	var values = ["New","Rejected","Hold"];
                        	for (let i = 0; i < opts.length; i++) {
                        	    const opt = opts[i];
                        	    const val = values[i];
                            
                            	$("#status").append('<option value="'+val+'">'+opt+'</option>');
                        	}
                    	}, 100)
		    }
                }, 2000);


            });
            
            populateDropdown("admin_index", "admin_index", "index_search", curr_results);
            populateDropdown("admin_owner", "admin_user", "admin_search", curr_results);
            populateDropdown("admin_sourcetype", "admin_sourcetype", "sourcetype_search", curr_results);
            populateDropdown("data_tags", "data_tags", "tag_search", curr_results);

            $("#data_tags").chosen({
                width: "95%",
                create_option: true,
                persistent_create_option: true,
                skip_no_results: true
            });

            service.currentUser(function(err, user) {
                var username = user.name;
                tokens.set('current_user', username);
            });
            
            curr_results.on("data", function() {

                body = curr_results.collection()["models"][0]["attributes"];
                old_body = curr_results.collection()["models"][0]["attributes"];

                if(body["status"] == "Complete"){
                    $("#row4").hide();
                } else {
                    $("#element8").hide();
                }
                tokens.set("requestor_user", body["requestor_user"]);
                var searchQuery = "| inputlookup rqst_kv_users | where splunk_username=\""+tokens.get("requestor_user")+"\" | fields splunk_email";
                service.oneshotSearch(searchQuery, "", function(err, results){
                    let fields = results.fields;
                    let rows = results.rows;

                    tokens.set("requestor_email", rows[0][0]);
                });

                approval_process = tokens.get("approval_process");
                
                if(approval_process == "true" && body["status"] == "Approval") {

                    $("#element4 > .panel-body > .dashboard-row > .dashboard-cell:not(.approver)").hide();
                    $("#panel88").children(".dashboard-panel").hide();
                    
                    is_approval = "true";

                    var team = splunkjs.mvc.Components.getInstance("team_search");
                    var team_results = team.data("results");

                    team_results.on("data", function() {
                        is_approver = team_results.data().rows[0][0];

                        if (is_approver == "false") {
                            $("#submit_button").attr("disabled", true);
                            $("div[id*='row'] ").slice(6,9).hide();
                            $("#row7").hide();
                        }
                    });

                }
                
            });

            email_bodies["email_new_request_admin"] = tokens.get("email_new_request_user");
            email_bodies["email_new_request_approver"] = tokens.get("email_new_request_approver");
            email_bodies["email_new_request_user"] = tokens.get("email_new_request_user");
            email_bodies["email_updated_request_user"] = tokens.get("email_updated_request_user");
  
            $(document).on('click', '#submit_button', function(e){
                e.preventDefault();                

                var admin_notes = $("#admin_notes")[0].value;
                var admin_sourcetype = $("#admin_sourcetype").val();
                var admin_index = $("#admin_index").val();
                var new_status = $("#status").val();
                var tags = [];

                $(".search-choice").each(function(){
                    tags.push($(this).text());

                });

                if(tags === undefined || tags.length == 0) {
                    body["data_tags"] = '';
                } else {
                    body["data_tags"] = DOMPurify.sanitize(tags.join(","));
                }

                if(admin_user == null){
                    if($("#admin_owner").val() == null){
                        admin_user = "Unassigned";
                    } else {
                        admin_user = $("#admin_owner").val();
                    }
                }


                if (body["status"] != new_status) {
                    body["status"] = new_status;
                    
                    if ( email_notifs == "true") {                        
                        tokens.set("email_body", email_bodies["email_updated_request_user"]);
                        searchQuery = " | sendemail to=\""+tokens.get("requestor_email")+"\" subject=\"Your request has been updated.\" message=\""+tokens.get("email_body")+"\"";
                        service.oneshotSearch(searchQuery, "", function(err, results){                            
                        });
                    }
                }

                body["admin_index"] = admin_index;
                body["admin_notes"] = DOMPurify.sanitize(admin_notes);
                body["admin_sourcetype"] = admin_sourcetype;
                body["admin_user"] = admin_user;
                
                body["current_user"] = tokens.get("current_user")

                if(approval_process == "true" && is_approval == "true") {
                    body["admin_user"] = old_body["admin_user"];
                }

                UpdateRequest(body, old_body, service);

                setTimeout(function(){
                    window.location.href = "/app/rqst/request_center?success=true";
                }, 300)
            });

            $(document).on('click', '#reopen_button', function(e){
                e.preventDefault();
    
                var admin_notes = $("#admin_notes")[0].value;
                var admin_sourcetype = $("#admin_sourcetype").val();
                var admin_index = $("#admin_index").val();
                var tags = [];
                var new_status = "Working";
    
                $(".search-choice").each(function(){
                    tags.push($(this).text());

                });

                if(tags === undefined || tags.length == 0) {
                    body["data_tags"] = '';
                } else {
                    body["data_tags"] = DOMPurify.sanitize(tags.join(","));
                }

                if(admin_user == null){
                    if($("#admin_owner").val() == null){
                        admin_user = "Unassigned";
                    } else {
                        admin_user = $("#admin_owner").val();
                    }
                }

                body["admin_index"] = admin_index;
                body["admin_notes"] = DOMPurify.sanitize(admin_notes);
                body["admin_sourcetype"] = admin_sourcetype;
                body["admin_user"] = admin_user;
                
                body["current_user"] = tokens.get("current_user")

                if(approval_process == "true" && is_approval == "true") {
                    body["admin_user"] = old_body["admin_user"];
                }
                
                if (body["status"] != new_status) {
                    body["status"] = new_status;
                    
                    if ( email_notifs == "true") {                        
                        tokens.set("email_body", email_bodies["email_updated_request_user"]);
                        searchQuery = " | sendemail to=\""+tokens.get("requestor_email")+"\" subject=\"Your request has been updated.\" message=\""+tokens.get("email_body")+"\"";
                        service.oneshotSearch(searchQuery, "", function(err, results){                            
                        });
                    }

                }

                UpdateRequest(body, old_body, service);

                setTimeout(function(){
                    window.location.href = "/app/rqst/request_center?success=true";
                }, 300)
            });
        });

        //
        // DASHBOARD READY
        //

        DashboardController.ready();
        pageLoading = false;
        $("#data_sample").remove();
        if(tokens.get("data_sample") === undefined){

        }
    }
);
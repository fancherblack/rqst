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
    "splunkjs/ready!",
    "splunkjs/mvc",
    "splunkjs/mvc/simplexml",
    "splunkjs/mvc/utils",
    "splunkjs/mvc/tokenutils",
    "splunkjs/mvc/layoutview",
    "splunkjs/mvc/dropdownview",
    "splunkjs/mvc/textinputview",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/simplexml/urltokenmodel",
    "splunkjs/mvc/simplexml/dashboardview",
    "splunkjs/mvc/simplexml/element/html",
    "splunkjs/mvc/simpleform/formutils",
    "jquery",
    "underscore",
    "splunkjs/mvc/simplexml/searcheventhandler",
    "DOMPurify",
    "rqst_helpers"
    ],

    function(mvc) {
        var DropdownView = require("splunkjs/mvc/dropdownview");
        var SearchManager = require("splunkjs/mvc/searchmanager");
        var TextInputView = require("splunkjs/mvc/textinputview");
        var DOMPurify = require("DOMPurify");
        var UrlTokenModel = require("splunkjs/mvc/simplexml/urltokenmodel");
        var LayoutView = require("splunkjs/mvc/layoutview");
        var Dashboard = require("splunkjs/mvc/simplexml/dashboardview");
        var HtmlElement = require("splunkjs/mvc/simplexml/element/html");
        var DashboardController = require("splunkjs/mvc/simplexml");
        var FormUtils = require("splunkjs/mvc/simpleform/formutils");
        var SearchEventHandler = require("splunkjs/mvc/simplexml/searcheventhandler");

        var pageLoading = true;

        //
        // TOKENS
        //

        var urlTokenModel = new UrlTokenModel();
        mvc.Components.registerInstance('url', urlTokenModel);
        var defaultTokenModel = mvc.Components.getInstance('default', {create: true});
        var submittedTokenModel = mvc.Components.getInstance('submitted', {create: true});

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

        // 
        // SEARCH MANAGERS
        // 

        let option_search = new SearchManager({
            "id": "option_search",
            "search": "| inputlookup rqst_kv_options | rex mode=sed field=status \"s/,\\s/,/g\" | rex mode=sed field=use_case \"s/,\\s/,/g\" | rex mode=sed field=data_transport \"s/,\\s/,/g\""
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
                        {"type": "set", "token": "priority_opts", "value": "$result.priority$"},
                        {"type": "set", "token": "use_case_opts", "value": "$result.use_case$"},
                        {"type": "set", "token": "data_trans_opts", "value": "$result.data_transport$"},
                        {"type": "set", "token": "email_new_request_user", "value": "$result.email_new_request_user$"},
                        {"type": "set", "token": "email_new_request_approver", "value": "$result.email_new_request_approver$"},
                        {"type": "set", "token": "email_new_request_admin", "value": "$result.email_new_request_admin$"},
                        {"type": "set", "token": "email_updated_request_user", "value": "$result.email_updated_request_user$"},
                        {"type": "set", "token": "show_custom_field", "value": "$result.show_custom_field$"},
                        {"type": "set", "token": "custom_field_values", "value": "$result.custom_field_values$"},
                        {"type": "set", "token": "custom_field_label", "value": "$result.custom_field_label$"},
			{"type": "set", "token": "custom_field_description", "value": "$result.custom_field_description$"}
                    ]
                }
            ]
        });
        
        var group_list = new SearchManager({
            id: "request_groups",
            search: "| inputlookup rqst_kv_groups | sort group_alias | table group_alias"
        });

        var id_search = new SearchManager({
            id: "data_id",
            search: "| inputlookup rqst_kv_data | stats count AS data_id | eval data_id = data_id + 1"
        });

        new SearchEventHandler({
            managerid: "data_id",
            event: "done",
            conditions: [
                {
                    attr: "any",
                    value: "*",
                    actions: [
                        {"type": "set", "token": "data_id", "value": "$result.data_id$"}
                    ]
                }
            ]
        });

        var hosts_search = new SearchManager({
            id: "hosts_search",
            search: "| tstats c where index=* earliest=-15m latest=now() by host | fields - c"
        });

        var email_coll_search = new SearchManager({
            id: "email_coll_search",
            search: "| inputlookup rqst_kv_users | fields splunk_email"
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
        // FORM LOGIC
        // 

        let tokens = mvc.Components.get('default');
        let approval_process = tokens.get("approval_process");
        let email_notifs;
        let email_bodies = {};
        
        var service = mvc.createService();
        let myusers = service.users();
        service.currentUser(function(err, user) {

            var username = user.name;
            var real_name = user.properties().realname;
            
            tokens.set('requestor_user', username);
            tokens.set('requestor_realname', real_name);
            
            var searchQuery = "| inputlookup rqst_kv_users | where splunk_username=\""+tokens.get("requestor_user")+"\" | fields splunk_email";
            service.oneshotSearch(searchQuery, "", function(err, results){
                let fields = results.fields;
                let rows = results.rows;
                
                if(rows[0][0]){
                    tokens.set("requestor_email", rows[0][0]);
                } else {
                    tokens.set("requestor_email", "");
                }
            });
        });
        
        email_bodies["email_new_request_admin"] = tokens.get("email_new_request_user");
        email_bodies["email_new_request_approver"] = tokens.get("email_new_request_approver");
        email_bodies["email_new_request_user"] = tokens.get("email_new_request_user");
        
        document.title = "New Request";

        $(document).on('click', '#volume_submit', function(e) {
            e.preventDefault();

            $("#data_volume_value").val($("#gb_per_day").val());
            $(".modal-header .close").click();
        });

        $(document).on('click', '#submit_button', function(e) {
            e.preventDefault();
            
            var date = new Date();
            var day = (date.getDate() < 10 ? '0' : '') + date.getDate();
            var month = (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
            var year = date.getFullYear();

            var hours = ((date.getHours() % 12 || 12) < 10 ? '0' : '') + (date.getHours() % 12 || 12);
            var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            var seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
            var meridiem = (date.getHours() >= 12) ? 'pm' : 'am';

            var formattedDate = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

            var priority = $("#priority").val();
            var due_date = $("#datepicker")[0]['value'].split('/');
            var due_date = due_date[2] + "-" + due_date[0] + "-" + due_date[1]
            var use_case = $("#use_case").val();
            var data_description = $("#data_description")[0].value;
            var data_volume = $("#data_volume_value").val();
            var data_transport = $("#data_transport").val();
            var notes = $("#admin_notes")[0].value;
            var custom_field = $("#custom_field").val();

            if($("#group_access").val()){
                var data_group_access = $("#group_access").val().join(",");
            } else {
                var data_group_access = "";
            }

            if($("#data_hostnames").val()){
                var data_hostnames = $("#data_hostnames").val().join(",");
            } else {
                var data_hostnames = "";
            }

            tokens.set('timestamp', formattedDate);
            tokens.set('status', 'New');
            tokens.set('priority', priority);
            tokens.set('due_date', due_date);
            tokens.set('use_case', use_case);
            tokens.set('data_description', data_description);
            tokens.set('data_volume', data_volume);
            tokens.set('data_transport', data_transport);
            tokens.set('data_group_access', data_group_access);
            tokens.set('data_hostnames', data_hostnames);
            tokens.set('notes', notes);
            tokens.set('admin_user', "Unassigned");
            tokens.set('custom_field', custom_field);

            setTimeout(function(){
                
                var record = {
                    "admin_user": "Unassigned",
                    "data_id": tokens.get("data_id"),
                    "requestor_user": tokens.get("requestor_user"),
                    "requestor_realname": tokens.get("requestor_realname"),
                    "requestor_email": tokens.get("requestor_email"),
                    "timestamp": tokens.get("timestamp"),
                    "status": tokens.get("status"),
                    "priority": tokens.get("priority"),
                    "due_date": DOMPurify.sanitize(tokens.get("due_date")),
                    "use_case": tokens.get("use_case"),
                    "data_description": DOMPurify.sanitize(tokens.get("data_description")),
                    "data_volume": tokens.get("data_volume"),
                    "data_transport": tokens.get("data_transport"),
                    "data_group_access": DOMPurify.sanitize(tokens.get("data_group_access")),
                    "data_hostnames": DOMPurify.sanitize(tokens.get("data_hostnames")),
                    "data_supporting_materials": "N/A",
                    "data_tags": "",
                    "notes": DOMPurify.sanitize(tokens.get("notes")),
                    "cost_center": "",
                    "custom_field": DOMPurify.sanitize(tokens.get("custom_field"))
                };

                if(tokens.get("approval_process") == "true"){
                    record["status"] = "Approval";
                }
                
                var valid;
                var valid_list = [];
                $(".form-group").children().each(function() {
                    if($(this).attr("class") && $(this).attr("class").includes("required_field")){
                        var key = $(this).attr("id");
                        var value = $(this).val();

                        if(validateInput(value, key) == false){
                            valid = false;

                            var error_el = document.createElement("div");
                            error_el.className = "alert alert-error";
                            error_el.textContent = "Field required!";
                            error_el.style.width = "50%";

                            var error_icon = document.createElement("i");
                            error_icon.className = "icon-alert";

                            error_el.appendChild(error_icon);

                            if($(this).parent().children().size() <= 1){
                                $(this).parent()[0].appendChild(error_el);
                            }
                            valid_list.push(false);
                        } else {
                            valid_list.push(true);
                        }

                    }
                });
                if(valid_list.includes(false)){
                    return false;
                };
                
                myusers.fetch({
                    sort_key: "realname",
                    sort_dir: "asc"
                }, function(err, myusers) {
                
                    var usercoll = myusers.list();
                
                    if(email_notifs == "true"){
                        var searchQuery = "| inputlookup rqst_kv_users | where splunk_username=\""+tokens.get("requestor_user")+"\" | fields splunk_email";
                        service.oneshotSearch(searchQuery, "", function(err, results){
                            let fields = results.fields;
                            let rows = results.rows;

                            tokens.set("requestor_email", rows[0][0]);
                        });
                        tokens.set("email_body", email_bodies["email_new_request_user"]);
                        
                        searchQuery = " | sendemail to=\""+tokens.get("requestor_email")+"\" subject=\"New request submitted. Needs approval\" message=\""+tokens.get("email_new_request_user")+"\"";
                        service.oneshotSearch(searchQuery, "", function(err, results){
                            console.log(results);
                        });
                    }

                    for(var i = 0; i < usercoll.length; i++) {
                        if(email_notifs == "true" && usercoll[i].properties().email){
                            if(usercoll[i].properties().roles.includes("approver") && tokens.get("approval_process") == "true") {
                                tokens.set("requestor_email", usercoll[i].properties().email);
                                tokens.set("email_body", email_bodies["email_new_request_approver"]);
                                
                                searchQuery = " | sendemail to=\""+tokens.get("requestor_email")+"\" subject=\"New request submitted. Needs approval\" message=\""+tokens.get("email_body")+"\"";
                                service.oneshotSearch(searchQuery, "", function(err, results){
                                    console.log(err);
                                });
                            } else if (usercoll[i].properties().roles.includes("admin") && tokens.get("approval_process") != "true") {
                                tokens.set("requestor_email", usercoll[i].properties().email);
                                tokens.set("email_body", email_bodies["email_new_request_approver"]);
                                
                                searchQuery = " | sendemail to=\""+tokens.get("requestor_email")+"\" subject=\"New request submitted.\" message=\""+tokens.get("email_body")+"\"";
                                service.oneshotSearch(searchQuery, "", function(err, results){
                                    console.log(err);
                                });
                            }
                        }
                    }
                });
                
                var service = mvc.createService();
                CreateRequest(record, service, tokens);

                setTimeout(function(){
                    window.location.href = "/app/rqst/user_workspace?success=true";
                }, 3000)
            }, 100);
        });

        $("#element3").on("click", "#data_volume", function() {
            $("#myModal").toggle();
            $(".modal-backdrop").toggle();
            $("body").addClass("modal-open");

            $(".modal").css("z-index", "1050");
        });
        
        $(".modal-header").on("click", ".close", function() {
            $("#myModal").toggle();
            $(".modal-backdrop").toggle();
            $("body").removeClass("modal-open");
        });
        
        $("#eps, #event_size").on("change", function(){
            var eps = $("#eps").val();
            var event_size = $("#event_size").val();
            var gb_per_day = ((eps * event_size) * 86400) / 1024 / 1024 / 1024;
            $("#gb_per_day").val(Math.round(gb_per_day));

        });

        //
        // VIEWS: VISUALIZATION ELEMENTS
        //
        
        var element1 = new HtmlElement({
            "id": "element1",
            "useTokens": true,
            "el": $('#element1')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element1.contentLoaded());
        
        var element2 = new HtmlElement({
            "id": "element2",
            "useTokens": true,
            "el": $('#element2')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element2.contentLoaded());
        
        var element3 = new HtmlElement({
            "id": "element3",
            "useTokens": true,
            "el": $('#element3')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element3.contentLoaded());
        
        var element4 = new HtmlElement({
            "id": "element4",
            "useTokens": true,
            "el": $('#element4')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element4.contentLoaded());
        
        var element5 = new HtmlElement({
            "id": "element5",
            "useTokens": true,
            "el": $('#element5')
        }, {tokens: true, tokenNamespace: "submitted"}).render();

        DashboardController.addReadyDep(element5.contentLoaded());
        
        var opt_search = splunkjs.mvc.Components.getInstance("option_search");
        var opt_results = opt_search.data("preview");
        opt_results.on("data", function(){
            setTimeout(() => {
                populate_dropdown("priority", "priority_opts", tokens);
                populate_dropdown("use_case", "use_case_opts", tokens);
                populate_dropdown("data_transport", "data_trans_opts", tokens);
                populate_dropdown("custom_field", "custom_field_values", tokens);

                email_notifs = tokens.get("email_notifications");
    
            }, 2000);

            var keys = opt_results.data().fields;
            var values = opt_results.data().rows;
            var result = {};
            keys.forEach((key, i) => result[key] = values[0][i]);

	    if($("#custom_field_label")[0].innerHTML.includes(result["custom_field_label"]) == false){
	        $("#custom_field_label")[0].innerHTML += " "+result["custom_field_label"];
	    }
            if($("#custom_field_description")[0].innerHTML.includes(result["custom_field_description"]) == false){
	        $("#custom_field_description")[0].innerHTML += " "+result["custom_field_description"];
            }

            if(result["show_custom_field"] == "true"){
                $("#row99").show();
            }

        });
        
        $.when(createDropdown("group_access", "Select", "email_coll_search")).done(function(){

            $.when(createDropdown("group_access", "Select", "request_groups")).done(function(){
                $("#group_access").chosen({
                    width: "95%",
                    create_option: true,
                    persistent_create_option: true,
                    skip_no_results: true
                });
            });
        });

        new TextInputView({
            id: "data_description",
            value: mvc.tokenSafe("$DataDescription$"),
            el: $("#data_description")
        }).render();
        
        $("#datepicker").datepicker();
        
        $.when(createDropdown("data_hostnames", "Select Hostnames", "hosts_search")).done(function(){
            $("#data_hostnames").chosen({
                width: "95%",
                create_option: true,
                persistent_create_option: true,
                skip_no_results: true
            });
        });

        if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
            defaultTokenModel.set({ earliest: '0', latest: '' });
        }

        submitTokens();

        //
        // DASHBOARD READY
        //

        DashboardController.ready();
        pageLoading = false;

    }
);
// ]]>
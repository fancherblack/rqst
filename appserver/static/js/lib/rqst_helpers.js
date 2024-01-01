// 
// ADMIN VIEW REQUEST
// 

function setSelectedValue(selectObj, valueToSet) {
    for (var i = 0; i < selectObj.options.length; i++) {
        if( selectObj.options[i].value == valueToSet){
            $("#"+selectObj.id).val(valueToSet);
            return;
        }
    }
}

function populateDropdown(id, field_name, search_id, curr_results) {
    var deferred = new $.Deferred();

    var main_el = document.getElementById(id);
    var main_list = splunkjs.mvc.Components.getInstance(search_id);
    var main_results = main_list.data("preview");

    main_results.on("data", function() {
        var rows = main_results.data().rows;
        for(var i = 0; i < rows.length; i++) {
            var opt;
            var el = document.createElement("option");
            if(search_id == "admin_search"){
                opt = rows[i][0];
                el.textContent = rows[i][1];
                el.value = opt;
            } else {

                var opt = rows[i][0];
                var el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
            }

            if($("#"+id+" option[value=\""+opt+"\"]").length == 0){
                main_el.appendChild(el);
            }
        }
        curr_results.on("data", function() {
            body = curr_results.collection()["models"][0]["attributes"];
            
            if(body[field_name]){
                if(field_name == "data_tags"){

                    for (let i = 0; i < body[field_name].split(",").length; i++) {
                        $("#"+id).val(body[field_name].split(","));
                        $("#data_tags").trigger("chosen:updated");
                    }
                } else {
                    var objSelect = document.getElementById(id);
                    setSelectedValue(objSelect, body[field_name]);
                    
                }
            } else {
                var objSelect = document.getElementById(id);
                objSelect.options[0].selected = true;
            }
        });

        this.message = "done";
        deferred.resolve(this.message);
    });
    return deferred.promise();
}

function populate_dropdown(el_id, token_name, tokens, curr_results) {
    var deferred = new $.Deferred();
    let main_el = document.getElementById(el_id);
    let opts = tokens.get(token_name).split(",");
    for(var i=0; i < opts.length; i++) {
        let el = document.createElement("option");
        el.textContent = opts[i];
        el.value = opts[i];
        if($("#"+el_id+" option[value=\""+opts[i]+"\"]").length == 0){
            main_el.appendChild(el);
        }
    }

    if(curr_results){
        body = curr_results.collection()["models"][0]["attributes"];
        var objSelect = document.getElementById(el_id);
        if(body["status"]){
            setSelectedValue(objSelect, body["status"]);
        } else {
            objSelect.options[0].selected = true;
        }
    }
    this.message = "done";
    deferred.resolve(this.message);

    return deferred.promise();
}

function UpdateRequest(data, old_data, service) {
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

    service.post('/services/update_request', data_dict, function(err, response){     

    });
}

// 
// CREATE REQUEST
// 

function createDropdown(id, placeholder_text, search_id) {
    var deferred = new $.Deferred();
    var main_el = document.getElementById(id);
    var main_list = splunkjs.mvc.Components.getInstance(search_id);
    var  main_results = main_list.data("results");
    
    main_results.on("data", function() {
        var rows = main_results.data().rows;
        for(var i = 0; i < rows.length; i++) {
            var el = document.createElement("option");

            if(search_id == "cost_center_search") {
                var opt = rows[i][0] + " (" + rows[i][1] + ")";
                el.value = rows[i][1]
            } else {
                var opt = rows[i][0];
                el.value = opt;
            }
            el.textContent = opt;

            if($("#"+id+" option[value=\""+opt+"\"]").length == 0){
                main_el.appendChild(el);
            }
        }
        this.message = "yo";
        deferred.resolve(this.message);
    });
    return deferred.promise();
}

function validateInput(value, el){
    if((typeof(value) == "string" && value.trim() === "") || typeof(value) == "undefined" || value == null) {
        if(el == "group_access"){
            $("#"+el).addClass("is-invalid");
            $("#"+el).find("input").css('box-shadow', '0 0 1px 2px #ff1500');
        } else {
            $("#"+el).addClass('is-invalid');
            $("#"+el).css('box-shadow', '0 0 1px 2px #ff1500');
        }
        $("#"+el).focus();
        return false;
    } else {
        if(el == "group_access"){
            $("#"+el).removeClass('is-invalid');
            $("#"+el).find("input").css('box-shadow', '0');
        } else {
            $("#"+el).removeClass('is-invalid');
            $("#"+el).css('box-shadow', '0');
        }
    }
}

function FileUpload(file, data_id){
    var formData = new FormData();
    formData.append('file', file);

    $.ajax({
        type: "POST",
        url: "/en-US/splunkd/__raw/services/upload?data_id="+data_id,
        data: formData,
        processData: false,
        contentType: false,
        success: function(returnval){
        }
    });
}

function CreateRequest(data, service, tokens) {

    var body = {};

    var searchQuery = "| inputlookup rqst_kv_data | fieldsummary | fields field";
    service.oneshotSearch(searchQuery, "", function(err, results){
        var fields = results.fields;
        var rows = results.rows;

        for( var i = 0; i < rows.length; i++) {
            var field = rows[i][0];

            if(typeof(tokens.get(field)) != "undefined" || tokens.get(field) != ""){ 
                data[field] = tokens.get(field);
            } else {
                data[field] = " ";
            }
        }
    })
    data["origin"] = "request";
    service.post('/services/create_request', data, function(err, response){
    });
}

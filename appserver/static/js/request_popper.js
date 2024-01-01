/*************************************************************************************
Dashboard Helper Icon & Modal
request_popper.js v0.6

When called from dashboard.js, this script displays a feedback icon on all dashboards
with a given app. The icon launches a modal which passes global environment variables
(tokens) and pulls in an external kvkit form that the user can submit. Form submissions 
are written to the rqst_data collection in the rqst app.
*************************************************************************************/

require(['splunkjs/mvc', 'jquery', 'splunkjs/mvc/simplexml/ready!'], function (
    mvc
) {
    var envTokenModel = mvc.Components.get('env'); 
    var defaultTokenModel = mvc.Components.get("default");
    
    var user = envTokenModel.get('user');
    var user_realname = envTokenModel.get('user_realname');
    var user_email = envTokenModel.get('user_email');
    var kvkit_server = defaultTokenModel.get("kvkit_server");

    const includeFloaty =
        '<a href="#" class="float"><i class="floatyHelperIcon icon-plus-circle"></i></a><div id="floatyHelper" class="floatyModal modal fade" role="dialog"><div class="modal-dialog modal-md"><div class="floatyModal-body"><button type="button" data-dismiss="modal" aria-label="Close" class="floatyClose"><span class="floatyCloseX">&times;</span></button><iframe></iframe></div></div>';

    $('body').append(includeFloaty);

    $(function () {
        $('.float').click(function () {
            $('#floatyHelper')
                .find('iframe')
                .attr(
                    'src',
                    kvkit_server + '/form/rqst/rqst_data?drilldown&requestor_user=' +
                        user +
                        '&requestor_realname=' +
                        user_realname +
                        '&requestor_email=' +
                        user_email +
                        ''
                );
            $('#floatyHelper').modal('show');
            $('.floatyModal').addClass('showModal');
        });
    });
});

var getUrlParameter = function getUrlParameter(sParam) {
                    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                        sURLVariables = sPageURL.split('&'),
                        sParameterName,
                        i;
                
                    for (i = 0; i < sURLVariables.length; i++) {
                        sParameterName = sURLVariables[i].split('=');
                
                        if (sParameterName[0] === sParam) {
                            return sParameterName[1] === undefined ? true : sParameterName[1];
                        }
                    }
                };

var submit = getUrlParameter('success');

if (submit != null) {
    document.getElementById('confirmation_panel').innerHTML="Success!";
    window.setTimeout(fadeout, 8000);
}

function fadeout() {
    document.getElementById('confirmation_panel').style.opacity = '0';
}
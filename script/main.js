//Selected validation group.
var selectedGroup = "";
//Results from the validation run.
var results = [];
//User info.
var user = {};
var userSettings = {};
//Array of all validation rules that have been interacted with.
var userInteractedActions = [];

var allDownIdOrgUnits = [];
var userOrgUnitsName = [];

//Ids of dashboards matched with the ids of groups they belong to.
var groupBelongsToDashboard = {'ZC1KKn6KNG3': 'UUF1YTjZ0nu',
                               'dNZ7Ieg2cmF': 'JgRPDsrjMk8',
                               'cUJMaSC8Wi1': 'a8M4hj7Op7v',
                               'DfkC7KiVGO4': 'XcoDQoYpGLk',
                               'LfhAZvAoCIN': 'wAVw1QtktVh'
                              };

var selectedFeedbackType = -1;

getGroupsAndUserInfo();

function setSelectedGroup() {
    //TODO: SET ID OF DESIRED VALIDATION GROUP. TEMP SOLUTION UNTIL WE GET ROUTING.
    var id = "a8M4hj7Op7v";
    
    //Gets the id of current dashboard from URL.
    /*var splitURL = document.URL.split('/');
    var dashboardId = splitURL[splitURL.length -1];

    var id = groupBelongsToDashboard[dashboardId];*/
    return id;
}

//Gets all validation groups and user info.
function getGroupsAndUserInfo() {
    var groups = [];
    var selectedGroupName = "";
    $.get(
        "../../../api/validationRuleGroups?paging=false", function(data) {
            groups = data.validationRuleGroups;
            selectedGroup = setSelectedGroup();
            selectedGroupName = groups.find(group => group.id === selectedGroup).displayName;
            //Set name of group in title.
            document.getElementById("title").innerHTML += selectedGroupName;

            //Get locale
            $.get("../../../api/userSettings/", function(settings) {
                userSettings = settings;
            }).fail(function() {
                console.log("ERROR: Failed to fetch user settings.");
            });

            $.get("../../../api/me/", function(userInfo) {
                user = userInfo;
                getOrgUnits();
            }).fail(function() {
                console.log("ERROR: Failed to fetch user info.");
            });

        }
    );
}

function setDirection() {
    if(userSettings && userSettings.keyUiLocale === 'ar') {
        var elements = document.getElementsByClassName("direction");
        for(var i = 0; i < elements.length; i++) {
            elements[i].style.direction = "rtl";
        }
    }
}

//Gets users orgunits.
function getOrgUnits() {
    var allOrgUnits = [];
    var userOrgunits = [];

    $.get("../../../api/organisationUnits.json?fields=id,name,children[id,name]&paging=false", function(response) {
        allOrgUnits = response.organisationUnits;

        for(var i = 0; i < user.organisationUnits.length; i++) {
            userOrgunits.push(user.organisationUnits[i].id);
        }

        for(var i = 0; i < allOrgUnits.length; i++) {
            if(userOrgunits.indexOf(allOrgUnits[i].id) > -1){
                getAllRelated(allOrgUnits[i]);                               
            }  
        }

        //Recursive methode for finding all related orgUnits.
        function getAllRelated(ou) {
            for(var i = 0; i < allOrgUnits.length; i++) {
                if(allOrgUnits[i].id === ou.id){
                    if(allDownIdOrgUnits.indexOf(allOrgUnits[i].id) < 0) {
                        allDownIdOrgUnits.push(allOrgUnits[i].id);
                        userOrgUnitsName[allOrgUnits[i].id] = allOrgUnits[i].name;
                    }                      
                    if(!allOrgUnits[i].children) {
                        return;
                    } else {
                        for(var j = 0; j < allOrgUnits[i].children.length; j++) {
                            getAllRelated(allOrgUnits[i].children[j]);
                        }   
                    }                         
                }
            }
        }
        runValidation();
    });
}

//Gets the validation results and kick starts table generation.
function runValidation() {
    $.get(
        "../../../api/validationResults?fields=id,organisationUnit,created,validationRule[id,displayName,name,description,instruction,importance,validationRuleGroups[id]]&paging=false",
        function(data) {
            for(var i = 0; i < data.validationResults.length; i++) { 
                if(allDownIdOrgUnits.indexOf(data.validationResults[i].organisationUnit.id) > -1) {
                    results.push(data.validationResults[i]);
                }
            }
            generateTable(results);
        }
    );
}

//Generates the HTML code for the table.
function generateTable(rules) {
    var parent = document.getElementById('analysisResult');
    
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }

    var ruleTable = document.createElement('div');
    
    var table = "";

    var name = "";
    var orgUnit = "";
    var instruction = "";
    var id = "";
    var date = "";
    var validationRuleGroupIds = [];

    $.get("../../../api/dataStore/userInteractionActionFeedback/" + user.id, function(data) {
        userInteractedActions = data.interactedActions;
        for(var i = 0; i < rules.length; i++) {
            validationRuleGroupIds = rules[i].validationRule.validationRuleGroups.map(function(obj){return obj.id;});
    
            if(validationRuleGroupIds.indexOf(selectedGroup) > -1) {
                if(!rules[i].validationRule.displayName) {
                    name = rules[i].validationRule.name;
                } else {
                    name = rules[i].validationRule.displayName;
                }

                orgUnit = rules[i].organisationUnit.id;
                
                date = rules[i].created.split('-');
                date = date[1] + "-" + date[0];
    
                if(!rules[i].validationRule.instruction) {
                    instruction = rules[i].validationRule.description;
                } else {
                    instruction = rules[i].validationRule.instruction;
                }
    
                id = rules[i].id + "";
                if(userInteractedActions.indexOf(id) > -1) {
                    if(rules[i].validationRule.importance === 'HIGH') {
                        table += "<div class='panel panel-default high'>";
                        table += "<div class='panel-body'>";
                        table += "<b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                        table += "<p class='direction'>" + instruction + "</p>";
                        table += "<span style='float: right;'>" + date + "</span>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'MEDIUM') {
                        table += "<div class='panel panel-default medium'>";
                        table += "<div class='panel-body'>";
                        table += "<b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                        table += "<p class='direction'>" + instruction + "</p>";
                        table += "<span style='float: right;'>" + date + "</span>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'LOW') {
                        table += "<div class='panel panel-default low'>";
                        table += "<div class='panel-body'>";
                        table += "<b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                        table += "<p class='direction'>" + instruction + "</p>";
                        table += "<span style='float: right;'>" + date + "</span>";
                        table += "</div>";
                        table += "</div>";
                    }
                } else {
                    if(rules[i].validationRule.importance === 'HIGH') {
                        table += "<div class='panel panel-default high'>";
                        table += "<div class='panel-body'>";
                        table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(218, 136, 136)'> </span><b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                        table += "<p class='direction'>" + instruction + "</p>";
                        table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedbackShow(1, \"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedbackShow(0, \"" + id + "\")'></span>";
                        table += "<div class='row' style='display: none;' id='" + id + "'><div class='col-xs-7'><input placeholder='Reason (Optional)' class='form-control' name='" + id + "' type='text'></div><div class='col-xs-5 text-right'><button type='button' class='btn btn-primary' onclick='feedbackSubmit(\"" + id + "\",\"" + name + "\",\"" + instruction.replace(/"/g, '') + "\")'>Submit</button><button type='button' class='btn btn-danger' onclick='feedbackShow(-1,\"" + id + "\")'>Cancel</button></div></div>";
                        table += "<span style='float: right;'>" + date + "</span>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'MEDIUM') {
                        table += "<div class='panel panel-default medium'>";
                        table += "<div class='panel-body'>";
                        table += "<span class='glyphicon glyphicon-record' aria-hidden='true'style='color: rgb(253, 229, 77)'> </span><b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                        table += "<p class='direction'>" + instruction + "</p>";
                        table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedbackShow(1, \"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedbackShow(0, \"" + id + "\")'></span>";
                        table += "<div class='row' style='display: none;' id='" + id + "'><div class='col-xs-7'><input placeholder='Reason (Optional)' class='form-control' name='" + id + "' type='text'></div><div class='col-xs-5 text-right'><button type='button' class='btn btn-primary' onclick='feedbackSubmit(\"" + id + "\",\"" + name + "\",\"" + instruction.replace(/"/g, '') + "\")'>Submit</button><button type='button' class='btn btn-danger' onclick='feedbackShow(-1,\"" + id + "\")'>Cancel</button></div></div>";
                        table += "<span style='float: right;'>" + date + "</span>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'LOW') {
                        table += "<div class='panel panel-default low'>";
                        table += "<div class='panel-body'>";
                        table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(221, 221, 221)'> </span><b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                        table += "<p class='direction'>" + instruction + "</p>";
                        table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedbackShow(1, \"" + id + "\")'></span>   <span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedbackShow(0, \"" + id + "\")'></span>";
                        table += "<div class='row' style='display: none;' id='" + id + "'><div class='col-xs-7'><input placeholder='Reason (Optional)' class='form-control' name='" + id + "' type='text'></div><div class='col-xs-5 text-right'><button type='button' class='btn btn-primary' onclick='feedbackSubmit(\"" + id + "\",\"" + name + "\",\"" + instruction.replace(/"/g, '') + "\")'>Submit</button><button type='button' class='btn btn-danger' onclick='feedbackShow(-1,\"" + id + "\")'>Cancel</button></div></div>";
                        table += "<span style='float: right;'>" + date + "</span>";
                        table += "</div>";
                        table += "</div>";
                    }
                }
            }
        }
    
        ruleTable.innerHTML = table;
        parent.appendChild(ruleTable);
        setDirection();
    }).fail(function() {
        for(var i = 0; i < rules.length; i++) {
            validationRuleGroupIds = rules[i].validationRule.validationRuleGroups.map(function(obj){return obj.id;});
    
            if(validationRuleGroupIds.indexOf(selectedGroup) > -1) {
                if(!rules[i].validationRule.displayName) {
                    name = rules[i].validationRule.name;
                } else {
                    name = rules[i].validationRule.displayName;
                }
    
                if(!rules[i].validationRule.instruction) {
                    instruction = rules[i].validationRule.description;
                } else {
                    instruction = rules[i].validationRule.instruction;
                }
    
                id = rules[i].id;
                orgUnit = rules[i].organisationUnit.id;

                date = rules[i].created.split('-');
                date = date[1] + "-" + date[0];
                
                if(rules[i].validationRule.importance === 'HIGH') {
                    table += "<div class='panel panel-default high'>";
                    table += "<div class='panel-body'>";
                    table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(218, 136, 136)'> </span><b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                    table += "<p>" + instruction + "</p>";
                    table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedbackShow(1,\"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedbackShow(0,\"" + id + "\")'></span>";
                    table += "<div class='row' style='display: none;' id='" + id + "'><div class='col-xs-7'><input placeholder='Reason (Optional)' class='form-control' name='" + id + "' type='text'></div><div class='col-xs-5 text-right'><button type='button' class='btn btn-primary' onclick='feedbackSubmit(\"" + id + "\",\"" + name + "\",\"" + instruction.replace(/"/g, '') + "\")'>Submit</button><button type='button' class='btn btn-danger' onclick='feedbackShow(-1,\"" + id + "\")'>Cancel</button></div></div>";
                    table += "<span style='float: right;'>" + date + "</span>";
                    table += "</div>";
                    table += "</div>";
                } else if(rules[i].validationRule.importance === 'MEDIUM') {
                    table += "<div class='panel panel-default medium'>";
                    table += "<div class='panel-body'>";
                    table += "<span class='glyphicon glyphicon-record' aria-hidden='true'style='color: rgb(253, 229, 77)'> </span><b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                    table += "<p>" + instruction + "</p>";
                    table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedbackShow(1,\"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedbackShow(0,\"" + id + "\")'></span>";
                    table += "<div class='row' style='display: none;' id='" + id + "'><div class='col-xs-7'><input placeholder='Reason (Optional)' class='form-control' name='" + id + "' type='text'></div><div class='col-xs-5 text-right'><button type='button' class='btn btn-primary' onclick='feedbackSubmit(\"" + id + "\",\"" + name + "\",\"" + instruction.replace(/"/g, '') + "\")'>Submit</button><button type='button' class='btn btn-danger' onclick='feedbackShow(-1,\"" + id + "\")'>Cancel</button></div></div>";
                    table += "<span style='float: right;'>" + date + "</span>";
                    table += "</div>";
                    table += "</div>";
                } else if(rules[i].validationRule.importance === 'LOW') {
                    table += "<div class='panel panel-default low'>";
                    table += "<div class='panel-body'>";
                    table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(221, 221, 221)'> </span><b style='padding-bottom: 2px'> " + name + "</b><span style='float: right;font-size: 12px;'>" + userOrgUnitsName[orgUnit] + "</span>";
                    table += "<p>" + instruction + "</p>";
                    table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedbackShow(1,\"" + id + "\")'></span>   <span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedbackShow(0,\"" + id + "\")'></span>";
                    table += "<div class='row' style='display: none;' id='" + id + "'><div class='col-xs-7'><input placeholder='Reason (Optional)' class='form-control' name='" + id + "' type='text'></div><div class='col-xs-5 text-right'><button type='button' class='btn btn-primary' onclick='feedbackSubmit(\"" + id + "\",\"" + name + "\",\"" + instruction.replace(/"/g, '') + "\")'>Submit</button><button type='button' class='btn btn-danger' onclick='feedbackShow(-1,\"" + id + "\")'>Cancel</button></div></div>";
                    table += "<span style='float: right;'>" + date + "</span>";
                    table += "</div>";
                    table += "</div>";
                }
            }
        }
    
        ruleTable.innerHTML = table;
        parent.appendChild(ruleTable);
        setDirection();
    });
}

//Send feedback to data store.
function feedback(type, id, name, instruction, message) {
    $.get(
        "../../../api/dataStore/actionFeedback/" + id,
        function(data) {
            var positive = data.positive;
            var negative = data.negative;
            var positiveFeedbackMessages = data.positiveFeedbackMessages;
            var negativeFeedbackMessages = data.negativeFeedbackMessages;
            var feedbackInfo = data.feedbackInfo;
            
            if(!positive) {
                positive = 0;
            }

            if(!negative) {
                negative = 0;
            }

            if(!positiveFeedbackMessages && message || positiveFeedbackMessages && positiveFeedbackMessages.length === 0 && message) {
                positiveFeedbackMessages = [];
                if(type === 1) {
                    positiveFeedbackMessages.push(message);
                }
            } else if(positiveFeedbackMessages && message || positiveFeedbackMessages && positiveFeedbackMessages.length > 0 && message){
                if(type === 1) {
                    positiveFeedbackMessages.push(message);
                }
            } else if(!positiveFeedbackMessages && !message || positiveFeedbackMessages && positiveFeedbackMessages.length === 0 && !message){
                positiveFeedbackMessages = [];
            }

            if(!negativeFeedbackMessages && message || negativeFeedbackMessages && negativeFeedbackMessages.length === 0 && message) {
                negativeFeedbackMessages = [];
                if(type === 0) {
                    negativeFeedbackMessages.push(message);
                }
            } else if(negativeFeedbackMessages && message || negativeFeedbackMessages && negativeFeedbackMessages.length > 0 && message){
                if(type === 0) {
                    negativeFeedbackMessages.push(message);
                }
            } else if(!negativeFeedbackMessages && !message || negativeFeedbackMessages && negativeFeedbackMessages.length === 0 && !message){
                negativeFeedbackMessages = [];
            }

            positiveFeedbackMessages = JSON.stringify(positiveFeedbackMessages);
            negativeFeedbackMessages = JSON.stringify(negativeFeedbackMessages);

            if(!feedbackInfo) {
                feedbackInfo = {"name": name, "instruction": instruction};
            }

            feedbackInfo = JSON.stringify(feedbackInfo);

            if(type === 1) {
                positive++;

                $.ajax({
                    url: "../../../api/dataStore/actionFeedback/" + id,
                    type: "PUT",
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + ", \"positiveFeedbackMessages\":" + positiveFeedbackMessages + ", \"negativeFeedbackMessages\":" + negativeFeedbackMessages + ", \"feedbackInfo\":" + feedbackInfo + "}",
                    contentType:"application/json; charset=utf-8",
                    dataType:"json",
                    success: function(){
                        setInteracted(id);
                    }
                });
            } else if(type === 0) {
                negative++;

                $.ajax({
                    url: "../../../api/dataStore/actionFeedback/" + id,
                    type: "PUT",
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + ", \"positiveFeedbackMessages\":" + positiveFeedbackMessages + ", \"negativeFeedbackMessages\":" + negativeFeedbackMessages + ", \"feedbackInfo\":" + feedbackInfo + "}",
                    contentType:"application/json; charset=utf-8",
                    dataType:"json",
                    success: function(){
                        setInteracted(id);
                    }
                });
            }
        })
        .fail(function() {
            var positive = 0;
            var negative = 0;
            var positiveFeedbackMessages = [];
            var negativeFeedbackMessages = [];
            var feedbackInfo = {"name": name, "instruction": instruction};

            if(message && type === 1) {
                positiveFeedbackMessages.push(message);
            } else if(message && type === 0) {
                negativeFeedbackMessages.push(message);
            }

            positiveFeedbackMessages = JSON.stringify(positiveFeedbackMessages);
            negativeFeedbackMessages = JSON.stringify(negativeFeedbackMessages);
            feedbackInfo = JSON.stringify(feedbackInfo);

            if(type === 1) {
                positive++;

                $.ajax({
                    url: "../../../api/dataStore/actionFeedback/" + id,
                    type: "POST",
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + ", \"positiveFeedbackMessages\":" + positiveFeedbackMessages + ", \"negativeFeedbackMessages\":" + negativeFeedbackMessages + ", \"feedbackInfo\":" + feedbackInfo + "}",
                    contentType:"application/json; charset=utf-8",
                    dataType:"json",
                    success: function(){
                        setInteracted(id);
                    }
                });
            } else if(type === 0) {
                negative++;

                $.ajax({
                    url: "../../../api/dataStore/actionFeedback/" + id,
                    type: "POST",
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + ", \"positiveFeedbackMessages\":" + positiveFeedbackMessages + ", \"negativeFeedbackMessages\":" + negativeFeedbackMessages + ", \"feedbackInfo\":" + feedbackInfo + "}",
                    contentType:"application/json; charset=utf-8",
                    dataType:"json",
                    success: function(){
                        setInteracted(id);
                    }
                });
            }
        });
}

function feedbackShow(type, id) {
    selectedFeedbackType = type;
    var element = document.getElementById(id);
    if (element.style.display === "none") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

function feedbackSubmit(id, name, instruction) {
    var element = document.getElementsByName(id)[0];
    var message = element.value;
    if(!message && selectedFeedbackType >= 0) {
        feedback(selectedFeedbackType, id, name, instruction);
    } else if(selectedFeedbackType >= 0) {
        feedback(selectedFeedbackType, id, name, instruction, message);
    }

}

//Set in data store that this user has interacted with this validation result.
function setInteracted(id) {
    $.get("../../../api/dataStore/userInteractionActionFeedback/" + user.id, function(data) {
        var interactedActions = data.interactedActions;
        
        if(!interactedActions) {
            interactedActions = [];
        }
        
        interactedActions.push(id);
        userInteractedActions = interactedActions;
        var jsonConvertedArray = JSON.stringify(interactedActions);

        $.ajax({
            url: "../../../api/dataStore/userInteractionActionFeedback/" + user.id,
            type: "PUT",
            data: "{\"interactedActions\":" + jsonConvertedArray + "}",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success: function(){
                //Regenereating tables with latest changes.
                updateNotificationTab();
                generateTable(results);
            }
        });
    }).fail(function() {
        var interactedActions = [];

        interactedActions[0] = id;
        userInteractedActions = interactedActions;
        var jsonConvertedArray = JSON.stringify(interactedActions);

        $.ajax({
            url: "../../../api/dataStore/userInteractionActionFeedback/" + user.id,
            type: "POST",
            data: "{\"interactedActions\":" + jsonConvertedArray + "}",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success: function(){
                //Regenereating tables with latest changes.
                updateNotificationTab();
                generateTable(results);
            }
        });
    });
}

function updateNotificationTab() {
    //Fetch all, iframes. This will include the Dashboard Tabs App.
    iframes = parent.document.getElementsByTagName('iframe');

    for(i = 0; i < iframes.length; i++) {
        //Find correct iframe. Dashboard Tabs App gives it self the 'tabsApp' id.
        if(iframes[i].id === 'tabsApp') {
            //All tabs have a unique id that is set to the different validation groups they represent.
            //We can get the correct tab and its amount of notifications with the id of the selected group.
            var amt = iframes[i].contentDocument.getElementById(selectedGroup).innerHTML;
            amt = parseInt(amt);
            amt--;
            iframes[i].contentDocument.getElementById(selectedGroup).innerHTML = amt;
        }
    }

}
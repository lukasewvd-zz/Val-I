//Selected validation group.
var selectedGroup = "";
//Results from the validation run.
var results = [];
//User info.
var user = {};
//Array of all validation rules that have been interacted with.
var userInteractedActions

getGroupsAndUserInfo();

//TODO: Get selected group based on which dashboard we are viewing.

function setSelectedGroup(id) {
    selectedGroup = id;
    generateTable(results);
}

//Gets all validation groups and user info.
function getGroupsAndUserInfo() {
    var groups = [];
    $.get(
        "../../../api/validationRuleGroups?paging=false", function(data) {
            groups = data.validationRuleGroups;
            let optionList = document.getElementById('groups').options;
            groups.forEach(group =>
            optionList.add(new Option(group.displayName, group.id)));
            selectedGroup = groups[0].id;
            $.get("../../../api/me/", function(userInfo) {
                user = userInfo;
                runValidation();
            }).fail(function() {
                console.log("ERROR: Failed to fetch user info.");
            });
            
        }
    );
}

//Gets the validation results and kick starts table generation.
function runValidation() {
    $.get(
        "../../../api/validationResults?fields=id,validationRule[id,displayName,name,description,instruction,importance,validationRuleGroups[id]]&paging=false",
        function(data) {
            results = data.validationResults;
            
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
    var instruction = "";
    var id = "";
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
                        table += "<b style='padding-bottom: 2px'> " + name + "</b>";
                        table += "<p>" + instruction + "</p>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'MEDIUM') {
                        table += "<div class='panel panel-default medium'>";
                        table += "<div class='panel-body'>";
                        table += "<b style='padding-bottom: 2px'> " + name + "</b>";
                        table += "<p>" + instruction + "</p>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'LOW') {
                        table += "<div class='panel panel-default low'>";
                        table += "<div class='panel-body'>";
                        table += "<b style='padding-bottom: 2px'> " + name + "</b>";
                        table += "<p>" + instruction + "</p>";
                        table += "</div>";
                        table += "</div>";
                    }
                } else {
                    if(rules[i].validationRule.importance === 'HIGH') {
                        table += "<div class='panel panel-default high'>";
                        table += "<div class='panel-body'>";
                        table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(218, 136, 136)'> </span><b style='padding-bottom: 2px'> " + name + "</b>";
                        table += "<p>" + instruction + "</p>";
                        table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedback(1,\"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedback(0,\"" + id + "\")'></span>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'MEDIUM') {
                        table += "<div class='panel panel-default medium'>";
                        table += "<div class='panel-body'>";
                        table += "<span class='glyphicon glyphicon-record' aria-hidden='true'style='color: rgb(253, 229, 77)'> </span><b style='padding-bottom: 2px'> " + name + "</b>";
                        table += "<p>" + instruction + "</p>";
                        table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedback(1,\"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedback(0,\"" + id + "\")'></span>";
                        table += "</div>";
                        table += "</div>";
                    } else if(rules[i].validationRule.importance === 'LOW') {
                        table += "<div class='panel panel-default low'>";
                        table += "<div class='panel-body'>";
                        table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(221, 221, 221)'> </span><b style='padding-bottom: 2px'> " + name + "</b>";
                        table += "<p>" + instruction + "</p>";
                        table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedback(1,\"" + id + "\")'></span>   <span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedback(0,\"" + id + "\")'></span>";
                        table += "</div>";
                        table += "</div>";
                    }
                }
            }
        }
    
        ruleTable.innerHTML = table;
        parent.appendChild(ruleTable);
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
    
                if(rules[i].validationRule.importance === 'HIGH') {
                    table += "<div class='panel panel-default high'>";
                    table += "<div class='panel-body'>";
                    table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(218, 136, 136)'> </span><b style='padding-bottom: 2px'> " + name + " </b>";
                    table += "<p>" + instruction + "</p>";
                    table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedback(1,\"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedback(0,\"" + id + "\")'></span>";
                    table += "</div>";
                    table += "</div>";
                } else if(rules[i].validationRule.importance === 'MEDIUM') {
                    table += "<div class='panel panel-default medium'>";
                    table += "<div class='panel-body'>";
                    table += "<span class='glyphicon glyphicon-record' aria-hidden='true'style='color: rgb(253, 229, 77)'> </span><b style='padding-bottom: 2px'> " + name + "</b>";
                    table += "<p>" + instruction + "</p>";
                    table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedback(1,\"" + id + "\")'>   </span><span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedback(0,\"" + id + "\")'></span>";
                    table += "</div>";
                    table += "</div>";
                } else if(rules[i].validationRule.importance === 'LOW') {
                    table += "<div class='panel panel-default low'>";
                    table += "<div class='panel-body'>";
                    table += "<span class='glyphicon glyphicon-record' aria-hidden='true' style='color: rgb(221, 221, 221)'> </span><b style='padding-bottom: 2px'> " + name + "</b>";
                    table += "<p>" + instruction + "</p>";
                    table += "<span class='glyphicon glyphicon-thumbs-up up' aria-hidden='true' style='padding-right: 5px' onclick='feedback(1,\"" + id + "\")'></span>   <span class='glyphicon glyphicon-thumbs-down down' aria-hidden='true' onclick='feedback(0,\"" + id + "\")'></span>";
                    table += "</div>";
                    table += "</div>";
                }
            }
        }
    
        ruleTable.innerHTML = table;
        parent.appendChild(ruleTable);
    });
}

//Send feedback to data store.
function feedback(type, id) {
    $.get(
        "../../../api/dataStore/actionFeedback/" + id,
        function(data) {
            var positive = data.positive;
            var negative = data.negative;
            
            if(!positive) {
                positive = 0;
            }

            if(!negative) {
                negative = 0;
            }

            if(type === 1) {
                positive++;
                $.ajax({
                    url: "../../../api/dataStore/actionFeedback/" + id,
                    type: "PUT",
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + "}",
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
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + "}",
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

            if(type === 1) {
                positive++;
                $.ajax({
                    url: "../../../api/dataStore/actionFeedback/" + id,
                    type: "POST",
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + "}",
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
                    data: "{\"positive\":" + positive + ", \"negative\":" + negative + "}",
                    contentType:"application/json; charset=utf-8",
                    dataType:"json",
                    success: function(){
                        setInteracted(id);
                    }
                });
            }
        });
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
            var amt = iframes[i].contentDocument.getElementById(selectedGroup).innerHTML;
            amt = parseInt(amt);
            amt--;
            iframes[i].contentDocument.getElementById(selectedGroup).innerHTML = amt;
        }
    }

}
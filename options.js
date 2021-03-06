// add more info to event logs for display
// make better interface than timestamp input
// disable event logging while recreating
// option to clear history
// delete old events/snapshots

var pendingBrowserState = {};
var tempBrowserState = {};
var testdisable;

$(function(){
    displayVariables();

    $("#snapshotbutton").on('click',function(){
        displayVariables();

        var snapshotNum = "Snapshot"+$("#snapshottextbox").val();
        chrome.storage.local.get(snapshotNum, function(result){
            if(result[snapshotNum]==undefined)
                $("#displaydata").html("<p><b>Nope!</b></p>");
            else{
                console.log(result[snapshotNum]);
                displayBrowserState(snapshotNum, result[snapshotNum]);
            }
        });
    });

    $("#timestampbutton").on('click',function(){
        displayVariables();
        chrome.storage.local.get("timestamps", function(result){
            var time = parseInt($("#timestamptextbox").val());
            var i = findSnapshot(time,result.timestamps);
            if(i>=0){
                var snapshotNum = "Snapshot"+i;
                chrome.storage.local.get(snapshotNum, function(result2){
                    var replayBrowserState = {};
                    replayBrowserState.tabs = result2[snapshotNum].tabs;
                    replayBrowserState.windows = result2[snapshotNum].windows;
                    chrome.storage.local.get("numEvents",function(result3){
                        replayEvents(replayBrowserState, result2[snapshotNum].eventIndex, result3.numEvents, time);
                    });
                });
            }else
                $("#displaydata").html("<p><b>Nope!</b></p>");
        });
    });

    $("#eventsbutton").on('click',function(){
        displayVariables();
        $("#displaydata").html('');
        start=parseInt($("#eventsstarttextbox").val());
        end=parseInt($("#eventsendtextbox").val());
        if(isNaN(start) || isNaN(end) || start>end)
            $("#displaydata").html("<p><b>Nope!</b></p>");
        else if(end-start>=500)
            $("#displaydata").html("<p><b>Too many events requested</b></p>");
        else
            chrome.storage.local.get("numEvents", function(result){
                displayEvents(Math.min(result.numEvents-1,start), Math.min(result.numEvents-1,end));
            });

    });

    $("#last100eventsbutton").on('click',function(){
        displayVariables();
        $("#displaydata").html('');
        chrome.storage.local.get("numEvents", function(result){
            displayEvents(Math.max(result.numEvents-100,0), result.numEvents-1);
        });
    });
});

function displayEvents(eventIndex, maxEvent){
    if(eventIndex<=maxEvent){
        var eventNum = "Event"+eventIndex;
        chrome.storage.local.get(eventNum, function(events){
            $("#displaydata").append("<div>" + eventNum + ":<ul id=\"" + eventNum + "\"></ul></div>")
            for(var key in events[eventNum]){
                $("#"+eventNum).append("<li>" + key + ": " + events[eventNum][key] + "</li>");
            }
            displayEvents(eventIndex+1, maxEvent);
        });
    }
}

function setRecreateButtonEvent(){
    $("#recreatebutton").on('click',function(){
        chrome.tabs.query({},function(tabs){
            tempBrowserState={};
            tempBrowserState.windows={};
            for(var i=0; i<tabs.length; ++i){
                if(!tabs[i].incognito){
                    if(!tempBrowserState.windows.hasOwnProperty("window"+tabs[i].windowId)){
                        tempBrowserState.windows["window"+tabs[i].windowId]={};
                        tempBrowserState.windows["window"+tabs[i].windowId].id=tabs[i].windowId;
                        tempBrowserState.windows["window"+tabs[i].windowId].tabs={};
                    }
                    tempBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id]={};
                    tempBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].id=tabs[i].id;
                    tempBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].index=tabs[i].index;
                    tempBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].pinned=tabs[i].pinned;
                    tempBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].url=tabs[i].url;
                }
            }

            var pendingChromeWindows=[]; // transfer keys to array so we can use recursion to circumvent forced async shit (as per usual)
            for(var pendingChromeWindow in pendingBrowserState.windows){
                pendingChromeWindows.push(pendingChromeWindow);
            }
            recreateWindow(pendingChromeWindows, 0);
        });
    });
}

function recreateWindow(pendingChromeWindows, index){
    chrome.windows.create({},function(chromeWindow){
        chrome.tabs.query({"windowId": chromeWindow.id},function(emptyTab){
            for(var i=0; i<Object.keys(pendingBrowserState.windows[pendingChromeWindows[index]].tabs).length; ++i){
                var tabUrl;
                for(var tab in pendingBrowserState.windows[pendingChromeWindows[index]].tabs){
                    if(pendingBrowserState.windows[pendingChromeWindows[index]].tabs[tab].index == i){
                        tabUrl = pendingBrowserState.windows[pendingChromeWindows[index]].tabs[tab].url;
                        tabPinned = pendingBrowserState.windows[pendingChromeWindows[index]].tabs[tab].pinned;
                        break;
                    }
                }

                var tabId = -1;
                for(var tempChromeWindow in tempBrowserState.windows){
                    for(var tab in tempBrowserState.windows[tempChromeWindow].tabs){
                        if(tempBrowserState.windows[tempChromeWindow].tabs[tab].url == tabUrl){
                            tabId = tempBrowserState.windows[tempChromeWindow].tabs[tab].id;
                            delete tempBrowserState.windows[tempChromeWindow].tabs[tab];
                            break;
                        }
                    }
                    if(tabId>-1)
                        break;
                }

                if(tabId>-1){
                    chrome.tabs.move(tabId,{"windowId": chromeWindow.id, "index": i});
                    if(tabPinned)
                        chrome.tabs.update(tabId,{"pinned": true});
                }else
                    chrome.tabs.create({"windowId": chromeWindow.id, "pinned": tabPinned, "url": tabUrl});
            }

            chrome.tabs.remove(emptyTab[0].id);
            chrome.tabs.update(pendingBrowserState.windows[pendingChromeWindows[index]].activeTab, {"active": true});

            if(index+1<pendingChromeWindows.length)
                recreateWindow(pendingChromeWindows, index+1);
            else
                for(var tempChromeWindow in tempBrowserState.windows)
                    chrome.windows.remove(tempBrowserState.windows[tempChromeWindow].id);
        });
    });
}

function displayVariables(){
    chrome.storage.local.get("numSnapshots", function(result){
        if(result.numSnapshots==undefined)
            displayVariables();
        else{
            $("#numSnapshots").html("numSnapshots: " + result.numSnapshots);

            chrome.storage.local.get("numEvents", function(result){
                $("#numEvents").html("numEvents: " + result.numEvents);
            });

            chrome.storage.local.get("timestamps", function(result){
                $("#timestamps").html("timestamps:<ul id=timestampArray></ul>");
                for(var i=0; i<result.timestamps.length; ++i){
                    $("#timestampArray").append("<li>" + result.timestamps[i] + "</li>");
                }
            });
        }
    });
}

function displayBrowserState(title, browserState, timestamp, eventIndex){
    pendingBrowserState.windows = browserState.windows

    if(browserState.hasOwnProperty("timestamp"))
        $("#displaydata").html(title + ": <input type=\"button\" id=\"recreatebutton\" value=\"Recreate\"/><ul id=\"chromeWindows\"><li>timestamp: " + browserState.timestamp + "</li><p></p><li>eventIndex: " + browserState.eventIndex + "</li><p></p></ul>");
    else
        $("#displaydata").html(title + ": <input type=\"button\" id=\"recreatebutton\" value=\"Recreate\"/><ul id=\"chromeWindows\"><li>timestamp: " + timestamp + "</li><p></p><li>eventIndex: " + eventIndex + "</li><p></p></ul>");

    setRecreateButtonEvent();

    for(var chromeWindow in browserState.windows){
        $("#chromeWindows").append("<li>"+chromeWindow+"</li><ul id="+chromeWindow+"></ul><br/>");
        var numTabs=0;
        for(var tab in browserState.windows[chromeWindow].tabs){
            $("#"+chromeWindow).append("<div id=\""+chromeWindow+"tabindex"+numTabs+"\"></div>");
            ++numTabs;
        }
        for(var tab in browserState.windows[chromeWindow].tabs){
            if(browserState.windows[chromeWindow].activeTab == browserState.windows[chromeWindow].tabs[tab].id){
                if(browserState.windows[chromeWindow].tabs[tab].pinned)
                    $("#"+chromeWindow+"tabindex"+browserState.windows[chromeWindow].tabs[tab].index).append("<li>Pinned -- <b>"+browserState.windows[chromeWindow].tabs[tab].title+"</b><ul style=\"list-style-type:none\"><li>("+browserState.windows[chromeWindow].tabs[tab].url+")</li></ul></li>");
                else
                    $("#"+chromeWindow+"tabindex"+browserState.windows[chromeWindow].tabs[tab].index).append("<li><b>"+browserState.windows[chromeWindow].tabs[tab].title+"</b><ul style=\"list-style-type:none\"><li>("+browserState.windows[chromeWindow].tabs[tab].url+")</li></ul></li>");
            }else{
                if(browserState.windows[chromeWindow].tabs[tab].pinned)
                    $("#"+chromeWindow+"tabindex"+browserState.windows[chromeWindow].tabs[tab].index).append("<li>Pinned -- "+browserState.windows[chromeWindow].tabs[tab].title+"<ul style=\"list-style-type:none\"><li>("+browserState.windows[chromeWindow].tabs[tab].url+")</li></ul></li>");
                else
                    $("#"+chromeWindow+"tabindex"+browserState.windows[chromeWindow].tabs[tab].index).append("<li>"+browserState.windows[chromeWindow].tabs[tab].title+"<ul style=\"list-style-type:none\"><li>("+browserState.windows[chromeWindow].tabs[tab].url+")</li></ul></li>");
            }
        }
    }
}

function findSnapshot(timestamp, timestamps){ // binary search
    if(isNaN(timestamp) || timestamp<timestamps[0] || timestamp>Date.now())
        return -1;
    var low=0;
    var high=timestamps.length-1;
    while(low+1<high){
        var pivot=Math.floor((low+high)/2);
        if(timestamp<timestamps[pivot])
            high=pivot-1;
        else
            low=pivot;
    }
    if(timestamp>timestamps[high])
        return high;
    return low;
}

function replayEvents(replayBrowserState, eventIndex, numEvents, timestamp){
    if(eventIndex<numEvents){
        var eventNum = "Event"+eventIndex;
        chrome.storage.local.get(eventNum, function(events){
            if(events[eventNum].timestamp < timestamp){
                playEvent(replayBrowserState, events[eventNum]);
                replayEvents(replayBrowserState, eventIndex+1, numEvents, timestamp);
            }else
                keepGoing(replayBrowserState, timestamp, eventIndex);
        });
    }else
        keepGoing(replayBrowserState, timestamp, eventIndex);
}

function keepGoing(replayBrowserState, timestamp, eventIndex){
    displayBrowserState("Replayed", replayBrowserState, timestamp, eventIndex);
}

/*function copySnapshot(from, to){
    to.tabs = {};
    for(var tab in from.tabs){
        to.tabs[tab] = {};
        to.tabs[tab].id = from.tabs[tab].id;
        to.tabs[tab].index = from.tabs[tab].index;
        to.tabs[tab].pinned = from.tabs[tab].pinned;
        to.tabs[tab].title = from.tabs[tab].title;
        to.tabs[tab].url = from.tabs[tab].url;
    }

    to.windows = {};
    for(var chromeWindow in from.windows){
        to.windows[chromeWindow] = {};
        to.windows[chromeWindow].id = from.windows[chromeWindow].id;
        to.windows[chromeWindow].activeTab = from.windows[chromeWindow].activeTab;
        to.windows[chromeWindow].tabs = {};
        for(var tab in from.windows[chromeWindow].tabs){
            to.windows[chromeWindow].tabs[tab] = {};
            to.windows[chromeWindow].tabs[tab].id = from.windows[chromeWindow].tabs[tab].id;
            to.windows[chromeWindow].tabs[tab].index = from.windows[chromeWindow].tabs[tab].index;
            to.windows[chromeWindow].tabs[tab].pinned = from.windows[chromeWindow].tabs[tab].pinned;
            to.windows[chromeWindow].tabs[tab].title = from.windows[chromeWindow].tabs[tab].title;
            to.windows[chromeWindow].tabs[tab].url = from.windows[chromeWindow].tabs[tab].url;
        }
    }
}*/

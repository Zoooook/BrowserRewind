$(function(){
    displayVariables();

    $("#snapshotbutton").on('click',function(){
        displayVariables();

        var snapshotNum = "Snapshot"+$("#snapshottextbox").val();
        chrome.storage.local.get(snapshotNum, function(result){
            if(result[snapshotNum]==undefined)
                $("#snapshot").html("<p><b>Nope!</b></p>");
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
            var snapshotNum = "Snapshot"+i;
            chrome.storage.local.get(snapshotNum, function(result2){
                var replayBrowserState = {};
                replayBrowserState.tabs = result2[snapshotNum].tabs;
                replayBrowserState.windows = result2[snapshotNum].windows;
                chrome.storage.local.get("numEvents",function(result3){
                    replayEvents(replayBrowserState, result2[snapshotNum].eventIndex, result3.numEvents, time);
                });

            });
        });
    });
});

function displayVariables(){
    chrome.storage.local.get("numSnapshots", function(result){
        $("#numSnapshots").html("numSnapshots: " + result.numSnapshots);
    });

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

function displayBrowserState(title, browserState){
    if(browserState.hasOwnProperty("timestamp"))
        $("#snapshot").html(title + ":<ul id=\"chromeWindows\"><li>timestamp: " + browserState.timestamp + "</li><p></p><li>eventIndex: " + browserState.eventIndex + "</li><p></p></ul>");
    else
        $("#snapshot").html(title + ":<ul id=\"chromeWindows\"></ul>");
    for(var chromeWindow in browserState.windows){
        $("#chromeWindows").append("<li>"+chromeWindow+"</li><ul><br/><li>Active Tab: "+browserState.windows[chromeWindow].activeTab+"</li><p></p><li>Tabs:</li><ul id="+chromeWindow+"></ul></ul><br/>");
        for(var tab in browserState.windows[chromeWindow].tabs){
            for(var key in browserState.windows[chromeWindow].tabs[tab]){
                $("#"+chromeWindow).append("<li>"+key+": "+browserState.windows[chromeWindow].tabs[tab][key]+"</li>");
            }
            $("#"+chromeWindow).append("<p></p>");
        }
    }
}

function findSnapshot(timestamp, timestamps){ // binary search
    if(timestamp<timestamps[0])
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
                keepGoing(replayBrowserState, timestamp);
        });
    }else
        keepGoing(replayBrowserState, timestamp);
}

function keepGoing(replayBrowserState, timestamp){
    displayBrowserState(timestamp, replayBrowserState);
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
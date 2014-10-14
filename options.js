$(function(){
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

    $("#button").on('click',function(){
        var snapshotNum = "Snapshot"+$("#textbox").val();
        chrome.storage.local.get(snapshotNum, function(result){
            if(result[snapshotNum]==undefined)
                $("#snapshot").html("<p><b>Nope!</b></p>");
            else{
                console.log(result[snapshotNum]);
                $("#snapshot").html(snapshotNum + ":<ul id=\"chromeWindows\"><li>Timestamp: " + result[snapshotNum].timestamp + "</li><p></p><li>eventIndex: " + result[snapshotNum].eventIndex + "</li><p></p></ul>");
                for(var chromeWindow in result[snapshotNum].windows){
                    $("#chromeWindows").append("<li>"+chromeWindow+"</li><ul><br/><li>Active Tab: "+result[snapshotNum].windows[chromeWindow].activeTab+"</li><p></p><li>Tabs:</li><ul id="+chromeWindow+"></ul></ul><br/>");
                    for(var tab in result[snapshotNum].windows[chromeWindow].tabs){
                        for(var key in result[snapshotNum].windows[chromeWindow].tabs[tab]){
                            $("#"+chromeWindow).append("<li>"+key+": "+result[snapshotNum].windows[chromeWindow].tabs[tab][key]+"</li>");
                        }
                        $("#"+chromeWindow).append("<p></p>");
                    }
                }
            }
        });
    });

    $("#timestampbutton").on('click',function(){
        chrome.storage.local.get("timestamps", function(result){
            var time = parseInt($("#timestamptextbox").val());
            var i = findSnapshot(time,result.timestamps);

/*            var x = false;
            if(i==-1){
                if(time<result.timestamps[0])
                    x = true;
                alert(i+": \n : "+time+"\n"+0+": "+result.timestamps[0]+"\n"+x);
            }else if(i+1<result.timestamps.length){
                if(result.timestamps[i]<time && time<result.timestamps[i+1])
                    x = true;
                alert(i+": "+result.timestamps[i]+"\n : "+time+"\n"+(i+1)+": "+result.timestamps[i+1]+"\n"+x);
            }else{
                if(result.timestamps[t]<time)
                    x = true;
                alert(i+": "+result.timestamps[i]+"\n : "+time+"\n"+x);
            }*/

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

function replayEvents(replayBrowserState, eventIndex, numEvents, timestamp){
    if(eventIndex<numEvents){
        var eventNum = "Event"+eventIndex;
        chrome.storage.local.get(eventNum, function(events){
            if(events[eventNum].timestamp < timestamp){
                replayEvent(replayBrowserState, events[eventNum]);
                replayEvents(replayBrowserState, eventIndex+1, numEvents, timestamp);
            }else
                keepGoing(replayBrowserState);
        });
    }else
        keepGoing(replayBrowserState);
}

function replayEvent(replayBrowserState, eventI){

}

function keepGoing(replayBrowserState){

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
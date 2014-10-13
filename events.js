//get events to update the current browser state
//play back events up to a specific timestamp in memory (and display on options page)
//recreate browser state

var eventNum;
var currentBrowserState = {};

chrome.tabs.query({},function(tabs){
//    chrome.storage.local.clear();
//    alert("Snapshotting");
    currentBrowserState.windows={};
    for(var i=0; i<tabs.length; ++i){
        if(!tabs[i].incognito){
            if(!currentBrowserState.windows.hasOwnProperty("window"+tabs[i].windowId)){
                currentBrowserState.windows["window"+tabs[i].windowId]={};
                currentBrowserState.windows["window"+tabs[i].windowId].id=tabs[i].windowId;
                currentBrowserState.windows["window"+tabs[i].windowId].tabs={};
            }
            if(tabs[i].active)
                currentBrowserState.windows["window"+tabs[i].windowId].activeTab=tabs[i].id;
            currentBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id]={};
            currentBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].id=tabs[i].id;
            currentBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].index=tabs[i].index;
            currentBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].pinned=tabs[i].pinned;
            currentBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].title=tabs[i].title;
            currentBrowserState.windows["window"+tabs[i].windowId].tabs["tab"+tabs[i].id].url=tabs[i].url;
        }
    }
    snapshot();
});

function snapshot(){
    var currentSnapshot = {};
    currentSnapshot.windows=currentBrowserState.windows;
    currentSnapshot.timestamp=Date.now();
    chrome.storage.local.get("numSnapshots",function(result){
        if(result.numSnapshots==undefined){
            currentSnapshot.eventIndex=0;
            chrome.storage.local.set({"Snapshot0": currentSnapshot});
            chrome.storage.local.set({"numSnapshots": 1});
            chrome.storage.local.set({"numEvents": 0});
            eventNum=0;
            chrome.storage.local.set({"timestamps": [currentSnapshot.timestamp]});
        }else{
            chrome.storage.local.get("numEvents",function(result2){
                eventNum=result2.numEvents;
                currentSnapshot.eventIndex=result2.numEvents;
                var store={};
                store["Snapshot"+result.numSnapshots]=currentSnapshot;
                chrome.storage.local.set(store);
                chrome.storage.local.set({"numSnapshots": result.numSnapshots+1});
            });
            chrome.storage.local.get("timestamps",function(result2){
                result2.timestamps.push(currentSnapshot.timestamp);
                chrome.storage.local.set({"timestamps": result2.timestamps});
            });
        }
    });
}

chrome.browserAction.onClicked.addListener(function(tab) { // I think this opens the options page when you click the icon?
    var optionsUrl = chrome.extension.getURL('options.html');
    chrome.tabs.query({ url: optionsUrl }, function(results) {
        if (results.length) chrome.tabs.update(results[0].id, {active:true});
        else chrome.tabs.create({url:optionsUrl});
    });
});

/*function displayTabInfo(tab,text){
    alert(text +
          "\n\nid: " + tab.id +
          "\nindex: " + tab.index +
          "\nwindowId: " + tab.windowId +
          "\nopenerTabId: " + tab.openerTabId +
          "\nselected: " + tab.selected +
          "\nhighlighted: " + tab.highlighted +
          "\nactive: " + tab.active +
          "\npinned: " + tab.pinned +
          "\nurl: " + tab.url +
          "\ntitle: " + tab.title +
          "\nfaviconUrl: " + tab.faviconUrl +
          "\nstatus: " + tab.status +
          "\nincognito: " + tab.incognito +
          "\nwidth: " + tab.width +
          "\nheight: " + tab.height +
          "\nsessionId: " + tab.sessionId);
}*/ // for alerts

function logEvent(eventObject){
    eventObject.timestamp=Date.now();
    var store={};
    store["Event"+eventNum]=eventObject;
    chrome.storage.local.set(store);
    ++eventNum;
    chrome.storage.local.set({"numEvents": eventNum});
}

chrome.tabs.onCreated.addListener(function(tab){
    if(!tab.incognito){
//        alert("eventType: Created\n\nwindowId: " + tab.windowId + "\ntabId: " + tab.id + "\nindex: " + tab.index + "\npinned: " + tab.pinned + "\ntitle: " + tab.title + "\nurl: " + tab.url);
        var eventObject = {"eventType": "Created", "windowId": tab.windowId, "tabId": tab.id, "index": tab.index, "pinned": tab.pinned, "title": tab.title, "url": tab.url};
        logEvent(eventObject);

        if(!currentBrowserState.windows.hasOwnProperty("window"+tab.windowId)){
            currentBrowserState.windows["window"+tab.windowId]={};
            currentBrowserState.windows["window"+tab.windowId].id=tab.windowId;
            currentBrowserState.windows["window"+tab.windowId].tabs={};
        }
        currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tab.id]={};
        currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tab.id].id=tab.id;
        currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tab.id].index=tab.index;
        currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tab.id].pinned=tab.pinned;
        currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tab.id].title=tab.title;
        currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tab.id].url=tab.url;
        //modify other indices
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    //figure out something for window closing
    if(currentBrowserState.windows.hasOwnProperty("window"+removeInfo.windowId) && currentBrowserState.windows["window"+removeInfo.windowId].tabs.hasOwnProperty("tab"+tabId)){
//        alert("eventType: Removed\n\nwindowId: " + removeInfo.windowId + "\ntabId: " + tabId + "\nisWindowClosing: " + removeInfo.isWindowClosing);
        var eventObject = {"eventType": "Removed", "windowId": removeInfo.windowId, "tabId": tabId};
        logEvent(eventObject);

        delete currentBrowserState.windows["window"+removeInfo.windowId].tabs["tab"+tabId];
        //modify other indices
    }
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId){
    var tabExists = false;
    var windowId = 0;
    for(chromeWindow in currentBrowserState.windows){
        if(chromeWindow.hasOwnProperty("tab"+removedTabId)){
            tabExists = true;
            windowId = chromeWindow.id;
            break;
        }
    }
    if(tabExists){
//        alert("eventType: Replaced\n\nwindowId: " + windowId + "\ntabId: " + removedTabId + "newTabId: " + addedTabId);
        var eventObject = {"eventType": "Replaced", "windowId": windowId, "tabId": removedTabId, "newTabId": addedTabId};
        logEvent(eventObject);

        currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId]={};
        currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId].id=currentBrowserState.windows["window"+windowId].tabs["tab"+removedTabId].id;
        currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId].index=currentBrowserState.windows["window"+windowId].tabs["tab"+removedTabId].index;
        currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId].pinned=currentBrowserState.windows["window"+windowId].tabs["tab"+removedTabId].pinned;
        currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId].title=currentBrowserState.windows["window"+windowId].tabs["tab"+removedTabId].title;
        currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId].url=currentBrowserState.windows["window"+windowId].tabs["tab"+removedTabId].url;
        delete currentBrowserState.windows["window"+windowId].tabs["tab"+addedTabId];
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+activeInfo.windowId) && currentBrowserState.windows["window"+activeInfo.windowId].tabs.hasOwnProperty("tab"+activeInfo.tabId)){
//        alert("eventType: Activated\n\nwindowId: " + activeInfo.windowId + "\ntabId: " + activeInfo.tabId);
        var eventObject = {"eventType": "Activated", "windowId": activeInfo.windowId, "tabId": activeInfo.tabId};
        logEvent(eventObject);

        currentBrowserState.windows["window"+activeInfo.windowId].activeTab=activeInfo.tabId;
    }
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+moveInfo.windowId) && currentBrowserState.windows["window"+moveInfo.windowId].tabs.hasOwnProperty("tab"+tabId)){
//        alert("eventType: Moved\n\nwindowId: " + moveInfo.windowId + "\ntabId: " + tabId + "\nfromIndex: " + moveInfo.fromIndex + "\ntoIndex: " + moveInfo.toIndex);
        var eventObject = {"eventType": "Moved", "windowId": moveInfo.windowId, "tabId": tabId, "fromIndex": moveInfo.fromIndex, "toIndex": moveInfo.toIndex};
        logEvent(eventObject);
        //update currentBrowserState
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){ // doesn't always fire when you navigate to google.com
    if(!tab.incognito && currentBrowserState.windows.hasOwnProperty("window"+tab.windowId) && currentBrowserState.windows["window"+tab.windowId].tabs.hasOwnProperty("tab"+tabId)){
//        alert("Updated\n\ntabId: " + tabId + "\n\nstatus: " + changeInfo.status + "\nurl: " + changeInfo.url + "\npinned: " + changeInfo.pinned + "\nfaviconUrl: " + changeInfo.faviconUrl + "\n\ntitle: " + tab.title + "\nincognito: " + tab.incognito);
        if(changeInfo.hasOwnProperty("pinned")){
            if(changeInfo.pinned){
                var eventObject = {"eventType": "Pinned", "windowId": tab.windowId, "tabId": tabId};
                logEvent(eventObject);

                currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].pinned=true;
            }else{
                var eventObject = {"eventType": "Unpinned", "windowId": tab.windowId, "tabId": tabId};
                logEvent(eventObject);

                currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].pinned=false;
            }
        }
        if(tab.title != currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].title){
            var eventObject = {"eventType": "Retitled", "windowId": tab.windowId, "tabId": tabId, "title": tab.title};
            logEvent(eventObject);

            currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].title=tab.title;
        }
        if(changeInfo.hasOwnProperty("url") && changeInfo.url != currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].url){
            var eventObject = {"eventType": "Navigated", "windowId": tab.windowId, "tabId": tabId, "url": changeInfo.url};
            logEvent(eventObject);

            currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].url=changeInfo.url;
        }
    }
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+detachInfo.oldWindowId) && currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs.hasOwnProperty("tab"+tabId)){
//        alert("eventType: Detached\n\noldWindowId: " + detachInfo.oldWindowId + "\ntabId: " + tabId + "\noldPosition: " + detachInfo.oldPosition);
        var eventObject = {"eventType": "Detached", "windowId": detachInfo.oldWindowId, "tabId": tabId, "position": detachInfo.oldPosition};
        logEvent(eventObject);

        currentBrowserState["tab"+tabId]={};
        currentBrowserState["tab"+tabId].id=currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs["tab"+tabId].id;
        currentBrowserState["tab"+tabId].pinned=currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs["tab"+tabId].pinned;
        currentBrowserState["tab"+tabId].title=currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs["tab"+tabId].title;
        currentBrowserState["tab"+tabId].url=currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs["tab"+tabId].url;
        delete currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs["tab"+tabId];
        //modify other indices
    }
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
    if(currentBrowserState.hasOwnProperty("tab"+tabId)){
//        alert("eventType: Attached\n\nnewWindowId: " + attachInfo.newWindowId + "\ntabId: " + tabId + "\nnewPosition: " + attachInfo.newPosition);
        var eventObject = {"eventType": "Attached", "windowId": attachInfo.newWindowId, "tabId": tabId, "position": attachInfo.newPosition};
        logEvent(eventObject);

        if(!currentBrowserState.windows.hasOwnProperty("window"+attachInfo.newWindowId)){
            currentBrowserState.windows["window"+attachInfo.newWindowId]={};
            currentBrowserState.windows["window"+attachInfo.newWindowId].id=attachInfo.newWindowId;
            currentBrowserState.windows["window"+attachInfo.newWindowId].tabs={};
        }
        currentBrowserState.windows["window"+attachInfo.newWindowId].activeTab=tabId; // I think this is how it should work, it doesn't seem to fire an activated event here.
        currentBrowserState.windows["window"+attachInfo.newWindowId].tabs["tab"+tabId]={};
        currentBrowserState.windows["window"+attachInfo.newWindowId].tabs["tab"+tabId].id=currentBrowserState["tab"+tabId].id;
        currentBrowserState.windows["window"+attachInfo.newWindowId].tabs["tab"+tabId].index=attachInfo.newPosition;
        currentBrowserState.windows["window"+attachInfo.newWindowId].tabs["tab"+tabId].pinned=currentBrowserState["tab"+tabId].pinned;
        currentBrowserState.windows["window"+attachInfo.newWindowId].tabs["tab"+tabId].title=currentBrowserState["tab"+tabId].title;
        currentBrowserState.windows["window"+attachInfo.newWindowId].tabs["tab"+tabId].url=currentBrowserState["tab"+tabId].url;
        delete currentBrowserState["tab"+tabId];
        //modify other indices
    }
});
//auto snapshot every <1000 events -- maximum recursion depth is 1000
//recreate browser state

var eventNum;
var currentBrowserState = {};

chrome.tabs.query({},function(tabs){
//    chrome.storage.local.clear();
    currentBrowserState.tabs = {};
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

function logEvent(eventObject){
    eventObject.timestamp=Date.now();
    var store={};
    store["Event"+eventNum]=eventObject;
    chrome.storage.local.set(store);
    ++eventNum;
    chrome.storage.local.set({"numEvents": eventNum});
    playEvent(currentBrowserState, eventObject);
}

chrome.tabs.onCreated.addListener(function(tab){
    if(!tab.incognito){
        var eventObject = {"eventType": "Created", "windowId": tab.windowId, "tabId": tab.id, "index": tab.index, "pinned": tab.pinned, "title": tab.title, "url": tab.url};
        logEvent(eventObject);
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+removeInfo.windowId) && currentBrowserState.windows["window"+removeInfo.windowId].tabs.hasOwnProperty("tab"+tabId)){
        var eventObject = {"eventType": "Removed", "windowId": removeInfo.windowId, "tabId": tabId};
        logEvent(eventObject);
    }
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId){
    var tabExists = false;
    var windowId = 0;
    for(var chromeWindow in currentBrowserState.windows){
        if(currentBrowserState.windows[chromeWindow].tabs.hasOwnProperty("tab"+removedTabId)){
            tabExists = true;
            windowId = currentBrowserState.windows[chromeWindow].id;
            break;
        }
    }
    if(tabExists){
        var eventObject = {"eventType": "Replaced", "windowId": windowId, "tabId": removedTabId, "newTabId": addedTabId};
        logEvent(eventObject);
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+activeInfo.windowId) && currentBrowserState.windows["window"+activeInfo.windowId].tabs.hasOwnProperty("tab"+activeInfo.tabId)){
        var eventObject = {"eventType": "Activated", "windowId": activeInfo.windowId, "tabId": activeInfo.tabId};
        logEvent(eventObject);
    }
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+moveInfo.windowId) && currentBrowserState.windows["window"+moveInfo.windowId].tabs.hasOwnProperty("tab"+tabId)){
        var eventObject = {"eventType": "Moved", "windowId": moveInfo.windowId, "tabId": tabId, "fromIndex": moveInfo.fromIndex, "toIndex": moveInfo.toIndex};
        logEvent(eventObject);
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){ // doesn't always fire when you navigate to google.com
    if(!tab.incognito && currentBrowserState.windows.hasOwnProperty("window"+tab.windowId) && currentBrowserState.windows["window"+tab.windowId].tabs.hasOwnProperty("tab"+tabId)){
        if(changeInfo.hasOwnProperty("pinned")){
            if(changeInfo.pinned){
                var eventObject = {"eventType": "Pinned", "windowId": tab.windowId, "tabId": tabId};
                logEvent(eventObject);
            }else{
                var eventObject = {"eventType": "Unpinned", "windowId": tab.windowId, "tabId": tabId};
                logEvent(eventObject);
            }
        }
        if(tab.title != currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].title){
            var eventObject = {"eventType": "Retitled", "windowId": tab.windowId, "tabId": tabId, "title": tab.title};
            logEvent(eventObject);
        }
        if(changeInfo.hasOwnProperty("url") && changeInfo.url != currentBrowserState.windows["window"+tab.windowId].tabs["tab"+tabId].url){
            var eventObject = {"eventType": "Navigated", "windowId": tab.windowId, "tabId": tabId, "url": changeInfo.url};
            logEvent(eventObject);
        }
    }
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
    if(currentBrowserState.windows.hasOwnProperty("window"+detachInfo.oldWindowId) && currentBrowserState.windows["window"+detachInfo.oldWindowId].tabs.hasOwnProperty("tab"+tabId)){
        var eventObject = {"eventType": "Detached", "windowId": detachInfo.oldWindowId, "tabId": tabId, "position": detachInfo.oldPosition};
        logEvent(eventObject);
    }
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
    if(currentBrowserState.tabs.hasOwnProperty("tab"+tabId)){
        var eventObject = {"eventType": "Attached", "windowId": attachInfo.newWindowId, "tabId": tabId, "position": attachInfo.newPosition};
        logEvent(eventObject);
    }
});
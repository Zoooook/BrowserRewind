var eventNum;
var browserState = {};

chrome.tabs.query({},function(tabs){
//    chrome.storage.local.clear();
//    alert("Snapshotting");
    browserState["timestamp"]=Date.now();
    //eventIndex goes here
    browserState["windows"]={};
    for(var i=0; i<tabs.length; ++i){
        if(!tabs[i].incognito){
            if(!browserState["windows"].hasOwnProperty("window"+tabs[i].windowId)){
                browserState["windows"]["window"+tabs[i].windowId]={};
                browserState["windows"]["window"+tabs[i].windowId]["id"]=tabs[i].windowId;
                browserState["windows"]["window"+tabs[i].windowId]["tabs"]={};
            }
            if(tabs[i].active)
                browserState["windows"]["window"+tabs[i].windowId]["activeTab"]=tabs[i].id;
            browserState["windows"]["window"+tabs[i].windowId]["tabs"]["tab"+tabs[i].id]={};
            browserState["windows"]["window"+tabs[i].windowId]["tabs"]["tab"+tabs[i].id].id=tabs[i].id;
            browserState["windows"]["window"+tabs[i].windowId]["tabs"]["tab"+tabs[i].id].index=tabs[i].index;
            browserState["windows"]["window"+tabs[i].windowId]["tabs"]["tab"+tabs[i].id].pinned=tabs[i].pinned;
            browserState["windows"]["window"+tabs[i].windowId]["tabs"]["tab"+tabs[i].id].title=tabs[i].title;
            browserState["windows"]["window"+tabs[i].windowId]["tabs"]["tab"+tabs[i].id].url=tabs[i].url;
        }
    }
    chrome.storage.local.get("numSnapshots",function(result){
        if(result.numSnapshots==undefined){
            browserState["eventIndex"]=0;
            chrome.storage.local.set({"Snapshot0": browserState});
            chrome.storage.local.set({"numSnapshots": 1});
            chrome.storage.local.set({"numEvents": 0});
            eventNum=0;
            chrome.storage.local.set({"timestamps": [browserState["timestamp"]]});
        }else{
            chrome.storage.local.get("numEvents",function(result2){
                eventNum=result2.numEvents;
                browserState["eventIndex"]=result2.numEvents;
                var store={};
                store["Snapshot"+result.numSnapshots]=browserState;
                chrome.storage.local.set(store);
                chrome.storage.local.set({"numSnapshots": result.numSnapshots+1});
            });
            chrome.storage.local.get("timestamps",function(result2){
                result2.timestamps.push(browserState["timestamp"]);
                chrome.storage.local.set({"timestamps": result2.timestamps});
            });
        }
    });
});

chrome.browserAction.onClicked.addListener(function(tab) {
    var optionsUrl = chrome.extension.getURL('options.html');
    chrome.tabs.query({ url: optionsUrl }, function(results) {
        if (results.length) chrome.tabs.update(results[0].id, {active:true});
        else chrome.tabs.create({url:optionsUrl});
    });
});

function displayTabInfo(tab,text){
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
}

function logEvent(eventObject){
    eventObject["timestamp"]=Date.now();
    var store={};
    store["Event"+eventNum]=eventObject;
    chrome.storage.local.set(store);
    ++eventNum;
    chrome.storage.local.set({"numEvents": eventNum});
}

chrome.tabs.onCreated.addListener(function(tab){
    if(!tab.incognito){
//        alert("eventType: Created\n\nwindowId: " + tab.windowId + "\ntabId: " + tab.id + "\nindex: " + tab.index + "\nurl: " + tab.url + "\ntitle: " + tab.title);
        var eventObject = {"eventType": "Created", "windowId": tab.windowId, "tabId": tab.id, "index": tab.index, "url": tab.url};
        logEvent(eventObject);
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    //figure out something for window closing
    if(browserState["windows"].hasOwnProperty("window"+removeInfo.windowId)){
//        alert("eventType: Removed\n\nwindowId: " + removeInfo.windowId + "\ntabId: " + tabId + "\nisWindowClosing: " + removeInfo.isWindowClosing);
        var eventObject = {"eventType": "Removed", "windowId": removeInfo.windowId, "tabId": tabId};
        logEvent(eventObject);
    }
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId){
    var tabExists = false;
    var windowId = 0;
    for(chromeWindow in browserState["windows"]){
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
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    if(browserState["windows"].hasOwnProperty("window"+activeInfo.windowId)){
//        alert("eventType: Activated\n\nwindowId: " + activeInfo.windowId + "\ntabId: " + activeInfo.tabId);
        var eventObject = {"eventType": "Activated", "windowId": activeInfo.windowId, "tabId": activeInfo.tabId};
        logEvent(eventObject);
    }
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
    if(browserState["windows"].hasOwnProperty("window"+moveInfo.windowId)){
//        alert("eventType: Moved\n\nwindowId: " + moveInfo.windowId + "\ntabId: " + tabId + "\nfromIndex: " + moveInfo.fromIndex + "\ntoIndex: " + moveInfo.toIndex);
        var eventObject = {"eventType": "Moved", "windowId": moveInfo.windowId, "tabId": tabId, "fromIndex": moveInfo.fromIndex, "toIndex": moveInfo.toIndex};
        logEvent(eventObject);
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){ // doesn't always fire when you navigate to google.com
    if(!tab.incognito){
//        alert("Updated\n\ntabId: " + tabId + "\n\nstatus: " + changeInfo.status + "\nurl: " + changeInfo.url + "\npinned: " + changeInfo.pinned + "\nfaviconUrl: " + changeInfo.faviconUrl + "\n\ntitle: " + tab.title + "\nincognito: " + tab.incognito);
        if(changeInfo.hasOwnProperty("pinned")){
            if(changeInfo.pinned){
                var eventObject = {"eventType": "Pinned", "windowId": tab.windowId, "tabId": tabId};
                logEvent(eventObject);
            }else{
                var eventObject = {"eventType": "Unpinned", "windowId": tab.windowId, "tabId": tabId};
                logEvent(eventObject);
            }
        }
        if(changeInfo.hasOwnProperty("url") && changeInfo.url != browserState["windows"]["window"+tab.windowId]["tabs"]["tab"+tabId].url){
            var eventObject = {"eventType": "Navigated", "windowId": tab.windowId, "tabId": tabId, "url": changeInfo.url};
            logEvent(eventObject);
        }
        if(tab.title != browserState["windows"]["window"+tab.windowId]["tabs"]["tab"+tabId].title){
            var eventObject = {"eventType": "Retitled", "windowId": tab.windowId, "tabId": tabId, "title": tab.title};
            logEvent(eventObject);
        }
    }
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
    if(browserState["windows"].hasOwnProperty("window"+detachInfo.oldWindowId)){
//        alert("eventType: Detached\n\noldWindowId: " + detachInfo.oldWindowId + "\ntabId: " + tabId + "\noldPosition: " + detachInfo.oldPosition);
        var eventObject = {"eventType": "Detached", "oldWindowId": detachInfo.oldWindowId, "tabId": tabId, "oldPosition": detachInfo.oldPosition};
        logEvent(eventObject);
    }
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
    if(browserState["windows"].hasOwnProperty("window"+attachInfo.newWindowId)){
//        alert("eventType: Attached\n\nnewWindowId: " + attachInfo.newWindowId + "\ntabId: " + tabId + "\nnewPosition: " + attachInfo.newPosition);
        var eventObject = {"eventType": "Attached", "newWindowId": attachInfo.newWindowId, "tabId": tabId, "newPosition": attachInfo.newPosition};
        logEvent(eventObject);
    }
});
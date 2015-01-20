function playEvent(browserState, eventI){
    if(eventI.eventType=="Created"){
        if(!browserState.windows.hasOwnProperty("window"+eventI.windowId)){
            browserState.windows["window"+eventI.windowId]={};
            browserState.windows["window"+eventI.windowId].id=eventI.windowId;
            browserState.windows["window"+eventI.windowId].tabs={};
        }else
            for(var tabI in browserState.windows["window"+eventI.windowId].tabs)
                if(browserState.windows["window"+eventI.windowId].tabs[tabI].index >= eventI.index)
                    ++browserState.windows["window"+eventI.windowId].tabs[tabI].index;

        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId]={};
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].id=eventI.tabId;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].index=eventI.index;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].pinned=eventI.pinned;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].title=eventI.title;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].url=eventI.url;
    }else if(eventI.eventType=="Removed"){
        var numTabs=0;
        for(var tabI in browserState.windows["window"+eventI.windowId].tabs){
            ++numTabs;
            if(browserState.windows["window"+eventI.windowId].tabs[tabI].index > browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].index)
                --browserState.windows["window"+eventI.windowId].tabs[tabI].index;
        }

        if(numTabs>1)
            delete browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId];
        else
            delete browserState.windows["window"+eventI.windowId];
    }else if(eventI.eventType=="Replaced"){
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.newTabId]={};
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.newTabId].id=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].id;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.newTabId].index=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].index;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.newTabId].pinned=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].pinned;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.newTabId].title=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].title;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.newTabId].url=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].url;
        delete browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId];
    }else if(eventI.eventType=="Activated"){
        browserState.windows["window"+eventI.windowId].activeTab=eventI.tabId;
    }else if(eventI.eventType=="Moved"){
        if(eventI.fromIndex < eventI.toIndex){
            for(var tabI in browserState.windows["window"+eventI.windowId].tabs)
                if(browserState.windows["window"+eventI.windowId].tabs[tabI].index > eventI.fromIndex && browserState.windows["window"+eventI.windowId].tabs[tabI].index <= eventI.toIndex)
                    --browserState.windows["window"+eventI.windowId].tabs[tabI].index;
        }else{
            for(var tabI in browserState.windows["window"+eventI.windowId].tabs)
                if(browserState.windows["window"+eventI.windowId].tabs[tabI].index < eventI.fromIndex && browserState.windows["window"+eventI.windowId].tabs[tabI].index >= eventI.toIndex)
                    ++browserState.windows["window"+eventI.windowId].tabs[tabI].index;
        }
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].index=eventI.toIndex
    }else if(eventI.eventType=="Pinned"){
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].pinned=true;
    }else if(eventI.eventType=="Unpinned"){
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].pinned=false;
    }else if(eventI.eventType=="Retitled"){
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].title=eventI.title;
    }else if(eventI.eventType=="Navigated"){
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].url=eventI.url;
    }else if(eventI.eventType=="Detached"){
        var numTabs=0;
        for(var tabI in browserState.windows["window"+eventI.windowId].tabs){
            ++numTabs;
            if(browserState.windows["window"+eventI.windowId].tabs[tabI].index > eventI.position)
                --browserState.windows["window"+eventI.windowId].tabs[tabI].index;
        }
        browserState.tabs["tab"+eventI.tabId]={};
        browserState.tabs["tab"+eventI.tabId].id=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].id;
        browserState.tabs["tab"+eventI.tabId].pinned=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].pinned;
        browserState.tabs["tab"+eventI.tabId].title=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].title;
        browserState.tabs["tab"+eventI.tabId].url=browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].url;
        if(numTabs>1)
            delete browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId];
        else
            delete browserState.windows["window"+eventI.windowId];
    }else if(eventI.eventType=="Attached"){
        if(browserState.windows.hasOwnProperty("window"+eventI.windowId)){
            for(var tabI in browserState.windows["window"+eventI.windowId].tabs)
                if(browserState.windows["window"+eventI.windowId].tabs[tabI].index >= eventI.position)
                    ++browserState.windows["window"+eventI.windowId].tabs[tabI].index;
        }else{
            browserState.windows["window"+eventI.windowId]={};
            browserState.windows["window"+eventI.windowId].id=eventI.windowId;
            browserState.windows["window"+eventI.windowId].tabs={};
        }
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId]={};
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].id=browserState.tabs["tab"+eventI.tabId].id;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].index=eventI.position;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].pinned=browserState.tabs["tab"+eventI.tabId].pinned;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].title=browserState.tabs["tab"+eventI.tabId].title;
        browserState.windows["window"+eventI.windowId].tabs["tab"+eventI.tabId].url=browserState.tabs["tab"+eventI.tabId].url;
        delete browserState.tabs["tab"+eventI.tabId];
    }
}

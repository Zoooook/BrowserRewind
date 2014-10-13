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
        chrome.storage.local.get(snapshotNum, function (result) {
            if(result[snapshotNum]==undefined)
                $("#snapshot").html("<p><b>Nope!</b></p>");
            else{
                console.log(result[snapshotNum]);
                $("#snapshot").html(snapshotNum + ":<ul id=\"chromeWindows\"><li>Timestamp: " + result[snapshotNum].timestamp + "</li><p></p><li>eventIndex: " + result[snapshotNum].eventIndex + "</li><p></p></ul>");
                for(chromeWindow in result[snapshotNum].windows){
                    $("#chromeWindows").append("<li>"+chromeWindow+"</li><ul><br/><li>Active Tab: "+result[snapshotNum].windows[chromeWindow].activeTab+"</li><p></p><li>Tabs:</li><ul id="+chromeWindow+"></ul></ul><br/>");
                    for(tab in result[snapshotNum].windows[chromeWindow].tabs){
                        for(key in result[snapshotNum].windows[chromeWindow].tabs[tab]){
                            $("#"+chromeWindow).append("<li>"+key+": "+result[snapshotNum].windows[chromeWindow].tabs[tab][key]+"</li>");
                        }
                        $("#"+chromeWindow).append("<p></p>");
                    }
                }
            }
        });
    });

    $("#timestampbutton").on('click',function(){
        var z = parseInt($("#timestamptextbox").val());
        chrome.storage.local.get("timestamps", function(result){
            var t = findSnapshot(z,result.timestamps);

            var x = false;
            if(t==-1){
                if(z<result.timestamps[0])
                    x = true;
                alert(t+": \n : "+z+"\n"+0+": "+result.timestamps[0]+"\n"+x);
            }else if(t+1<result.timestamps.length){
                if(result.timestamps[t]<z && z<result.timestamps[t+1])
                    x = true;
                alert(t+": "+result.timestamps[t]+"\n : "+z+"\n"+(t+1)+": "+result.timestamps[t+1]+"\n"+x);
            }else{
                if(result.timestamps[t]<z)
                    x = true;
                alert(t+": "+result.timestamps[t]+"\n : "+z+"\n"+x);
            }
        });
    });
});

function findSnapshot(timestamp,timestamps){ // binary search
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
$(function(){
    chrome.storage.local.get("numSnapshots", function(result){
        $("#numSnapshots").html("numSnapshots: " + result.numSnapshots);
    });
    
    chrome.storage.local.get("numEvents", function(result){
        $("#numEvents").html("numEvents: " + result.numEvents);
    });
    
    chrome.storage.local.get("timestamps", function(result){
        $("#timestamps").html("timestamps:<ul id=timestampArray></ul>");
        for(var i=0; i<result["timestamps"].length; ++i){
            $("#timestampArray").append("<li>" + result["timestamps"][i] + "</li>");
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
                for(chromeWindow in result[snapshotNum]["windows"]){
                    $("#chromeWindows").append("<li>"+chromeWindow+"</li><ul><li>Active Tab: "+result[snapshotNum]["windows"][chromeWindow].activeTab+"</li><p></p><li>Tabs:</li><ul id="+chromeWindow+"></ul></ul><br/>");
                    for(tab in result[snapshotNum]["windows"][chromeWindow]["tabs"]){
                        for(key in result[snapshotNum]["windows"][chromeWindow]["tabs"][tab]){
                            $("#"+chromeWindow).append("<li>"+key+": "+result[snapshotNum]["windows"][chromeWindow]["tabs"][tab][key]+"</li>");
                        }
                        $("#"+chromeWindow).append("<p></p>");
                    }
                }
            }
        });
    });
});
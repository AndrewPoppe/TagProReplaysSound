
chrome.pageAction.onClicked.addListener((tab) => {
	console.log(tab)
    chrome.tabs.create({
        url: "src/html/page_action.html",
        index: tab.index + 1
    });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.type === 'view') {
        chrome.pageAction.show(sender.tab.id);
        sendResponse({message: "TagPro Replays Sounds loaded."});
    }
});
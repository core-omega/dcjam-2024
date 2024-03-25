let overlayQueue = [];
let overlayTimes = [];
let isShowing = false;

function PendingOverlay() {
    return (overlayQueue.length != 0);
}

function UpdateOverlay() {
    isShowing = true;
    if(overlayQueue.length == 0) {
        document.getElementById('overlay').style.height = '0';
        overlayQueue = [];
        overlayTimes = [];  
        document.getElementById('overlay-content').innerHTML = '';
        isShowing = false;
        return;
    }

    let nextItem = overlayQueue.shift();
    let nextTime = overlayTimes.shift();

    document.getElementById('overlay').style.height = '100%';
    document.getElementById('overlay-content').innerHTML = nextItem;
    console.log("[overlay] Update via setTimeout(" + nextTime + ");");
    setTimeout(UpdateOverlay, nextTime);
}

function ShowOverlay(text, time) {
    overlayQueue.push(text);
    overlayTimes.push(Math.floor(time * 1000.0));
    if(!isShowing) {
        console.log("[overlay] Triggering overlay update.");
        UpdateOverlay();
    }
}

function ForceShowOverlay(text) {
    document.getElementById('overlay').style.height = '100%';
    document.getElementById('overlay-content').innerHTML = text;
}

function ForceHideOverlay() {
    document.getElementById('overlay').style.height = '0';
    document.getElementById('overlay-content').innerHTML = '';
}

function ShowInventory() {
    document.getElementById('inventory').style.display = 'inline';
    document.getElementById('inventory').style.height = '100%';
}

function HideInventory() {
    document.getElementById('inventory').style.height = '0';
    document.getElementById('inventory').style.display = 'none';
}

function ShowCharacter() {
    document.getElementById('character').style.display = 'inline';
    document.getElementById('character').style.height = '100%';
}

function HideCharacter() {
    document.getElementById('character').style.height = '0';
    document.getElementById('character').style.display = 'none';
}

function WriteLog(msg) {
    logOutput.push(msg);
    if(logOutput.length > 4) {
        logOutput.splice(0, 1);
    }
    let display = document.getElementById('text-display');
    let html = "";
    for(var i = 0; i < logOutput.length; ++i) {
        html += logOutput[i] + "<br />";
    }
    display.innerHTML = html;
}

let logOutput = [];

export {ShowOverlay, UpdateOverlay, PendingOverlay, ForceShowOverlay, ForceHideOverlay, WriteLog, 
    ShowInventory, HideInventory, ShowCharacter, HideCharacter};

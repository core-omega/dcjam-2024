import { ForceShowOverlay, ForceHideOverlay, WriteLog } from '/modules/display/show.js';
import { CreateRenderManager, GetRenderManager } from '/modules/display/render.js';
import { GetInputManager } from '/modules/world/input.js';
import { GetAudioManager } from '/modules/world/audio.js';
import { GetContentLoadingManager} from '/modules/world/loading.js';
import { GetWorld } from './modules/world/world.js';


function StartLoading() {
    let audio = GetAudioManager();
    audio.loadTrack('Intro');
    audio.loadTrack('Encounter');
    audio.loadTrack('Battle');
    
    audio.loadSound('Selection');
    audio.loadSound('Walk');
    audio.loadSound('Bounce');
    audio.loadSound('UseItem');
    audio.loadSound('Hit');
    audio.loadSound('Hurt');

    let loading = GetContentLoadingManager();
    ForceShowOverlay("Loading assets ...");
    loading.wait(EntryPoint);
}

function EntryPoint() {
    ForceHideOverlay();
    let audio = GetAudioManager();
    audio.loopTrack('Intro');
    GetInputManager().start();

    CreateRenderManager('three-container');
    let render = GetRenderManager();
    render.register('world', GetWorld());
    render.start();
    WriteLog("Welcome to DCRWL.");
}

window.addEventListener('load', () => {
    ForceShowOverlay(" <a id='start-button'>Click here to start the game.</a>");
    document.getElementById('start-button').addEventListener('click', StartLoading, false);
}, false);

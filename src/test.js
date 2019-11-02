import S2Audio from './audio/audio.js';

const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

const testButton0 = document.getElementById('test-button-0');
const testButton1 = document.getElementById('test-button-1');
const testButton2 = document.getElementById('test-button-2');
const testButton3 = document.getElementById('test-button-3');
const testButton4 = document.getElementById('test-button-4');
const testButton5 = document.getElementById('test-button-5');
const testButton6 = document.getElementById('test-button-6');
const testButton7 = document.getElementById('test-button-7');
const testButton8 = document.getElementById('test-button-8');
const testButton9 = document.getElementById('test-button-9');

const s2Audio = new S2Audio();
// console.log('s2Audio:', s2Audio);

startButton.addEventListener('click', (e) => {
    // console.log('e:', e)
    s2Audio.init();

    s2Audio.keysOn();
    const voiceName = s2Audio.newVoice('voice1');
    const voice = s2Audio.getVoice(voiceName);
    // voice.setOption('unison', 3);
    voice.setOption('unisonSpread', .1);
    voice.setOption('useEnvelope', false);
    voice.setOption('release', 2);

    const filterName = s2Audio.newFilter('filter1');
    const filter = s2Audio.getFilter(filterName);
    filter.setOption('frequency', 300);
    filter.setOption('Q', 7);

    const LFOName = s2Audio.newLFO('lfo1');
    const LFO = s2Audio.getLFO(LFOName);
    LFO.setFrequency(30);
    LFO.setAmplitude(5);

    // s2Audio.addConnection(LFOName, filterName, 'frequency');
    s2Audio.addConnection(LFOName, voiceName, 'detune');

    const LFO2Name = s2Audio.newLFO('lfo2');
    const LFO2 = s2Audio.getLFO(LFO2Name);
    LFO2.setFrequency(3);
    LFO2.setAmplitude(1000);

    // s2Audio.addConnection(LFO2Name, filterName, 'frequency');

    const envelopeName = s2Audio.newEnvelope('envelope1');
    const envelope = s2Audio.getEnvelope(envelopeName);
    envelope.setOption('attack', 0.01);
    envelope.setOption('decay', 0.08);
    envelope.setOption('scale', 16000);
    envelope.setOption('sustain', 0.0);
    envelope.setOption('release', 0.5);
    envelope.setOption('length', 0.0);

    // s2Audio.addConnection(envelopeName, LFOName, 'frequency');
    s2Audio.addConnection(envelopeName, filterName, 'frequency');
    s2Audio.addConnection(LFO2Name, filterName, 'frequency');

    s2Audio.addAudioConnection(voiceName, filterName);

    testButton0.addEventListener('click', () => {
        s2Audio.removeConnection(envelopeName, LFOName, 'frequency');
    });
});
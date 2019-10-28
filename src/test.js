import S2Audio from './audio/audio.js';

const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');



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
    voice.setOption('useEnvelope', true);
    voice.setOption('release', 2);

    const filterName = s2Audio.newFilter('filter1');
    const filter = s2Audio.getFilter(filterName);
    filter.setOption('frequency', 600);
    filter.setOption('Q', 4);

    const LFOName = s2Audio.newLFO('lfo1');
    const LFO = s2Audio.getLFO(LFOName);
    LFO.setFrequency(3);
    LFO.setAmplitude(5);

    // s2Audio.addConnection(LFOName, filterName, 'frequency');
    s2Audio.addConnection(LFOName, voiceName, 'detune');

    const LFO2Name = s2Audio.newLFO('lfo2');
    const LFO2 = s2Audio.getLFO(LFO2Name);
    LFO2.setFrequency(10);
    LFO2.setAmplitude(400);

    // s2Audio.addConnection(LFO2Name, filterName, 'frequency');

    const envelopeName = s2Audio.newEnvelope('envelope1');
    const envelope = s2Audio.getEnvelope(envelopeName);
    envelope.setOption('attack', 3.51);
    envelope.setOption('decay', 1.0);
    envelope.setOption('scale', 2000);
    envelope.setOption('sustain', 0.0);
    envelope.setOption('release', 0.5);
    envelope.setOption('length', 4.8);

    s2Audio.addConnection(envelopeName, LFOName, 'frequency');
    s2Audio.addConnection(envelopeName, LFOName, 'frequency');
    s2Audio.addConnection(envelopeName, LFOName, 'amplitude');

    s2Audio.addAudioConnection(voiceName, filterName);
});
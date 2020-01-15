const notePlannerInterval = 100; // Delay between planning notes
const notePlannerBuffer = .25; // Notes are plannesd this far in advance (in seconds)

/**
 * Uses a sequence to play notes on a Voice NOT EVEN CLOSE TO FINISHED
 */
class NotePlanner {
    /**
     * Create a new NotePlanner
     * @param {NoteSequence} sequence Sequence of notes to play
     * @param {Voice} voice Voice to play the notes with
     * @param {AudioDestinationNode} destination Final destination of sound signal
     */
    constructor(context, sequence, voice, destination) {
        this.context = context;
        this.voice = voice;
        this.sequence = [...sequence];
        this.destination = destination;

        this.remaining = [];
        this.startTime = this.context.currentTime;
        this.running = false;
        this.plan = this.plan.bind(this);
    }

    /**
     * Start playing the sequence right now
     */
    start () {
        this.running = true;
        this.startTime = this.context.currentTime;
        this.remaining = [...this.sequence];
        this.plan();
    }

    /**
     * Plan the notes
     * @private
     */
    plan() {

        if (!this.remaining.length) return;
        let note = this.remaining[0];
        let i = 0;
        while (note && note.start + this.startTime < this.context.currentTime + notePlannerBuffer) {

            this.voice.play(note.freq, this.destination, this.startTime + note.start, this.startTime + note.stop);

            ++i;
            note = this.remaining[i];
        }

        console.log('Planned ' + i + ' notes.');

        this.remaining.splice(0, i);

        if (this.running)
            setTimeout(this.plan, notePlannerInterval);
    }

    stop() {
        this.running = false;
    }

    setName(name) {
        this.name = name;
    }
}

export default NotePlanner;
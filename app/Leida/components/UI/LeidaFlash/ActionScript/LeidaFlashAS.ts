import { gsap } from 'gsap';

export default class LeidaFlashAS {
    private onDone?: () => void;
    private mc?: React.RefObject<any>;

    constructor(onDone?: () => void, mcRef?: React.RefObject<any>) {
        this.onDone = onDone;
        this.mc = mcRef;

    }

    init() {
        console.log('LeidaFlashAS init');
        if (this.onDone) {
            this.onDone();
        }
    }

    fadeIn() {
        if (this.mc?.current) {
            gsap.fromTo(this.mc.current, {
                opacity: 0
            }, {
                opacity: 1, duration: 0.8
            });
        }
    }

    fadeOut() {
        if (this.mc?.current) {
            gsap.fromTo(this.mc.current, {
                opacity: 1
            }, {
                opacity: 0, duration: 0.8
            });
        }
    }

    destroy() {
        console.log('LeidaFlashAS destroyed');
    }
}

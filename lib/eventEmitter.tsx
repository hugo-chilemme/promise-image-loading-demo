import { EventEmitter2 } from 'eventemitter2';

export default class EventEmitter extends EventEmitter2 {
	constructor() {
		super({
			wildcard: true, // Enable support for wildcard events if needed
			maxListeners: 10, // Set the maximum number of listeners (default is 10)
		});
	}
}

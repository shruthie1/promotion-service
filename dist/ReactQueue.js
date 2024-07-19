"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactQueue = void 0;
class ReactQueue {
    constructor() {
        this.items = [];
        this.maxSize = 7;
    }
    static getInstance() {
        if (!ReactQueue.instance) {
            ReactQueue.instance = new ReactQueue();
        }
        return ReactQueue.instance;
    }
    push(item) {
        while (this.items.length >= this.maxSize) {
            this.items.shift();
        }
        this.items.push(item);
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.pop();
        }, 100000); // 1 minute
    }
    pop() {
        if (this.items.length === 0) {
            return undefined;
        }
        const item = this.items.shift();
        return item;
    }
    contains(item) {
        return this.items.indexOf(item) !== -1;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    isFull() {
        return this.items.length === this.maxSize;
    }
}
exports.ReactQueue = ReactQueue;

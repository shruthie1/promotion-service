export class ReactQueue {
    private static instance: ReactQueue;
    private items: string[] = [];
    private maxSize = 7;
    private timer: NodeJS.Timeout;

    private constructor() { }

    public static getInstance(): ReactQueue {
        if (!ReactQueue.instance) {
            ReactQueue.instance = new ReactQueue();
        }
        return ReactQueue.instance;
    }

    public push(item: string) {
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

    public pop() {
        if (this.items.length === 0) {
            return undefined;
        }

        const item = this.items.shift();
        return item;
    }

    public contains(item: string) {
        return this.items.indexOf(item) !== -1;
    }

    public isEmpty() {
        return this.items.length === 0;
    }

    public isFull() {
        return this.items.length === this.maxSize;
    }
}

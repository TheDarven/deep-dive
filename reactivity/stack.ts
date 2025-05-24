export default class Stack<T> {
    private items: T[] = [];

    push(item: T): void {
        this.items.push(item);
    }

    pop(): T {
        if (this.items.length === 0) {
            throw new Error("[Stack] Cannot pop from an empty stack");
        }

        return this.items.pop()!;
    }

    peek(): T {
        if (this.items.length === 0) {
            throw new Error("[Stack] Cannot peek on an empty stack");
        }

        return this.items[this.items.length - 1];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}

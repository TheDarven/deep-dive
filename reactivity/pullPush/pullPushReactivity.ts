import Stack from "../stack.ts";

type NotifySubscriberFn = () => void;

const ReactivityContext = {
    notifySubscriberFnStack: new Stack<
        NotifySubscriberFn
    >(),
};

type ComputedTestEvent = "evaluate" | "invalidateCache";
type TestEvent = ComputedTestEvent;

export const ReactivityTestContext = (() => {
    let isTestEnvironment: boolean = false;
    const events: { event: TestEvent; name?: string }[] = [];

    const addEvent = ({ event, name }: { event: TestEvent; name?: string }) => {
        if (isTestEnvironment) {
            events.push({ event, name });
        }
    };

    const clearEvents = () => {
        events.length = 0;
    };

    return {
        get isTestEnvironment() {
            return isTestEnvironment;
        },
        set isTestEnvironment(value: boolean) {
            isTestEnvironment = value;
        },
        events,
        addEvent,
        clearEvents,
    };
})();

function buildDependency(): {
    notifySubscribers: () => void;
    addSubscriberIfNotAlready: () => void;
} {
    const subscribers: NotifySubscriberFn[] = [];

    const notifySubscribers = () => {
        subscribers.forEach((notifySubscriberFn) => notifySubscriberFn());
    };

    const addSubscriberIfNotAlready = () => {
        if (
            ReactivityContext.notifySubscriberFnStack.isEmpty() ||
            subscribers.includes(
                ReactivityContext.notifySubscriberFnStack.peek(),
            )
        ) {
            return;
        }

        subscribers.push(
            ReactivityContext.notifySubscriberFnStack.peek(),
        );
    };

    return {
        notifySubscribers,
        addSubscriberIfNotAlready,
    };
}

type RefValue = number | string | boolean | null | undefined;

export function ref<T extends RefValue>(initialValue: T): { value: T } {
    let value: T = initialValue;

    const { notifySubscribers, addSubscriberIfNotAlready } = buildDependency();

    return {
        get value() {
            addSubscriberIfNotAlready();

            return value;
        },
        set value(newValue: T) {
            if (newValue === value) {
                return;
            }

            value = newValue;

            notifySubscribers();
        },
    };
}

export function computed<T>(compute: () => T, options?: { name?: string }) {
    let value: T;

    let isDirty = 0;
    let hasBeenEvaluatedFirstTime = false;
    let amountOfDependencies = 0;

    const { notifySubscribers, addSubscriberIfNotAlready } = buildDependency();

    const markDependancyAsDirtyFn = () => {
        const dependencyIndex = amountOfDependencies++;
        isDirty |= 1 << dependencyIndex;

        return () => {
            if (isDirty & (1 << dependencyIndex)) {
                return;
            }

            ReactivityTestContext.addEvent({
                event: "invalidateCache", // TODO Renommer
                name: options?.name,
            });

            isDirty |= 1 << dependencyIndex;

            notifySubscribers();
            // TODO Ne plus notify subscribers
            // => on notify à l'evaluate si la valeur à changé
            // => ou on recalcule si subscriber est get et que la dépendance est dirty
        };
    };

    const evaluate = () => {
        ReactivityTestContext.addEvent({
            event: "evaluate",
            name: options?.name,
        });

        ReactivityContext.notifySubscriberFnStack.push(
            markDependancyAsDirtyFn(),
        );
        value = compute();
        ReactivityContext.notifySubscriberFnStack.pop();

        isDirty = 0;
        notifySubscribers();
    };

    const evaluateIfNeeded = () => {
        if (isDirty || !hasBeenEvaluatedFirstTime) {
            hasBeenEvaluatedFirstTime = true;
            evaluate();
            return;
        }
    };

    return {
        get value() {
            evaluateIfNeeded();

            addSubscriberIfNotAlready();

            return value;
        },
    };
}

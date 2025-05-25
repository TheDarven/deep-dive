import Stack from "../stack.ts";

type DependencyEffect = {
    notifyValueChange: () => void;
    propagateDirty: () => void;
};

const ReactivityContext = {
    dependencyEffectStack: new Stack<DependencyEffect>(),
};

type ComputedTestEvent = "evaluate" | "markedAsDirty";
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
    propagateDirty: () => void;
    notifyValueChange: () => void;
    registerDependencyIfNotAlready: () => void;
} {
    const subscribers: (() => void)[] = [];
    const dependencies: (() => void)[] = [];

    const propagateDirty = () => {
        dependencies.forEach((notifyDependency) => notifyDependency());
    };

    const notifyValueChange = () => {
        subscribers.forEach((notifySubscriber) => notifySubscriber());
    };

    const registerDependencyIfNotAlready = () => {
        if (ReactivityContext.dependencyEffectStack.isEmpty()) {
            return;
        }

        const dependencyEffect = ReactivityContext.dependencyEffectStack.peek();

        if (!dependencies.includes(dependencyEffect.propagateDirty)) {
            dependencies.push(dependencyEffect.propagateDirty);
        }
    };

    return {
        propagateDirty,
        notifyValueChange,
        registerDependencyIfNotAlready,
    };
}

type RefValue = number | string | boolean | null | undefined;

export function ref<T extends RefValue>(initialValue: T): { value: T } {
    let value: T = initialValue;

    const {
        notifyValueChange,
        propagateDirty,
        registerDependencyIfNotAlready,
    } = buildDependency();

    return {
        get value() {
            registerDependencyIfNotAlready();

            return value;
        },
        set value(newValue: T) {
            if (newValue === value) {
                return;
            }

            value = newValue;

            propagateDirty();
            notifyValueChange();
        },
    };
}

export function computed<T>(compute: () => T, options?: { name?: string }) {
    let value: T;

    let isDirty = true;

    const {
        notifyValueChange,
        propagateDirty,
        registerDependencyIfNotAlready,
    } = buildDependency();

    const markAsDirtyAndPropagate = () => {
        if (isDirty) {
            return;
        }

        ReactivityTestContext.addEvent({
            event: "markedAsDirty",
            name: options?.name,
        });

        isDirty = true;

        propagateDirty();
    };

    const evaluate = () => {
        ReactivityTestContext.addEvent({
            event: "evaluate",
            name: options?.name,
        });

        ReactivityContext.dependencyEffectStack.push({
            notifyValueChange,
            propagateDirty: markAsDirtyAndPropagate,
        });
        const newValue = compute();
        ReactivityContext.dependencyEffectStack.pop();

        isDirty = false;
        if (newValue !== value) {
            value = newValue;
            propagateDirty();
            notifyValueChange();
        }
    };

    const evaluateIfNeeded = () => {
        if (isDirty) {
            evaluate();
        }
    };

    return {
        get value() {
            evaluateIfNeeded();

            registerDependencyIfNotAlready();

            return value;
        },
    };
}

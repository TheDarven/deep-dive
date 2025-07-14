import { activeSubscriber, ComputedDependency } from "./dependency";
import type { Dependency, Ref } from "./ref";
import type { Subscriber } from "./subscriber";

type ComputedGetter<T> = (oldValue?: T) => T;

interface ComputedRef<T = any> extends Ref<T, T> {
  readonly value: T
}

export function computed<T>(
  getter: ComputedGetter<T>
): ComputedRef<T> {
  return new ComputedRefImpl(getter);
}

export class ComputedRefImpl<T = any> implements Subscriber {
  public dependencies: Set<Dependency> = new Set();
  private _value: any = undefined;
  dependency = new ComputedDependency(this);

  constructor(public getterFn: ComputedGetter<T>) { }

  notify(): void {
    // TODO Eviter les boucles infinies
    // TODO Passer en dirty
  }

  get value(): T {
    this.dependency.track();
    // TODO Faire la notion de DIRTY avec version
    this.refreshComputed();

    return this._value;
  }

  private refreshComputed(): void {
    const previousActiveSubscriber = activeSubscriber.current;
    activeSubscriber.current = this;

    this._value = this.getterFn(this._value);

    activeSubscriber.current = previousActiveSubscriber;

    // TODO Clean subscribers
  }
}
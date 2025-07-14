import { REACTIVITY_FLAGS } from "./constants";
import { Dependency } from "./dependency";

export interface Ref<T = any, U = T> {
  get value(): T
  set value(_: U)
};

export type UnwrapRef<T> = T extends Ref<infer V, unknown> ? UnwrapRef<V> : Ref<T>;

export function isRef<T>(r: Ref<T> | any): r is Ref<T> {
  return r && r[REACTIVITY_FLAGS.IS_REF] === true;
}

export function ref<T>(_value: T): UnwrapRef<T>
export function ref<T = any>(): Ref<T | undefined>
export function ref(_value?: unknown) {
  return new RefImpl(_value);
}


class RefImpl<T> {
  public readonly [REACTIVITY_FLAGS.IS_REF] = true;
  private _value: T;
  private _dependency = new Dependency();

  constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    this._dependency.track();
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    this._dependency.trigger();
  }
}
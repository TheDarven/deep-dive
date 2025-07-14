import type { Dependency } from "./dependency";

export interface Subscriber {
  dependencies: Set<Dependency>;
  notify: () => void;
}
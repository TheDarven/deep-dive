import type { ComputedRefImpl } from "./computed";
import type { Subscriber } from "./subscriber";

export const activeSubscriber: {
  current: Subscriber | undefined;
} = {
  current: undefined
}

export class Dependency {
  subscribers: Set<Subscriber> = new Set();

  track() {
    // TODO OPTI : ajouter dans subscribers QUE SI le subscriber.flags a EffectFlags.TRACKING
    // TODO OPTI : optimiser la mémoire dans isAlreadySubscribed() (faire comme le activeLink)
    // TODO OPTI : implémenter la désinscription
    // TODO FACULTATIF : avoir une liste chaînée pour déterminer l'ordre des subscriptions

    if (activeSubscriber.current) {
      this.subscribers.add(activeSubscriber.current);
      activeSubscriber.current.dependencies.add(this);
    }
  }

  trigger(): void {
    this.notify();
  }

  notify(): void {
    this.subscribers.forEach((subscriber) => subscriber.notify());
  }
}

export class ComputedDependency extends Dependency {

  constructor(private computed: ComputedRefImpl) {
    super();
  }

  notify(): void {
    // TODO Eviter les boucles infinies
    this.subscribers.forEach((subscriber) => subscriber.notify());
    this.computed.dependency.notify();
  }
}
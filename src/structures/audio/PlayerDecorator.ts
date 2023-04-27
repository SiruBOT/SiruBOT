import { PlayerDispatcher } from "@/structures/audio";

export function BreakOnDestroyed() {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const origDescriptor = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      if (!(this instanceof PlayerDispatcher))
        throw new Error(
          "This decorator can only be used with PlayerDispatcher class methods."
        );
      const methodParentClass = this as PlayerDispatcher;
      methodParentClass.log.debug(
        `@BreakOnDestroyed() ${propertyKey} method called.`,
        methodParentClass.destroyed
      );
      if (methodParentClass.destroyed) {
        methodParentClass.log.debug(
          `@BreakOnDestroyed() ${propertyKey} method called.`,
          methodParentClass.destroyed
        );
        return;
      }
      return origDescriptor.apply(this, args);
    };
  };
}

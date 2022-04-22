import { PlayerDispatcher } from "./PlayerDispatcher";

function BreakOnDestroyed() {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const origDescriptor = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args: any[]) {
      if (!(this instanceof PlayerDispatcher))
        throw new Error(
          "This decorator can only be used with PlayerDispatcher class methods."
        );
      const methodParentClass: PlayerDispatcher = this as PlayerDispatcher;
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
      } else {
        return origDescriptor.apply(this, args);
      }
    };
  };
}

export { BreakOnDestroyed };

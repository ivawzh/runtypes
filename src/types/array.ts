import { Runtype, Static, create, innerValidate } from '../runtype';
import { Failure } from '..';

type ArrayStaticType<E extends Runtype, RO extends boolean> = RO extends true
  ? ReadonlyArray<Static<E>>
  : Static<E>[];

interface Arr<E extends Runtype, RO extends boolean> extends Runtype<ArrayStaticType<E, RO>> {
  tag: 'array';
  element: E;
  isReadonly: RO;

  asReadonly(): Arr<E, true>;
}

/**
 * Construct an array runtype from a runtype for its elements.
 */
function InternalArr<E extends Runtype, RO extends boolean>(
  element: E,
  isReadonly: RO,
): Arr<E, RO> {
  return withExtraModifierFuncs(
    create(
      (xs, visited, opts) => {
        if (!Array.isArray(xs)) {
          return {
            success: false,
            errors: [
              {
                message: `Expected array, but was ${xs === null ? xs : typeof xs}`,
              },
            ],
          };
        }
        const errors: Failure['errors'] = [];
        for (const x of xs) {
          let validated = innerValidate(element, x, visited, opts);
          if (!validated.success) {
            const newErrors = validated.errors.map(err => ({
              ...err,
              key: err.key ? `[${xs.indexOf(x)}].${err.key}` : `[${xs.indexOf(x)}]`,
            }));
            if (opts.failFast) {
              return { success: false, errors: newErrors };
            } else {
              errors.push.apply(errors, newErrors);
            }
          }
        }
        if (errors.length !== 0) return { success: false, errors: errors };
        return { success: true, value: xs };
      },
      { tag: 'array', isReadonly, element },
    ),
  );
}

function Arr<E extends Runtype, RO extends boolean>(element: E): Arr<E, false> {
  return InternalArr(element, false);
}

function withExtraModifierFuncs<E extends Runtype, RO extends boolean>(A: any): Arr<E, RO> {
  A.asReadonly = asReadonly;

  return A;

  function asReadonly(): Arr<E, true> {
    return InternalArr(A.element, true);
  }
}

export { Arr as Array };

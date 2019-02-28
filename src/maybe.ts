import { Eff, Pure, Impure, Leaf, of, liftF } from './eff'
import { Exclude } from './util'

class NothingEffect {
  readonly _type = 'NothingEffect' as const
  readonly _R?: any
}

export type MaybeEffects = NothingEffect
export type Maybe<A> = Eff<MaybeEffects, A>

export function just<A>(a: A): Maybe<A> {
  return of(a)
}

export function nothing<A>(): Maybe<A> {
  return liftF(new NothingEffect())
}

type MaybeRunner<Z> = <F, A>(eff: Eff<F, A>) => Eff<Exclude<F, NothingEffect>, A | Z>

export function runMaybe(): MaybeRunner<null>
export function runMaybe<Z>(zero: Z): MaybeRunner<Z>
export function runMaybe<Z = null>(zero?: Z): MaybeRunner<Z> {
  const z = zero || null
  function runner<F, A>(eff: Eff<F, A>): Eff<Exclude<F, NothingEffect>, A | Z> {
    if (eff instanceof Pure) return of(eff.v)
    if (eff.fx instanceof NothingEffect) {
      return of(z as Z)
    } else {
      return new Impure(eff.fx as Exclude<F, NothingEffect>, new Leaf(x => runner(eff.k.apply(x))))
    }
  }
  return runner
}


import { Eff } from '../eff'
import { liftF } from '../util'
import { Effect } from '../effect'
import { Freer, pure, impure } from '../freer'
import { Boxed } from './boxed'

export type Maybe<A> =
  | {
      type: 'just'
      _Return?: A
      val: A
    }
  | {
      type: 'nothing'
      _Return?: A
    }

function just<A>(a: A): Maybe<A> {
  return {
    type: 'just',
    val: a,
  }
}

function nothing<A>(): Maybe<A> {
  return {
    type: 'nothing',
  }
}

export type MaybeEff<A> = Eff<A, Maybe<A>>

export function justM<A>(a: A): MaybeEff<A> {
  return liftF(just(a))
}

export function nothingM<A>(): MaybeEff<A> {
  return liftF(nothing())
}

type Diff<E extends Effect, D extends Effect> = E extends D ? never : E

export function runMaybe<A, EffectA extends Effect>(eff: Eff<A, EffectA>): Eff<Maybe<A>, Diff<EffectA, Maybe<A>>> {
  return new Boxed(runMaybeImpl(eff.freer))
}

function runMaybeImpl<A, EffectA extends Effect>(freer: Freer<A, EffectA>): Freer<Maybe<A>, Diff<EffectA, Maybe<A>>> {
  if (freer.type === 'pure') return pure(just(freer.val))
  if (isMaybe(freer.fx)) {
    const effect = freer.fx
    if (effect.type === 'just') {
      return runMaybeImpl(freer.k(effect.val))
    } else {
      return pure(nothing())
    }
  } else {
    return impure(freer.fx, x => runMaybeImpl(freer.k(x)))
  }
}

function isMaybe(effect: Effect): effect is Maybe<any> {
  return ['just', 'nothing'].includes(effect.type)
}

import { Eff } from '../eff'
import { fromFreer, liftF } from '../util'
import { Effect } from '../effect';
import { Freer, Impure, Leaf } from '../freer';

export type ReaderEffects<E> = Effect<'ask', E>

export type ReaderEff<E, A> = Eff<A, ReaderEffects<E>>

export function makeAsk<E>(): ReaderEff<E, E> {
  return liftF<ReaderEffects<E>>({ type: 'ask'})
}

type Diff<E extends Effect, D extends Effect> = E extends D ? never : E

type ReaderRunner<E> = <A, FA extends Effect>(eff: Eff<A, FA>) => Eff<A, Diff<FA, ReaderEffects<E>>>

export function runReader<E>(env: E): ReaderRunner<E> {
  function runReaderImpl<A, FA extends Effect>(freer: Freer<A, FA>): Freer<A, Diff<FA, ReaderEffects<E>>> {
    if (freer.type === 'Pure') return freer
    if (isReaderEffect<E>(freer.fx)) {
      return runReaderImpl(freer.k.apply(env))
    } else {
      return new Impure(freer.fx, new Leaf(x => runReaderImpl(freer.k.apply(x))))
    }
  }
  return eff => fromFreer(runReaderImpl(eff.freer))
}

function isReaderEffect<E>(effect: Effect): effect is ReaderEffects<E> {
  return effect.type === 'ask'
}
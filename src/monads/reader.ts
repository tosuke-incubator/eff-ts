import { Eff } from '../eff'
import { liftF } from '../util'
import { Effect } from '../effect';
import { Freer, pure, impure } from '../freer';
import { Boxed } from './boxed';

export type ReaderEffects<E> = {
  type: 'ask',
  _Return?: E
}

export type ReaderEff<E, A> = Eff<A, ReaderEffects<E>>

export function makeAsk<E>(): ReaderEff<E, E> {
  return liftF<ReaderEffects<E>>({ type: 'ask'})
}

type Diff<E extends Effect, D extends Effect> = E extends D ? never : E

type ReaderRunner<E> = <A, EffectsA extends Effect>(eff: Eff<A, EffectsA>) => Eff<A, Diff<EffectsA, ReaderEffects<E>>>

export function runReader<E>(env: E): ReaderRunner<E> {
  function runReaderImpl<A, EffectsA extends Effect>(freer: Freer<A, EffectsA>): Freer<A, Diff<EffectsA, ReaderEffects<E>>> {
    if (freer.type === 'pure') return freer
    if (isReaderEffect<E>(freer.fx)) {
      return runReaderImpl(freer.k(env))
    } else {
      return impure(freer.fx, x => runReaderImpl(freer.k(x)))
    }
  }
  return eff => new Boxed(runReaderImpl(eff.freer))
}

function isReaderEffect<E>(effect: Effect): effect is ReaderEffects<E> {
  return effect.type === 'ask'
}
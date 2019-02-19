import { Effect } from './effect'
import { Freer, pure, chainFreer } from './freer'

export interface Eff<A, EffectsA extends Effect> {
  readonly _Effects?: EffectsA
  readonly freer: Freer<A, EffectsA>
  map<B>(f: (x: A) => B): Eff<B, Effect<string, unknown>>
  chain<B>(f: (x: A) => Eff<B, Effect>): Eff<B, Effect<string, unknown>>
}

export type DeriveFreer<E extends Eff<any, any>> = E extends Eff<infer A, infer EffectsA> ? Freer<A, EffectsA> : never
export type MapFunc<A, B> = (a: A) => B
export type ChainFunc<A, B, EffectsB extends Effect> = (a: A) => Eff<B, EffectsB>

export function deriveMap<A, EffectsA extends Effect, B>(fa: Eff<A, EffectsA>, f: MapFunc<A, B>): Freer<B, Effect> {
  return chainFreer(fa.freer, (a: A) => pure(f(a)))
}

export function deriveChain<A, EffectsA extends Effect, B, EffectsB extends Effect>(fa: Eff<A, EffectsA>, f: ChainFunc<A, B, EffectsB>): Freer<B, EffectsB> {
  return chainFreer(fa.freer, (a: A) => f(a).freer)
}

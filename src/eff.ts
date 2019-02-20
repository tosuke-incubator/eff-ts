import { Effect } from './effect'
import { Freer, Pure } from './freer/index'

export interface Eff<A, FA extends Effect> {
  readonly _FA?: FA
  readonly freer: Freer<A, FA>
  map<B>(f: (x: A) => B): Eff<B, Effect<string, unknown>>
  chain<B>(f: (x: A) => Eff<B, Effect>): Eff<B, Effect<string, unknown>>
}

export type DeriveFreer<E extends Eff<any, any>> = E extends Eff<infer A, infer FA> ? Freer<A, FA> : never
export type MapFunc<A, B> = (a: A) => B
export type ChainFunc<A, B, FB extends Effect> = (a: A) => Eff<B, FB>

export function deriveMap<A, FA extends Effect, B>(fa: Eff<A, FA>, f: MapFunc<A, B>): Freer<B, Effect> {
  return fa.freer.chain((a: A) => new Pure(f(a)))
}

export function deriveChain<A, FA extends Effect, B, FB extends Effect>(fa: Eff<A, FA>, f: ChainFunc<A, B, FB>): Freer<B, FB> {
  return fa.freer.chain((a: A) => f(a).freer)
}

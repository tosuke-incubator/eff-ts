import { Effect, EffectReturnType } from '../effect'
import { Arrows } from './arrows'

export type Freer<A, FA extends Effect> = Pure<A> | Impure<A, FA, any, Effect>

interface FreerI<A> {
  chain<B, FB extends Effect>(f: (a: A) => Freer<B, FB>): Freer<B, FB>
}

export class Pure<A> implements FreerI<A> {
  readonly type = 'Pure' as const
  constructor(readonly value: A) {}

  chain<B, FB extends Effect>(f: (a: A) => Freer<B, FB>): Freer<B, FB> {
    return f(this.value)
  }
}

export class Impure<A, FA extends Effect, X extends EffectReturnType<FX> = any, FX extends Effect = Effect>
  implements FreerI<A> {
  readonly type = 'Impure' as const
  constructor(readonly fx: FX, readonly k: Arrows<X, A, FA>) {}

  chain<B, FB extends Effect>(f: (a: A) => Freer<B, FB>): Freer<B, FB> {
    return new Impure(this.fx, this.k.chain(f))
  }
}

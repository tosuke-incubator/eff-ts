import { Eff, MapFunc, ChainFunc } from '../eff'
import { Pure } from '../freer'

export type IdentityEff<A> = Eff<A, never>
export class Identity<A> implements IdentityEff<A> {
  readonly _URI = 'Identity' as const
  private constructor(readonly freer: Pure<A>) {}

  static of<A>(a: A): Identity<A> {
    return new Identity(new Pure(a))
  }

  static lift<A>(eff: IdentityEff<A>): Identity<A> {
    if (eff.freer.type === 'Pure') {
      return new Identity(eff.freer)
    } else {
      throw 'unreachable'
    }
  }

  map<B>(f: MapFunc<A, B>): Identity<B> {
    return Identity.of(f(this.freer.value))
  }

  chain<B>(f: ChainFunc<A, B, never>): Identity<B> {
    return Identity.lift(f(this.freer.value))
  }
}
import { Eff, MapFunc, ChainFunc } from '../eff'
import { Pure, pure } from '../freer'

export type IdentityEff<A> = Eff<A, never>
export class Identity<A> implements IdentityEff<A> {
  readonly _URI = 'Identity' as const
  private constructor(readonly freer: Pure<A>) {}

  static of<A>(a: A): Identity<A> {
    return new Identity(pure(a))
  }

  static lift<A>(eff: IdentityEff<A>): Identity<A> {
    if (eff.freer.type === 'pure') {
      return new Identity(eff.freer)
    } else {
      throw 'unreachable'
    }
  }

  map<B>(f: MapFunc<A, B>): Identity<B> {
    return Identity.of(f(this.freer.val))
  }

  chain<B>(f: ChainFunc<A, B, never>): Identity<B> {
    return Identity.lift(f(this.freer.val))
  }
}
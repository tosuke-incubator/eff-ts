import { Eff, MapFunc, ChainFunc } from './eff'
import { Effect, EffectReturnType } from './effect'
import { Freer, Pure ,Impure, Leaf } from './freer'
import { Identity } from './monads/identity'

class BoxedEff<A, FA extends Effect> implements Eff<A, FA> {
  readonly _URI = 'Boxed' as const
  constructor(readonly freer: Freer<A, FA>) {}

  map<B>(f: MapFunc<A, B>): never {
    throw new Error('Don\'t use without lifting.')
  }

  chain<B, EffectB extends Effect>(f: ChainFunc<A, B, EffectB>): never {
    throw new Error('Don\'t use without lifting.')
  }
}

export function of<A>(a: A): Identity<A> {
  return Identity.of(a)
}

export function fromFreer<A, FA extends Effect>(freer: Freer<A, FA>): BoxedEff<A, FA> {
  return new BoxedEff(freer)
}

const pureLeaf = new Leaf((a: any) => new Pure(a))
export function liftF<FA extends Effect>(effect: FA): BoxedEff<EffectReturnType<FA>, FA> {
  return fromFreer(new Impure(effect, pureLeaf))
}

export function run<A>(eff: Eff<A, never>): A {
  if (eff.freer.type === 'Pure') {
    return eff.freer.value
  } else {
    throw 'unreachable'
  }
}
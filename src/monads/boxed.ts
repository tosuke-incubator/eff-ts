import { Eff, MapFunc, ChainFunc } from '../eff'
import { Freer } from '../freer'
import { Effect } from '../effect'

export class Boxed<A, EffectA extends Effect> implements Eff<A, EffectA> {
  readonly _URI = 'Boxed' as const
  constructor(readonly freer: Freer<A, EffectA>) {}

  map<B>(f: MapFunc<A, B>): never {
    throw new Error('Don\'t use without lifting.')
  }

  chain<B, EffectB extends Effect>(f: ChainFunc<A, B, EffectB>): never {
    throw new Error('Don\'t use without lifting.')
  }
}
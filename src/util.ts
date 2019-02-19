import { Eff } from './eff'
import { Effect, EffectReturnType } from './effect'
import { impure, pure } from './freer'
import { Identity } from './monads/identity'
import { Boxed } from './monads/boxed'

export function of<A>(a: A): Identity<A> {
  return Identity.of(a)
}

export function liftF<EffectA extends Effect>(effect: EffectA): Boxed<EffectReturnType<EffectA>, EffectA> {
  return new Boxed(impure(effect, pure))
}

export function run<A>(eff: Eff<A, never>): A {
  if (eff.freer.type === 'pure') {
    return eff.freer.val
  } else {
    throw 'unreachable'
  }
}
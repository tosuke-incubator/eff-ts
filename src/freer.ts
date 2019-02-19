import { Effect, EffectReturnType } from './effect'

export interface Pure<A> {
  type: 'pure'
  val: A
}

export interface Impure<A, EffectsA extends Effect, X, EffectsX extends Effect> {
  type: 'impure'
  fx: EffectsX
  k: (x: X) => Freer<A, EffectsA>
}

export type Freer<A, EffectsA extends Effect> = Pure<A> | Impure<A, EffectsA, any, Effect>

export function pure<A>(a: A): Pure<A> {
  return {
    type: 'pure',
    val: a,
  }
}

export function impure<A, EffectsA extends Effect, X extends EffectReturnType<EffectsX> = any, EffectsX extends Effect = Effect>(
  fx: EffectsX,
  k: (x: EffectReturnType<EffectsX>) => Freer<A, EffectsA>,
): Impure<A, EffectsA, X, EffectsX> {
  return {
    type: 'impure',
    fx,
    k,
  }
}

export function chainFreer<A, EffectsA extends Effect, B, EffectsB extends Effect>(
  fa: Freer<A, EffectsA>,
  f: (a: A) => Freer<B, EffectsB>
): Freer<B, EffectsB> {
  if(fa.type === 'pure') {
    return f(fa.val)
  } else {
    return impure(fa.fx, (x: any) => chainFreer(fa.k(x), f))
  }
}

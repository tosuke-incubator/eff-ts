import { Arrows, Leaf } from './arrows'

abstract class EffBase<F, A> {
  readonly _A?: { _A: A }
  abstract map<B>(f: (a: A) => B): Eff<F, B>
  abstract mapTo<B>(b: B): Eff<F, B>
  abstract chain<E, B>(f: (a: A) => Eff<E, B>): Eff<F | E, B>
  abstract chainTo<E, B>(f: Eff<E, B>): Eff<F | E, B>

  run<B>(f1: (eff: Eff<F, A>) => B): B
  run<B, C>(f1: (eff: Eff<F, A>) => B, f2: (b: B) => C): C
  run<B, C, D>(f1: (eff: Eff<F, A>) => B, f2: (b: B) => C, f3: (c: C) => D): D
  run<B, C, D, E>(f1: (eff: Eff<F, A>) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E): E
  run<B, C, D, E, F>(f1: (eff: Eff<F, A>) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E, f5: (e: E) => F): F
  run<Z>(f1: (eff: Eff<F, A>) => any, ...fs: ((a: any) => any)[]): Z {
    const b = f1(this as unknown as Eff<F, A>)
    return fs.reduce((pre, cur) => cur(pre), b)
  }
}

type InferX<F> = F extends { _R?: infer R } ? R : any

export type Eff<F, A> = Pure<F, A> | Impure<F, A, any>

export class Pure<F, A> extends EffBase<F, A> {
  constructor(readonly v: A) { super() }

  map<B>(f: (a: A) => B): Eff<F, B> {
    return new Pure(f(this.v))
  }

  mapTo<B>(b: B): Eff<F, B> {
    return new Pure(b)
  }

  chain<E, B>(f: (a: A) => Eff<E, B>): Eff<F | E, B> {
    return f(this.v)
  }

  chainTo<E, B>(f: Eff<E, B>): Eff<F | E, B> {
    return f
  }
}

export class Impure<F, A, X> extends EffBase<F, A> {
  readonly _F?: F
  constructor(readonly fx: F, readonly k: Arrows<F, X, A>) { super() }

  map<B>(f: (a: A) => B): Eff<F, B> {
    return this.chain((a: A) => new Pure(f(a)))
  }

  mapTo<B>(b: B): Eff<F, B> {
    return this.chain(() => new Pure(b))
  }

  chain<E, B>(f: (a: A) => Eff<E, B>): Eff<F | E, B> {
    return new Impure<F | E, B, any>(this.fx, this.k.chain(f as any))
  }

  chainTo<E, B>(f: Eff<E, B>): Eff<F | E, B> {
    return this.chain(() => f)
  }
}
export function of<F = never>(): Eff<F, void>
export function of<A, F = never>(a: A): Eff<F, A>
export function of(a: any = undefined) {
  return new Pure(a)
}

export function liftF<F, A = InferX<F>>(f: F): Eff<F, A> {
  return new Impure(f, new Leaf((x: any) => new Pure(x)))
}

export function runEff<A>(eff: Eff<never, A>): A {
  if(eff instanceof Pure) return eff.v
  throw new Error('Don\'t run the Eff which has effect(s)')
}
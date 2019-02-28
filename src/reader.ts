import { Eff, Pure, Impure, Leaf, liftF } from './eff'
import { Exclude } from './util'

class AskEffect<E> {
  readonly _type = 'AskEffect' as const
  readonly _R?: E
}

export type ReaderEffects<E> = AskEffect<E>
export type Reader<E, A> = Eff<ReaderEffects<E>, A>

export function ask<E>(): Reader<E, E> {
  return liftF(new AskEffect())
}

type ReaderRunner<E> = <F, A>(eff: Eff<F, A>) => Eff<Exclude<F, ReaderEffects<E>>, A>

export function runReader<E>(env: E): ReaderRunner<E> {
  const runner: ReaderRunner<E> = eff => {
    if (eff instanceof Pure) return new Pure(eff.v)
    if (eff.fx instanceof AskEffect) {
      return runner(eff.k.apply(env))
    } else {
      return new Impure(eff.fx as any, new Leaf(x => runner(eff.k.apply(x))))
    }
  }
  return runner
}
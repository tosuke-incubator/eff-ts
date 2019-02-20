import { Eff } from '../eff'
import { fromFreer, liftF } from '../util'
import { Effect } from '../effect'
import { Freer, Pure, Impure, Leaf } from '../freer'

type GetEffect<S> = Effect<'get', S>
type PutEffect<S> = Effect<'put', void> & { v: S }
export type StateEffects<S> = GetEffect<S> | PutEffect<S>

export type StateEff<S, A> = Eff<A, StateEffects<S>>

export function makeGet<S>(): StateEff<S, S> {
  return liftF<GetEffect<S>>({ type: 'get' })
}

export function put<S>(v: S): StateEff<S, void> {
  return liftF<PutEffect<S>>({ type: 'put', v })
}

export function modify<S>(f: (old: S) => S): StateEff<S, void> {
  const freer = makeGet<S>().freer.chain(s => put(f(s)).freer)
  return fromFreer(freer)
}

type Diff<E extends Effect, D extends Effect> = E extends D ? never : E

export interface WithState<S, A> {
  state: S
  value: A
}

type StateRunner<S> = <A, FA extends Effect>(eff: Eff<A, FA>) => Eff<WithState<S, A>, Diff<FA, StateEffects<S>>>

export function runState<S>(initialState: S): StateRunner<S> {
  return eff => fromFreer(runStateImpl(eff.freer, initialState))
}

function runStateImpl<S, A, FA extends Effect>(f: Freer<A, FA>, state: S): Freer<WithState<S, A>, Diff<FA, StateEffects<S>>> {
  if(f.type === 'Pure') return new Pure({ state, value: f.value })
  if(isStateEffect<S>(f.fx)) {
    const eff = f.fx
    if (eff.type === 'get') {
      return runStateImpl(f.k.apply(state), state)
    } else {
      return runStateImpl(f.k.apply(void 0), eff.v)
    }
  } else {
    return new Impure(f.fx, new Leaf(x => runStateImpl(f.k.apply(x), state)))
  }
}

function isStateEffect<S>(effect: Effect): effect is StateEffects<S> {
  return ['get', 'put'].includes(effect.type)
}
import { Eff, Pure, Impure, Leaf, liftF } from './eff'
import { Exclude } from './util'

abstract class StateEffectBase<S> {
  readonly _S?: S
}

class GetEffect<S> extends StateEffectBase<S> {
  readonly _R?: S
  constructor() { super() }
}

class PutEffect<S> extends StateEffectBase<S> {
  readonly _R?: void
  constructor(readonly newState: S) { super() }
}

export type StateEffects<S> = GetEffect<S> | PutEffect<S>
export type State<S, A> = Eff<StateEffects<S>, A>

export function get<S>(): State<S,S> {
  return liftF(new GetEffect<S>())
}

export function put<S>(newState: S): State<S, void> {
  return liftF(new PutEffect(newState))
}

export function modify<S>(f: (state: S) => S): State<S, void> {
  return get<S>().chain(s => put(f(s)))
}

class WithState<S, A> {
  constructor(readonly state: S, readonly value: A) {}
}

type StateRunner<S> = <F, A>(eff: Eff<F, A>) => Eff<Exclude<F, StateEffects<S>>, WithState<S, A>>

export function runState<S>(initialState: S): StateRunner<S> {
  return eff => runStateImpl(eff, initialState)
}

function runStateImpl<S, F, A>(eff: Eff<F, A>, state: S): Eff<Exclude<F, StateEffects<S>>, WithState<S, A>> {
  if (eff instanceof Pure) return new Pure(new WithState(state, eff.v))
  if (eff.fx instanceof StateEffectBase) {
    if (eff.fx instanceof GetEffect) {
      return runStateImpl(eff.k.apply(state), state)
    } else if (eff.fx instanceof PutEffect) {
      return runStateImpl(eff.k.apply(undefined), eff.fx.newState)
    } else {
      throw 'unreachable'
    }
  } else {
    const fx = eff.fx as Exclude<F, StateEffects<S>>
    return new Impure(fx, new Leaf(x => runStateImpl(eff.k.apply(x), state)))
  }
}
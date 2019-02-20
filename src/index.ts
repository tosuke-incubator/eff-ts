import { of, run } from './util'
import { Eff, DeriveFreer, MapFunc, ChainFunc, deriveChain, deriveMap } from './eff'
import { Maybe, MaybeEff, runMaybe, justM, nothingM } from './monads/maybe'
import { ReaderEffects, makeAsk, runReader } from './monads/reader'
import { StateEffects, makeGet, modify, runState } from './monads/state'

// Identityモナド
const m1 = of(10).chain(x => of(x * 100))

console.log(run(m1))

// Maybeを実体化
class MaybeM<A> implements MaybeEff<A> {
  readonly _URI = 'Maybe' as const
  constructor(readonly freer: DeriveFreer<MaybeEff<A>>) {}

  static lift<A>(eff: MaybeEff<A>): MaybeM<A> {
    return new MaybeM(eff.freer)
  }

  map<B>(f: MapFunc<A, B>): MaybeM<B> {
    return new MaybeM(deriveMap(this, f))
  }

  chain<B, EB extends Maybe<B>>(f: ChainFunc<A, B, EB>): MaybeM<B> {
    return new MaybeM(deriveChain(this, f))
  }
}

// 処理を書いてみる
function safeDiv(n: number, d: number): MaybeEff<number> {
  if (d === 0) return nothingM()
  return justM(n / d)
}

// Maybeモナドで処理をしてみる
const m2 = MaybeM.lift(safeDiv(4, 2))
  .chain(n => safeDiv(n, 1))
  .map(x => `${x}`)

console.log(run(runMaybe(m2))) // --> nothing

// MaybeとReaderを混ぜてみる
type Env = number
type MaybeReaderEffects<A> = Maybe<A> | ReaderEffects<Env>
type MaybeReaderEff<A> = Eff<A, MaybeReaderEffects<A>>
class MaybeReader<A> implements MaybeReaderEff<A> {
  readonly _URI = 'MaybeReader' as const
  constructor(readonly freer: DeriveFreer<MaybeReaderEff<A>>) {}

  static lift<A>(eff: MaybeReaderEff<A>): MaybeReader<A> {
    return new MaybeReader(eff.freer)
  }

  map<B>(f: MapFunc<A, B>): MaybeReader<B> {
    return new MaybeReader(deriveMap(this, f))
  }

  chain<B, EB extends MaybeReaderEffects<B>>(f: ChainFunc<A, B, EB>): MaybeReader<B> {
    return new MaybeReader(deriveChain(this, f))
  }
}
// Env = number

const ask = makeAsk<Env>()

const m3 = MaybeReader.lift(ask).chain(n => safeDiv(12, n - 1))

function runMaybeReader(env: Env): <A>(eff: MaybeReaderEff<A>) => Maybe<A> {
  return eff => run(runMaybe(runReader(env)(eff)))
}

console.log(runMaybeReader(1)(m3)) // nothing
console.log(runMaybeReader(4)(m3)) // just 4


// State + Maybe
type State = { x: number; y: number }
type MaybeStateEffects<A> = StateEffects<State> | Maybe<A>
type MaybeStateEff<A> = Eff<A, MaybeStateEffects<A>>
class MaybeState<A> implements MaybeStateEff<A> {
  readonly _URI = 'MaybeState' as const
  constructor(readonly freer: DeriveFreer<MaybeStateEff<A>>) {}

  static lift<A>(eff: MaybeStateEff<A>): MaybeState<A> {
    return new MaybeState(eff.freer)
  }

  map<B>(f: MapFunc<A, B>): MaybeState<B> {
    return new MaybeState(deriveMap(this, f))
  }

  chain<B, FB extends MaybeStateEffects<B>>(f: ChainFunc<A, B, FB>): MaybeState<B> {
    return new MaybeState(deriveChain(this, f))
  }
}

const get = makeGet<State>()

const up = (n: number = 1) => modify<State>(s => ({ ...s, y: s.y + n }))
const down = (n: number = 1) => modify<State>(s => ({ ...s, y: s.y - n }))
const right = (n: number = 1) => modify<State>(s => ({ ...s, x: s.x + n }))
const left = (n: number = 1) => modify<State>(s => ({ ...s, x: s.x - n }))

const m4 = MaybeState.lift(of(0))
  .chain(() => up(2))
  .chain(() => right(2))
  .chain(() => down())
  .chain(() => left())
  .chain(() => get)
  .chain(({ x, y }) => safeDiv(x, y))

console.log(run(runState({ x: 1, y: 1})(runMaybe(m4))))

// runnerの組み合わせで挙動が変化することを確認する
const initial = {
  x: 1, y: -1
}
console.log(run(runMaybe(runState(initial)(m4)))) // Stateが残らない(Maybe<WithState<State, number>>)
console.log(run(runState(initial)(runMaybe(m4)))) // Stateが残る(WithState<State, Maybe<number>>)

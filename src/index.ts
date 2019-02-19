import { of, run } from './util'
import { Eff, DeriveFreer, MapFunc, ChainFunc, deriveChain, deriveMap } from './eff'
import { Maybe,  MaybeEff, runMaybe, justM, nothingM } from './monads/maybe'
import { ReaderEffects, makeAsk, runReader } from './monads/reader';

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

const m2 = MaybeM.lift(safeDiv(4, 2)).chain(n => safeDiv(n, 1)).map(x => `${x}`)

console.log(run(runMaybe(m2))) // --> nothing

// モナドを混ぜてみる
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
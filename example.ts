import {
  Eff,
  of,
  runEff,
  Maybe,
  just,
  nothing,
  runMaybe,
  Reader,
  ask,
  runReader,
  ReaderEffects,
  State,
  StateEffects,
  get,
  put,
  modify,
  runState,
} from './src'

console.log('Identity')
const m1 = of(10).map(x => [x * 2, x ** 2])
console.log(m1.run(runEff))

console.log('Maybe')

function safeDiv(n: number, d: number): Maybe<number> {
  if (d === 0) return nothing()
  return just(n / d)
}

const m2 = safeDiv(4, 2)
  .chain(n => safeDiv(n, 0))
  .map(x => `${x}`)

console.log(m2.run(runMaybe(), runEff))

console.log('Reader')

const m3 = ask<number>().map(x => [x * 2, x ** 2])

console.log(m3.run(runReader(10), runEff))

console.log('Reader + Maybe')

const m4 = ask<number>().chain(x => safeDiv(12, x))

console.log(m4.run(runReader(2), runMaybe(), runEff))
console.log(m4.run(runReader(0), runMaybe(), runEff))

console.log('State')

interface Pos {
  x: number
  y: number
}

const up = (n: number) => modify<Pos>(s => ({ ...s, y: s.y + n }))
const down = (n: number) => modify<Pos>(s => ({ ...s, y: s.y - n }))
const right = (n: number) => modify<Pos>(s => ({ ...s, x: s.x + n }))
const left = (n: number) => modify<Pos>(s => ({ ...s, x: s.x - n }))

const m5 = of()
  .chainTo(up(2))
  .chainTo(right(2))
  .chainTo(down(1))
  .chainTo(left(1))
  .chainTo(get<Pos>())
  .map(({ x, y }) => x + y)

console.log(m5.run(runState({x: 1, y: 1}), runEff))

console.log('State + Maybe')

const m6 = of()
  .chainTo(up(2))
  .chainTo(right(2))
  .chainTo(down(1))
  .chainTo(left(1))
  .chainTo(get<Pos>())
  .chain(({ x, y }) => safeDiv(x, y))

console.log(m6.run(runMaybe(), runState({ x: 1, y: 1}), runEff))

const initial = { x: 1, y: -1 }

console.log(m6.run(runState(initial), runMaybe(), runEff)) // WithState<Pos, number> | null
console.log(m6.run(runMaybe(), runState(initial), runEff)) // WithState<Pos, number | null>

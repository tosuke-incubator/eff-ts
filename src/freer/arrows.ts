import { Effect } from '../effect'
import { Freer, Impure } from './freer'

// (a: A) => Freer<B, FB> を表現する木構造
// 合成(kleisli composition)(O(1))と適用(ほぼO(n))ができる
export type Arrows<A, B, FB extends Effect> = Leaf<A, B, FB> | Node<A, any, Effect, B, FB>

function chainArrows<A, B, FB extends Effect, C, FC extends Effect>(
  fab: Arrows<A, B, FB>,
  f: (b: B) => Freer<C, FC>,
): Arrows<A, C, FC> {
  return new Node(fab, new Leaf(f))
}

function concatArrows<A, B, FB extends Effect, C, FC extends Effect>(
  fab: Arrows<A, B, FB>,
  fbc: Arrows<B, C, FC>,
): Arrows<A, C, FC> {
  return new Node(fab, fbc)
}

function getView<A, B, FB extends Effect>(fab: Arrows<A, B, FB>): View<A, B, FB> {
  if (fab.type === 'Leaf') return new One(fab.f)
  // Node
  function go<T, FT extends Effect>(x: Arrows<A, T, FT>, y: Arrows<T, B, FB>): View<A, B, FB> {
    if (x.type === 'Leaf') {
      return new Cons(x.f, y)
    } else {
      return go(x.left, new Node(x.right, y))
    }
  }
  return go(fab.left, fab.right)
}

function applyArrows<A, B, FB extends Effect>(fab: Arrows<A, B, FB>, a: A): Freer<B, FB> {
  function go<T>(fab: Arrows<T, B, FB>, t: T): Freer<B, FB> {
    const view = getView(fab)
    if (view.type === 'One') {
      return view.f(t)
    } else {
      const res = view.f(t)
      if (res.type === 'Pure') {
        return go(view.k, res.value)
      } else {
        return new Impure(res.fx, res.k.concat(view.k))
      }
    }
  }
  return go(fab, a)
}

export class Leaf<A, B, FB extends Effect> {
  readonly type = 'Leaf' as const
  constructor(readonly f: (a: A) => Freer<B, FB>) {}

  chain<C, FC extends Effect>(f: (b: B) => Freer<C, FC>): Arrows<A, C, FC> {
    return chainArrows(this, f)
  }

  concat<C, FC extends Effect>(q: Arrows<B, C, FC>): Arrows<A, C, FC> {
    return concatArrows(this, q)
  }

  apply(a: A): Freer<B, FB> {
    return applyArrows(this, a)
  }
}

export class Node<A, B, FB extends Effect, C, FC extends Effect> {
  readonly type = 'Node' as const
  constructor(readonly left: Arrows<A, B, FB>, readonly right: Arrows<B, C, FC>) {}

  chain<D, FD extends Effect>(f: (c: C) => Freer<D, FD>): Arrows<A, D, FD> {
    return chainArrows(this, f)
  }

  concat<D, FD extends Effect>(q: Arrows<C, D, FD>): Arrows<A, D, FD> {
    return concatArrows(this, q)
  }

  apply(a: A): Freer<C, FC> {
    return applyArrows(this, a)
  }
}

type View<A, B, FB extends Effect> = One<A, B, FB> | Cons<A, any, Effect, B, FB>

class One<A, B, FB extends Effect> {
  readonly type = 'One' as const
  constructor(readonly f: (a: A) => Freer<B, FB>) {}
}

class Cons<A, B, FB extends Effect, C, FC extends Effect> {
  readonly type = 'Cons' as const
  constructor(readonly f: (a: A) => Freer<B, FB>, readonly k: Arrows<B, C, FC>) {}
}

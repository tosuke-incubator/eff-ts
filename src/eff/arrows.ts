import { Eff, Pure, Impure } from './eff'

export type Arrows<F, A, B> = Leaf<F, A, B> | Node<F, A, any, B>

interface ArrowsOp<F, A, B> {
  chain<C>(f: (b: B) => Eff<F, C>): Arrows<F, A, C>
  concat<C>(q: Arrows<F, B, C>): Arrows<F, A, C>
  apply(a: A): Eff<F, B>
}

function chainImpl<F, A, B, C>(fab: Arrows<F, A, B>, f: (b: B) => Eff<F, C>): Arrows<F, A, C> {
  return new Node(fab, new Leaf(f))
}

function concatImpl<F, A, B, C>(fab: Arrows<F, A, B>, fbc: Arrows<F, B, C>): Arrows<F, A, C> {
  return new Node(fab, fbc)
}

function applyImpl<F, A, B>(f: Arrows<F, A, B>, a: A): Eff<F, B> {
  function go<X>(f: Arrows<F, X, B>, x: X): Eff<F, B> {
    const view = fromArrows(f)
    if(view instanceof One) {
      return view.f(x)
    } else {
      const r = view.f(x)
      if (r instanceof Pure) {
        return go(view.k, r.v)
      } else {
        const k = r.k
        return new Impure(r.fx, r.k.concat(view.k))
      }
    }
  }
  return go(f, a)
}

export class Leaf<F, A, B> implements ArrowsOp<F, A, B> {
  constructor(readonly f: (a: A) => Eff<F, B>) {}

  chain<C>(f: (b: B) => Eff<F, C>): Arrows<F, A, C> {
    return chainImpl(this, f)
  }

  concat<C>(q: Arrows<F, B, C>): Arrows<F, A, C> {
    return concatImpl(this, q)
  }

  apply(a: A): Eff<F, B> {
    return applyImpl(this, a)
  }
}

export class Node<F, A, B, C> implements ArrowsOp<F, A, C> {
  constructor(readonly left: Arrows<F, A, B>, readonly right: Arrows<F, B, C>) {}

  chain<D>(f: (c: C) => Eff<F, D>): Arrows<F, A, D> {
    return chainImpl(this, f)
  }

  concat<D>(q: Arrows<F, C, D>): Arrows<F, A, D> {
    return concatImpl(this, q)
  }

  apply(a: A): Eff<F, C> {
    return applyImpl(this, a)
  }
}

type View<F, A, B> = One<F, A, B> | Cons<F, A, any, B>

function fromArrows<F, A, B>(f: Arrows<F, A, B>): View<F, A, B> {
  if(f instanceof Leaf) return new One(f.f)

  function go<X>(x: Arrows<F, A, X>, y: Arrows<F, X, B>): View<F, A, B> {
    if(x instanceof Leaf) {
      return new Cons(x.f, y)
    } else {
      return go(x.left, new Node(x.right, y))
    }
  }
  return go(f.left, f.right)
}

class One<F, A, B> {
  constructor(readonly f: (a: A) => Eff<F, B>) {}
}

class Cons<F, A, B, C> {
  constructor(readonly f: (a: A) => Eff<F, B>, readonly k: Arrows<F, B, C>) {}
}
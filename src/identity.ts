import { Eff } from './eff'

export type Identity<A> = Eff<never, A>